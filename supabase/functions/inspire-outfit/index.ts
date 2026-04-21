import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) throw new Error("Unauthorized");
  return data.claims.sub as string;
}

async function callAI(LOVABLE_API_KEY: string, messages: any[], tools?: any[], tool_choice?: any) {
  const body: any = {
    model: "google/gemini-2.5-flash",
    messages,
  };
  if (tools) body.tools = tools;
  if (tool_choice) body.tool_choice = tool_choice;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) return { error: "Rate limited — please try again shortly.", status: 429 };
    if (response.status === 402) return { error: "AI credits exhausted. Top up in Settings → Workspace → Usage.", status: 402 };
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    return { error: "AI service error", status: 500 };
  }

  const data = await response.json();
  if (tools) {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return { error: "No structured response from AI", status: 500 };
    return { result: JSON.parse(toolCall.function.arguments) };
  }
  return { result: data.choices?.[0]?.message?.content ?? "" };
}

const STYLE_RULES = `
HARD STYLE RULES (must never be violated):
- Dress shirts (button-downs, button-ups, oxfords, formal/collared shirts) MUST be paired with a suit, dress shoes, and a tie.
- POLOS: smart-casual only. Never with suits, formal dress shoes (oxfords/derbies), joggers, sweatpants, or hoodies.
- NEVER pair a polo with a tie of any kind.
- SUITS require dress shoes (NEVER sneakers, boots, or casual shoes) and a dress shirt or formal top.
- JOGGERS/SWEATPANTS are strictly casual — NEVER pair with dress shirts, suits, or dress shoes.
- HOODIES are strictly casual — NEVER pair with suits, dress shoes, or formal accessories.

PROPORTION & SILHOUETTE:
- Volume contrast: oversized top → fitted bottom (and vice versa).
- Shoe-pant harmony: slim pants → slimmer shoes; wide pants → chunkier shoes.
- 3-4 colors maximum per outfit.

PATTERN & TEXTURE:
- Mix at most 2 patterned items at different scales.
- Match texture formality (don't pair extreme-casual textures with formal ones).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await authenticateUser(req);

    const body = await req.json();
    const { imageUrl, wardrobeItems } = body ?? {};

    // Validation
    if (typeof imageUrl !== "string" || !/^https?:\/\//i.test(imageUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid imageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!Array.isArray(wardrobeItems) || wardrobeItems.length === 0 || wardrobeItems.length > 500) {
      return new Response(
        JSON.stringify({ error: "wardrobeItems must be a non-empty array (max 500)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // --- Step 1: Vision analysis of the inspiration image ---
    const briefResult = await callAI(LOVABLE_API_KEY, [
      {
        role: "system",
        content:
          "You are a fashion analyst. Look at the inspiration image and produce a concise structured 'look brief' covering: vibe (1-3 words), formality level (casual / smart-casual / business-casual / formal / sporty), dominant colors, silhouette notes, and the visible garment categories (e.g. tops, pants, shoes, outerwear, suits, accessories). Keep it under 120 words.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this inspiration look as a structured brief I can use to recreate it from a different wardrobe." },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ]);

    if (briefResult.error) {
      return new Response(
        JSON.stringify({ error: briefResult.error }),
        { status: briefResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const lookBrief = briefResult.result as string;

    // --- Step 2: Match brief against wardrobe ---
    const grouped: Record<string, any[]> = {};
    for (const item of wardrobeItems) {
      const cat = item.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    const systemPrompt = `You are StyleMatch, a fashion-savvy AI stylist. The user uploaded an inspiration photo. You have a "look brief" describing it, and the user's full wardrobe catalog.

Your job: return EXACTLY 3 outfit suggestions, each built ENTIRELY from items in the user's wardrobe, that recreate the vibe of the inspiration as closely as possible.

CRITICAL:
- Every item_id you return MUST exist in the provided wardrobe catalog. Do not invent items.
- Each outfit should be a complete look: footwear (shoes OR dress-shoes), pants (or suits), tops, optional outerwear, optional accessories. Typically 4-5 items.
- The 3 suggestions should each take a different angle on the inspiration (e.g. closest match, more elevated, more relaxed) so they feel distinct.
- Explanations must reference how the outfit echoes the inspiration's colors/silhouette/vibe. Keep to 2-3 sentences.

${STYLE_RULES}`;

    const userPrompt = `INSPIRATION LOOK BRIEF:
${lookBrief}

USER'S WARDROBE (grouped by category):
${Object.entries(grouped).map(([cat, items]) => `## ${cat}\n${JSON.stringify(items)}`).join("\n\n")}

Return exactly 3 complete outfits built only from the wardrobe above.`;

    const matchResult = await callAI(
      LOVABLE_API_KEY,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      [
        {
          type: "function",
          function: {
            name: "suggest_inspired_outfits",
            description: "Return exactly 3 outfits from the wardrobe that recreate the inspiration look.",
            parameters: {
              type: "object",
              properties: {
                outfits: {
                  type: "array",
                  minItems: 0,
                  maxItems: 3,
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Creative outfit name" },
                      item_ids: {
                        type: "array",
                        items: { type: "string" },
                        description: "IDs of wardrobe items, all must exist in the catalog",
                      },
                      explanation: {
                        type: "string",
                        description: "2-3 sentences referencing the inspiration",
                      },
                      mood: {
                        type: "string",
                        enum: ["casual", "elevated", "bold", "minimal", "sporty"],
                      },
                    },
                    required: ["name", "item_ids", "explanation", "mood"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["outfits"],
              additionalProperties: false,
            },
          },
        },
      ],
      { type: "function", function: { name: "suggest_inspired_outfits" } }
    );

    if (matchResult.error) {
      return new Response(
        JSON.stringify({ error: matchResult.error }),
        { status: matchResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out outfits referencing nonexistent IDs
    const validIds = new Set(wardrobeItems.map((i: any) => i.id));
    const rawOutfits = (matchResult.result?.outfits ?? []) as any[];
    const outfits = rawOutfits
      .map((o) => ({
        ...o,
        item_ids: (o.item_ids || []).filter((id: string) => validIds.has(id)),
      }))
      .filter((o) => o.item_ids.length >= 2);

    return new Response(
      JSON.stringify({ outfits, lookBrief }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("inspire-outfit error:", e);
    const msg = e?.message || "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
