// @ts-expect-error Supabase Edge Functions use npm: specifiers in the Deno runtime.
import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

// @ts-expect-error Deno is a global provided by the Supabase Edge runtime.
declare const Deno: {
  env: {
    get: (name: string) => string | undefined;
  };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

class HttpError extends Error {
  status: number;
  payload: Record<string, unknown>;

  constructor(status: number, message: string, payload: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

const buildJsonResponse = (payload: Record<string, unknown>, status: number, corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const buildBurstRateLimitMessage = (retryAfterSeconds: unknown): string => {
  const retryAfter =
    typeof retryAfterSeconds === "number" && Number.isFinite(retryAfterSeconds)
      ? Math.max(1, Math.ceil(retryAfterSeconds))
      : null;

  return retryAfter
    ? `You're sending AI requests too quickly. Please wait ${retryAfter}s and try again.`
    : "You're sending AI requests too quickly. Please wait a moment and try again.";
};

const extractProviderMessage = async (response: Response): Promise<string> => {
  try {
    const payload = await response.clone().json();
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : typeof payload?.message === "string"
          ? payload.message
          : "";
    if (message.trim()) return message.trim();
  } catch {
    // Fall through to text parsing.
  }

  try {
    const text = (await response.clone().text()).trim();
    if (text) return text.slice(0, 300);
  } catch {
    // Fall through to status-based fallback.
  }

  if (response.status === 404) return "AI provider model is unavailable right now.";
  if (response.status === 429) return "AI provider is rate limited. Please try again in a moment.";
  if (response.status >= 500) return "AI provider is temporarily unavailable. Please try again shortly.";
  return `AI provider returned ${response.status}.`;
};

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

 const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return buildJsonResponse({ error: "AUTH_REQUIRED", message: "Missing auth header." }, 401, corsHeaders);
  }



  try {
    const { prompt, expectJson } = await req.json();

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey) throw new Error("GEMINI_API_KEY secret not set.");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase internal secrets missing.");

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Authenticate user from JWT
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return buildJsonResponse({ error: "INVALID_JWT", message: "Missing bearer token." }, 401, corsHeaders);
    }
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return buildJsonResponse(
        { error: "INVALID_JWT", message: "Your session is invalid or expired. Please sign in again." },
        401,
        corsHeaders,
      );
    }

    const { data: rateGate, error: rateGateError } = await supabaseClient
      .rpc("reserve_ai_request_slot", { user_id_param: user.id })
      .single();

    if (rateGateError || !rateGate) {
      throw new HttpError(500, "Failed to reserve AI request slot.", {
        error: "RATE_GATE_FAILED",
        details: rateGateError?.message || "Unknown error",
      });
    }

    if (!rateGate.allowed) {
      const isConcurrentLimit = rateGate.reason === "concurrent_limit";

      return buildJsonResponse({
        error: isConcurrentLimit ? "CONCURRENT_LIMIT" : "RATE_LIMITED",
        message: isConcurrentLimit
          ? "Another AI request is already running. Please wait for it to finish."
          : buildBurstRateLimitMessage(rateGate.retry_after_seconds),
        retryAfterSeconds: rateGate.retry_after_seconds,
        concurrentLimit: rateGate.concurrent_limit,
        burstLimit: rateGate.burst_limit,
        windowSeconds: rateGate.window_seconds,
      }, 429, corsHeaders);
    }

    let shouldRefundCredit = false;

    try {
      const { data: usageGate, error: usageGateError } = await supabaseClient
        .rpc("consume_ai_credit", { user_id_param: user.id })
        .single();

      if (usageGateError || !usageGate) {
        throw new HttpError(500, "Failed to reserve AI usage.", {
          error: "USAGE_GATE_FAILED",
          details: usageGateError?.message || "Unknown error",
        });
      }

      shouldRefundCredit = Boolean(usageGate.counted);

      if (!usageGate.allowed) {
        return buildJsonResponse({
          error: "PAYMENT_REQUIRED",
          message: "Daily AI limit reached. Try again after 00:00 UTC.",
          usedCredits: usageGate.used_credits,
          creditLimit: usageGate.credit_limit,
        }, 402, corsHeaders);
      }

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                ...(expectJson ? { responseMimeType: "application/json" } : {}),
              },
            }),
          }
        );

        if (!res.ok) {
          const providerMessage = await extractProviderMessage(res);
          throw new HttpError(res.status === 429 ? 429 : 502, providerMessage, {
            error: "AI_PROVIDER_ERROR",
            providerStatus: res.status,
          });
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (!text.trim()) {
          throw new HttpError(502, "AI provider returned an empty response.", {
            error: "AI_PROVIDER_EMPTY",
          });
        }

        shouldRefundCredit = false;

        return buildJsonResponse({
          text,
          usage: {
            usedCredits: usageGate.used_credits,
            creditLimit: usageGate.credit_limit,
            planTier: usageGate.plan_tier,
          },
        }, 200, corsHeaders);
      } catch (providerError) {
        if (shouldRefundCredit) {
          const { error: refundError } = await supabaseClient.rpc("refund_ai_credit", { user_id_param: user.id });
          if (refundError) {
            console.error("Failed to refund AI credit:", refundError);
          }
        }
        throw providerError;
      }
    } finally {
      const { error: releaseError } = await supabaseClient.rpc("release_ai_request_slot", {
        user_id_param: user.id,
      });
      if (releaseError) {
        console.error("Failed to release AI request slot:", releaseError);
      }
    }
  } catch (err) {
    if (err instanceof HttpError) {
      return buildJsonResponse(
        { error: err.payload.error || "REQUEST_FAILED", message: err.message, ...err.payload },
        err.status,
        corsHeaders,
      );
    }

    const message = err instanceof Error ? err.message : "Unexpected AI server failure.";
    return buildJsonResponse(
      { error: "UNEXPECTED_SERVER_ERROR", message },
      500,
      corsHeaders,
    );
  }
});
