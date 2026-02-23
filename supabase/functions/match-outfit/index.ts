import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { selectedItem, wardrobeItems } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are StyleMatch, a fashion-savvy AI stylist specializing in color theory and outfit coordination.

Given a selected wardrobe item (the "anchor"), return EXACTLY 3 complete outfit suggestions. Each outfit MUST contain exactly 4 items — one from each of these categories:
1. Shoes
2. Pants
3. Tops
4. Outerwear

The anchor item is already assigned to its category. For the remaining 3 categories, pick the single best-matching item from the user's wardrobe.

Color theory principles to apply:
- Complementary colors (opposite on the color wheel) for bold contrast
- Analogous colors (adjacent on the color wheel) for harmonious looks
- Neutral anchoring (black, white, gray, beige) to ground bold pieces
- Tonal dressing (shades of the same hue) for sophisticated monochrome looks
- The 60-30-10 rule: 60% dominant color, 30% secondary, 10% accent

Each outfit must use a DIFFERENT styling approach so the 3 suggestions feel distinct. For each outfit, explain WHY the colors and pieces work together using specific color theory terms. Keep explanations concise (2-3 sentences max). Give each outfit a short creative name.`;

    const otherItems = wardrobeItems.filter((i: any) => i.id !== selectedItem.id);
    const grouped: Record<string, any[]> = {};
    for (const item of otherItems) {
      const cat = item.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    const userPrompt = `ANCHOR ITEM (must appear in every outfit):
${JSON.stringify(selectedItem)}

AVAILABLE ITEMS BY CATEGORY:
${Object.entries(grouped).map(([cat, items]) => `## ${cat}\n${JSON.stringify(items)}`).join("\n\n")}

Return exactly 3 complete outfits. Each outfit must include the anchor item plus one item from each of the other 3 categories (shoes, pants, tops, outerwear).`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
                name: "suggest_outfits",
                description:
                  "Return exactly 3 complete outfit suggestions, each with one item from every category.",
                parameters: {
                  type: "object",
                  properties: {
                    outfits: {
                      type: "array",
                      minItems: 3,
                      maxItems: 3,
                      items: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                            description: "Creative outfit name",
                          },
                          item_ids: {
                            type: "array",
                            items: { type: "string" },
                            description:
                              "IDs of wardrobe items in this outfit (must include selected item)",
                          },
                          explanation: {
                            type: "string",
                            description:
                              "2-3 sentence color theory explanation of why these pieces work together",
                          },
                          mood: {
                            type: "string",
                            enum: [
                              "casual",
                              "elevated",
                              "bold",
                              "minimal",
                              "sporty",
                            ],
                          },
                        },
                        required: [
                          "name",
                          "item_ids",
                          "explanation",
                          "mood",
                        ],
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
          tool_choice: {
            type: "function",
            function: { name: "suggest_outfits" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Top up in Settings → Workspace → Usage." }),
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
        JSON.stringify({ error: "No outfit suggestions returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const outfits = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(outfits), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-outfit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
