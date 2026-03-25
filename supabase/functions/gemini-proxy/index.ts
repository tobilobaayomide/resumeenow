// @ts-expect-error Supabase Edge Functions use npm: specifiers in the Deno runtime.
import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

// @ts-expect-error Deno is a global provided by the Supabase Edge runtime.
declare const Deno: {
  env: {
    get: (name: string) => string | undefined;
  };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
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
    return new Response(JSON.stringify({ error: "Missing auth header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid generic auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: usageGate, error: usageGateError } = await supabaseClient
      .rpc("consume_ai_credit", { user_id_param: user.id })
      .single();

    if (usageGateError || !usageGate) {
      throw new Error(`Failed to consume AI credit: ${usageGateError?.message || "Unknown error"}`);
    }

    const isPro = usageGate.plan_tier === "pro";
    let shouldRefundCredit = Boolean(usageGate.counted);

    // 2. Enforce Limit
    if (!usageGate.allowed) {
      return new Response(JSON.stringify({
        error: "PAYMENT_REQUIRED",
        message: "Daily AI limit reached. Try again after 00:00 UTC.",
        usedCredits: usageGate.used_credits,
        creditLimit: usageGate.credit_limit,
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Call Gemini with the credit already reserved server-side.
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
        throw new Error(`Gemini provider returned ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (!text.trim()) {
        throw new Error("Gemini returned an empty response.");
      }

      shouldRefundCredit = false;

      return new Response(JSON.stringify({
        text,
        usage: {
          usedCredits: usageGate.used_credits,
          creditLimit: usageGate.credit_limit,
          planTier: usageGate.plan_tier,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (providerError) {
      if (!isPro && shouldRefundCredit) {
        const { error: refundError } = await supabaseClient.rpc("refund_ai_credit", { user_id_param: user.id });
        if (refundError) {
          console.error("Failed to refund AI credit:", refundError);
        }
      }
      throw providerError;
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
