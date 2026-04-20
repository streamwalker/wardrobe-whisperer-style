import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const errorResponse = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[CREATE-CHECKOUT] STRIPE_SECRET_KEY not configured");
      return errorResponse(503, "Service unavailable");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse(401, "Unauthorized");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !data.user?.email) {
      console.error("[CREATE-CHECKOUT] Auth error:", userError?.message);
      return errorResponse(401, "Unauthorized");
    }
    const user = data.user;

    let body: { priceId?: string };
    try {
      body = await req.json();
    } catch {
      return errorResponse(400, "Invalid request body");
    }
    const { priceId } = body;
    if (!priceId || typeof priceId !== "string") {
      return errorResponse(400, "priceId is required");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/wardrobe?checkout=success`,
      cancel_url: `${origin}/pricing`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CREATE-CHECKOUT] Unhandled error:", error);
    return errorResponse(500, "Service unavailable");
  }
});
