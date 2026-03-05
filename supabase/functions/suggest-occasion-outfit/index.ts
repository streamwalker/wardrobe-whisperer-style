import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
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

function isFormalItem(item: any): boolean {
  if (item.category === "suits") return true;
  if (item.category === "accessories") return true;
  if (item.category === "tops" && typeof item.name === "string" && item.name.toLowerCase().includes("dress shirt")) return true;
  if (item.category === "dress-shoes") return true;
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    await authenticateUser(req);

    const body = await req.json();
    const { occasion, weather, wardrobeItems } = body;

    // Input validation
    if (!occasion || typeof occasion !== "string" || occasion.length > 200) {
      return new Response(JSON.stringify({ error: "occasion is required and must be ≤200 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (weather && (typeof weather !== "string" || weather.length > 200)) {
      return new Response(JSON.stringify({ error: "weather must be a string ≤200 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!wardrobeItems || !Array.isArray(wardrobeItems) || wardrobeItems.length === 0 || wardrobeItems.length > 500) {
      return new Response(JSON.stringify({ error: "wardrobeItems must be an array with 1-500 items" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Detect if the wardrobe has formal items — for formal occasions, prefer formal pairing
    const hasFormalItems = wardrobeItems.some((i: any) => isFormalItem(i));
    const formalKeywords = ["formal", "gala", "black tie", "wedding", "interview", "business", "cocktail", "dinner party", "opera", "banquet"];
    const isFormalOccasion = formalKeywords.some(kw => occasion.toLowerCase().includes(kw));
    const useFormalMode = isFormalOccasion && hasFormalItems;

    const filteredItems = useFormalMode
      ? wardrobeItems.filter((i: any) => isFormalItem(i))
      : wardrobeItems;

    const stripped = filteredItems.map(({ photo, ...rest }: any) => rest);

    const weatherContext = weather ? `\nWEATHER / CONDITIONS: ${weather}. Factor this into your choices (e.g., layers for cold, breathable fabrics for hot, waterproof for rain).` : "";

    const categoryDescription = useFormalMode
      ? "Suit, Dress Shirt (tops), Dress Shoes, and Tie/Accessory"
      : "Shoes, Pants, Tops, Outerwear";

    const systemPrompt = `You are StyleMatch, a fashion-savvy AI stylist. The user is going to a specific event/occasion and needs outfit suggestions from their wardrobe.

Your job: suggest EXACTLY 3 complete ${useFormalMode ? "formal " : ""}outfits suited for the occasion. Each outfit MUST have exactly 4 items — one from each category: ${categoryDescription}.

Consider:
- The formality and vibe of the occasion (casual hangout vs. date night vs. outdoor activity)
- Comfort and practicality for the setting
- Color coordination and style cohesion
- Weather conditions if provided

Each outfit should have:
- A creative name that references the occasion
- A 2-3 sentence explanation of why this outfit works for the event
- A mood tag (casual, elevated, bold, minimal, sporty)

HARD STYLE RULES:
- Dress shirts are EXCLUSIVELY formal items. They must ONLY be paired with suits, ties/accessories, and dress shoes. Never pair a dress shirt with casual pants, jeans, sneakers, hoodies, or any non-formal item.

PROPORTION & SILHOUETTE RULES (always apply):
- VOLUME CONTRAST: If the top is oversized/loose, the bottom must be fitted/tapered. If the bottom is wide/relaxed, the top must be fitted/structured. Never pair oversized top + baggy bottom unless going full intentional streetwear.
- THREE SILHOUETTES: Top-heavy (loose top + slim bottom), Bottom-heavy (fitted top + wide bottom), or Balanced (both moderately fitted/tailored). Every outfit must fit one of these.
- SHOE-PANT HARMONY: Slim/tapered pants → slimmer shoes (Chelsea boots, low sneakers). Wide/relaxed pants → chunkier shoes (boots, chunky sneakers). Mismatched shoe-pant volume ruins proportions.
- MONOCHROME ADVANTAGE: When possible, favor outfits in one color family (head to toe) for a taller, leaner look. Avoid high-contrast color breaks at the waist.
- VERTICAL STRUCTURE: Prefer items that create vertical lines (structured lapels, front-creased trousers, long coats) for a lengthening effect.
- POWER FORMULA: Structured jacket + fitted shirt + tapered trousers + substantial footwear = the most universally flattering combination. Prioritize this when the wardrobe supports it.
- 3-4 COLOR MAXIMUM: Keep each outfit to 3-4 total colors. Fewer colors = more intentional and confident.
- STREETWEAR EXCEPTION: Full oversized (top + bottom + chunky shoes) is acceptable ONLY when all three pieces are intentionally exaggerated and the style tags indicate streetwear/sporty.

Make the 3 suggestions distinct — e.g., one more casual, one more polished, one more expressive.`;

    const userPrompt = `OCCASION: ${occasion}${weatherContext}

WARDROBE ITEMS:
${JSON.stringify(stripped)}

Return exactly 3 complete outfits, each with one item from ${categoryDescription.toLowerCase()}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_occasion_outfits",
              description: "Return 3 outfit suggestions for the given occasion.",
              parameters: {
                type: "object",
                properties: {
                  outfits: {
                    type: "array",
                    minItems: 1,
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Creative outfit name referencing the occasion" },
                        item_ids: {
                          type: "array",
                          items: { type: "string" },
                          description: "IDs of the 4 wardrobe items in this outfit",
                        },
                        explanation: {
                          type: "string",
                          description: "2-3 sentence explanation of why this outfit suits the occasion",
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
        tool_choice: { type: "function", function: { name: "suggest_occasion_outfits" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("suggest-occasion-outfit error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
