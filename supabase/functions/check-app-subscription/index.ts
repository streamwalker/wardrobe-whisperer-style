import { createClient } from "npm:@supabase/supabase-js@2.57.2";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
Deno.serve(async req => {
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  try {
    const token = req.headers.get("Authorization")?.replace(/^Bearer /i, "");
    if (!token) return reply(401, { error: "Unauthorized" });
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return reply(401, { error: "Unauthorized" });
    const key = Deno.env.get("REVENUECAT_SECRET_API_KEY");
    if (!key) return reply(503, { error: "Subscriptions unavailable" });
    // Server lookup uses the verified Supabase user ID, never client-supplied entitlement claims.
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(data.user.id)}`, { headers: { Authorization: `Bearer ${key}` } });
    if (response.status === 404) return reply(200, { subscribed: false });
    if (!response.ok) return reply(503, { error: "Subscription verification unavailable" });
    const result = await response.json();
    const entitlement = result.subscriber?.entitlements?.pro;
    const expires = entitlement?.expires_date;
    const active = !!entitlement && (!expires || Date.parse(expires) > Date.now());
    return reply(200, { subscribed: active, product_id: entitlement?.product_identifier ?? null, subscription_end: expires ?? null, price_id: null });
  } catch { return reply(503, { error: "Subscription verification unavailable" }); }
});
