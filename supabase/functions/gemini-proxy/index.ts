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

    // 2. Fetch Usage and Subscription
    const [subRes, usageRes] = await Promise.all([
      supabaseClient.from('user_subscriptions').select('plan_tier').eq('user_id', user.id).single(),
      supabaseClient.from('user_api_usage').select('ai_credits_used, last_reset_at').eq('user_id', user.id).single()
    ]);

    const isPro = subRes.data?.plan_tier === 'pro';
    let creditsUsed = usageRes.data?.ai_credits_used ?? 0;
    const lastResetDateStr = usageRes.data?.last_reset_at;
    const lastResetDate = lastResetDateStr 
      ? new Date(lastResetDateStr).toISOString().split('T')[0] 
      : null;
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = lastResetDate && lastResetDateStr !== "" && lastResetDate !== today;

    // The dual-limit logic: 
    // If it's the user's very first day signing up (or they have never been reset), they get 10 initial trial credits.
    // If it is a new day (after their first day), they get 5 daily credits.
    const hasHadFirstReset = (lastResetDate !== null && lastResetDateStr !== "");
    const MAX_TRIAL_CREDITS = hasHadFirstReset ? 5 : 10;

    if (isNewDay) {
      creditsUsed = 0; // Fresh daily credits
      
      // We must atomically update the reset date and usage concurrently so they don't abuse the "0" state.
      await supabaseClient.from('user_api_usage').upsert({
        user_id: user.id,
        ai_credits_used: 1, // We are consuming 1 right now for the current request
        last_reset_at: new Date().toISOString()
      });
      creditsUsed = 1; // Opting them into the consumed state locally
    }

    // 3. Enforce Limit
    if (!isPro && creditsUsed >= MAX_TRIAL_CREDITS) {
      return new Response(JSON.stringify({ error: "PAYMENT_REQUIRED", message: "Daily free trial limit reached." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Call Gemini
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

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (text) {
      // 5. Increment Usage if successful
      if (!isPro) {
        const { error: rpcError } = await supabaseClient.rpc("increment_ai_usage", { user_id_param: user.id });
        if (rpcError) console.error("Failed to increment usage:", rpcError);
      }
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
