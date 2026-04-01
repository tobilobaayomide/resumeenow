// @ts-expect-error Supabase Edge Functions use npm: specifiers in the Deno runtime.
import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

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

type GeminiProxyRequestPayload = {
  prompt?: unknown;
  expectJson?: unknown;
  stream?: unknown;
};

type GeminiUsagePayload = {
  usedCredits: number | null;
  creditLimit: number | null;
  planTier: string | null;
};

type GeminiProxySuccessPayload = {
  text: string;
  usage: GeminiUsagePayload;
};

type BeginAiRequestResult = {
  allowed: boolean;
  error_code: string | null;
  plan_tier: string | null;
  reason: string | null;
  retry_after_seconds: number | null;
  active_requests: number | null;
  concurrent_limit: number | null;
  request_count: number | null;
  burst_limit: number | null;
  window_seconds: number | null;
  used_credits: number | null;
  credit_limit: number | null;
  counted: boolean | null;
};

type GeminiProgressPhase = "checking_limits" | "generating" | "finalizing";

type GeminiProgressEmitter = (
  phase: GeminiProgressPhase,
  label?: string,
) => void | Promise<void>;

const buildJsonResponse = (payload: Record<string, unknown>, status: number, corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const buildSseResponse = (stream: ReadableStream<Uint8Array>, corsHeaders: Record<string, string>) =>
  new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });

const encodeSseEvent = (event: string, payload: Record<string, unknown>) =>
  `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

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

const executeGeminiRequest = async ({
  authHeader,
  prompt,
  expectJson,
  emitStatus,
}: {
  authHeader: string;
  prompt: string;
  expectJson: boolean;
  emitStatus?: GeminiProgressEmitter;
}): Promise<GeminiProxySuccessPayload> => {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!apiKey) throw new Error("GEMINI_API_KEY secret not set.");
  if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase internal secrets missing.");

  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new HttpError(401, "Missing bearer token.", { error: "INVALID_JWT" });
  }

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

  if (userError || !user) {
    throw new HttpError(401, "Your session is invalid or expired. Please sign in again.", {
      error: "INVALID_JWT",
    });
  }

  await emitStatus?.("checking_limits");

  const { data: aiGate, error: aiGateError } = await supabaseClient
    .rpc("begin_ai_request", { user_id_param: user.id })
    .single();

  const beginRequest = aiGate as BeginAiRequestResult | null;

  if (aiGateError || !beginRequest) {
    throw new HttpError(500, "Failed to begin AI request.", {
      error: "AI_GATE_FAILED",
      details: aiGateError?.message || "Unknown error",
    });
  }

  if (!beginRequest.allowed) {
    const errorCode = beginRequest.error_code;
    if (errorCode === "PAYMENT_REQUIRED") {
      throw new HttpError(402, "Daily AI limit reached. Try again after 00:00 UTC.", {
        error: "PAYMENT_REQUIRED",
        usedCredits: beginRequest.used_credits,
        creditLimit: beginRequest.credit_limit,
      });
    }

    const isConcurrentLimit = errorCode === "CONCURRENT_LIMIT";

    throw new HttpError(
      429,
      isConcurrentLimit
        ? "Another AI request is already running. Please wait for it to finish."
        : buildBurstRateLimitMessage(beginRequest.retry_after_seconds),
      {
        error: isConcurrentLimit ? "CONCURRENT_LIMIT" : "RATE_LIMITED",
        retryAfterSeconds: beginRequest.retry_after_seconds,
        concurrentLimit: beginRequest.concurrent_limit,
        burstLimit: beginRequest.burst_limit,
        windowSeconds: beginRequest.window_seconds,
      },
    );
  }

  const shouldRefundCredit = Boolean(beginRequest.counted);

  const completeAiRequest = async (refundCredit: boolean) => {
    const { error: completeError } = await supabaseClient.rpc("complete_ai_request", {
      user_id_param: user.id,
      refund_credit: refundCredit,
      counted: shouldRefundCredit,
    });
    if (completeError) {
      console.error("Failed to complete AI request:", completeError);
    }
  };

  try {
    await emitStatus?.("generating");

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
      },
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

    await emitStatus?.("finalizing");
    await completeAiRequest(false);

    return {
      text,
      usage: {
        usedCredits: beginRequest.used_credits,
        creditLimit: beginRequest.credit_limit,
        planTier: beginRequest.plan_tier,
      },
    };
  } catch (providerError) {
    await completeAiRequest(true);
    throw providerError;
  }
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
    const payload = (await req.json()) as GeminiProxyRequestPayload;
    const prompt = typeof payload.prompt === "string" ? payload.prompt : "";
    const expectJson = Boolean(payload.expectJson);
    const stream = payload.stream === true;

    if (!prompt.trim()) {
      return buildJsonResponse({ error: "INVALID_REQUEST", message: "Missing AI prompt." }, 400, corsHeaders);
    }

    if (stream) {
      const encoder = new TextEncoder();
      const sseStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const send = (event: string, eventPayload: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(encodeSseEvent(event, eventPayload)));
          };

          try {
            const result = await executeGeminiRequest({
              authHeader,
              prompt,
              expectJson,
              emitStatus: (phase, label) => {
                send("status", { phase, label });
              },
            });

            send("result", result);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unexpected AI server failure.";
            const status = err instanceof HttpError ? err.status : 500;
            send("error", { message, status });
          } finally {
            controller.close();
          }
        },
      });

      return buildSseResponse(sseStream, corsHeaders);
    }

    const result = await executeGeminiRequest({
      authHeader,
      prompt,
      expectJson,
    });

    return buildJsonResponse(result, 200, corsHeaders);
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
