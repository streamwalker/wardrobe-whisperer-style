import { createClient } from "npm:@supabase/supabase-js@2.57.2";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
Deno.serve(async req => {
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  try {
    const token = req.headers.get("Authorization")?.replace(/^Bearer /i, "");
    if (!token) return reply(401, { error: "Unauthorized" });
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return reply(401, { error: "Unauthorized" });
    const body = await req.json();
    if (body.confirmation !== "DELETE") return reply(400, { error: "Confirmation required" });
    // All app uploads use userId/file.ext. Never accept a storage prefix from the caller.
    const bucket = client.storage.from("wardrobe-photos");
    while (true) {
      const { data: files, error: listError } = await bucket.list(data.user.id, { limit: 100, offset: 0 });
      if (listError) throw listError;
      if (!files?.length) break;
      if (files.some(file => !file.id)) throw new Error("Unexpected nested storage folder; deletion needs review");
      const { error: removeError } = await bucket.remove(files.map(file => `${data.user!.id}/${file.name}`));
      if (removeError) throw removeError;
    }
    // Schema foreign keys cascade profile, wardrobe, outfits, shares, and consents.
    const { error: deleteError } = await client.auth.admin.deleteUser(data.user.id);
    if (deleteError) throw deleteError;
    return reply(200, { deleted: true });
  } catch { return reply(500, { error: "Unable to complete account deletion. Please retry." }); }
});
