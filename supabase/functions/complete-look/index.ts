import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isValidOutfitPairing } from "../_shared/dress-shirt-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_CATEGORIES = ["shoes", "pants", "tops", "outerwear", "suits", "accessories", "dress-shoes"];
const STYLE_TAGS = ["casual", "neutral", "bold", "luxury", "minimal", "sporty"];

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

const STYLE_RULES = `
HARD STYLE RULES (must never be violated for proposed concept pieces):
- Never propose sneakers, boots, or hoodies to complete a suit-based outfit.
- Never propose joggers/sweatpants/hoodies to complete a dress-shirt or formal outfit.
- Never propose dress shoes to complete a jogger/hoodie/athletic outfit.
- Never propose a tie to pair with a polo.
- Match formality of the existing pieces.
- Use volume contrast: oversized top → fitted bottom, and vice versa.
- 3-4 colors maximum across the full look.
`;

async function callPlannerAI(LOVABLE_API_KEY: string, outfit: any, existingItems: any[], inspirationImageUrl?: string) {
  const userContent: any[] = [
    {
      type: "text",
      text: `Existing outfit "${outfit.name}" (${outfit.mood}):
${JSON.stringify(existingItems, null, 2)}

Original explanation: ${outfit.explanation}

Identify 0-2 missing "hero" pieces from DIFFERENT categories than what's already present that would truly complete this look. Hard cap at 2. If the look already feels complete, return empty conceptPieces and just provide a refined rationale.

Then write a refined 2-3 sentence stylist rationale explaining how the existing + concept pieces work together (volume contrast, color harmony, formality match).

${STYLE_RULES}`,
    },
  ];

  if (inspirationImageUrl) {
    userContent.push({
      type: "image_url",
      image_url: { url: inspirationImageUrl },
    });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are an expert fashion stylist completing outfits with aspirational concept pieces." },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "complete_outfit",
            description: "Return concept pieces and rationale to complete the look.",
            parameters: {
              type: "object",
              properties: {
                rationale: { type: "string", description: "2-3 sentences on how it all works together" },
                conceptPieces: {
                  type: "array",
                  maxItems: 2,
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: VALID_CATEGORIES },
                      name: { type: "string" },
                      primary_color: { type: "string" },
                      color_hex: { type: "string", description: "hex like #aabbcc" },
                      style_tags: { type: "array", items: { type: "string", enum: STYLE_TAGS } },
                      pattern: { type: "string" },
                      texture: { type: "string" },
                      description: { type: "string" },
                      image_prompt: { type: "string", description: "Vivid prompt for product photo generation" },
                    },
                    required: ["category", "name", "primary_color", "color_hex", "style_tags", "description", "image_prompt"],
                  },
                },
              },
              required: ["rationale", "conceptPieces"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "complete_outfit" } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) return { error: "Rate limited — please try again shortly.", status: 429 };
    if (response.status === 402) return { error: "AI credits exhausted. Top up in Settings → Workspace → Usage.", status: 402 };
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    return { error: "AI service error", status: 500 };
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return { error: "No structured response from AI", status: 500 };
  return { result: JSON.parse(toolCall.function.arguments) };
}

async function generateConceptImage(LOVABLE_API_KEY: string, prompt: string): Promise<string | null> {
  try {
    const fullPrompt = `${prompt}. Clean studio shot, neutral light grey background, e-commerce style product photo, no model, centered composition, soft studio lighting, ultra high resolution.`;
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!response.ok) {
      console.error("Image gen failed:", response.status, await response.text());
      return null;
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
  } catch (e) {
    console.error("Image gen exception:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await authenticateUser(req);

    const body = await req.json();
    const { outfit, wardrobeItems, inspirationImageUrl } = body ?? {};

    // Validation
    if (!outfit || typeof outfit !== "object" || !Array.isArray(outfit.item_ids)) {
      return new Response(JSON.stringify({ error: "Invalid outfit payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(wardrobeItems) || wardrobeItems.length === 0 || wardrobeItems.length > 500) {
      return new Response(JSON.stringify({ error: "wardrobeItems must be a non-empty array (max 500)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (inspirationImageUrl !== undefined && (typeof inspirationImageUrl !== "string" || !/^https?:\/\//i.test(inspirationImageUrl))) {
      return new Response(JSON.stringify({ error: "Invalid inspirationImageUrl" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const existingItems = wardrobeItems.filter((i: any) => outfit.item_ids.includes(i.id));
    if (existingItems.length === 0) {
      return new Response(JSON.stringify({ error: "Outfit references no wardrobe items" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: get planner output
    const planner = await callPlannerAI(LOVABLE_API_KEY, outfit, existingItems, inspirationImageUrl);
    if (planner.error) {
      return new Response(JSON.stringify({ error: planner.error }), {
        status: planner.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rationale, conceptPieces: rawConcepts = [] } = planner.result ?? {};

    // Filter concepts: drop any that violate hard rules when combined with existing
    const validConcepts = (rawConcepts as any[]).filter((c) => {
      const combined = [...existingItems, { ...c, id: `__concept_${c.name}` }];
      return isValidOutfitPairing(combined);
    }).slice(0, 2);

    // Step 2: generate images sequentially
    const conceptPieces: any[] = [];
    for (const concept of validConcepts) {
      const imageUrl = await generateConceptImage(LOVABLE_API_KEY, concept.image_prompt);
      conceptPieces.push({
        category: concept.category,
        name: concept.name,
        primary_color: concept.primary_color,
        color_hex: concept.color_hex,
        style_tags: concept.style_tags || [],
        pattern: concept.pattern,
        texture: concept.texture,
        description: concept.description,
        imageUrl: imageUrl || "",
        isConcept: true,
      });
    }

    return new Response(
      JSON.stringify({ rationale: rationale || outfit.explanation, conceptPieces }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("complete-look error:", e);
    const msg = e?.message || "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
