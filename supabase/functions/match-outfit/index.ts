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

async function callAI(LOVABLE_API_KEY: string, messages: any[], tools: any[], tool_choice: any) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      tools,
      tool_choice,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return { error: "Rate limited — please try again shortly.", status: 429 };
    }
    if (response.status === 402) {
      return { error: "AI credits exhausted. Top up in Settings → Workspace → Usage.", status: 402 };
    }
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    return { error: "AI service error", status: 500 };
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    return { error: "No response returned from AI", status: 500 };
  }

  return { result: JSON.parse(toolCall.function.arguments) };
}

async function checkCompatibility(
  LOVABLE_API_KEY: string,
  anchors: any[],
  wardrobeItems: any[]
) {
  const anchorIds = new Set(anchors.map((a: any) => a.id));
  const otherItems = wardrobeItems.filter((i: any) => !anchorIds.has(i.id));

  // Group alternatives by category of the anchor items for replacement suggestions
  const anchorCategories = anchors.map((a: any) => a.category);
  const replacementPool: any[] = [];
  for (const cat of anchorCategories) {
    const alternatives = otherItems.filter((i: any) => i.category === cat);
    replacementPool.push(...alternatives);
  }

  const systemPrompt = `You are StyleMatch, a fashion AI specializing in color theory. Evaluate whether the given wardrobe items can form a cohesive outfit together. Consider color harmony, style consistency, and overall aesthetic.

Be reasonably flexible — most neutral + bold combinations work. Only flag truly jarring clashes (e.g., competing saturated colors that create visual tension, or wildly mismatched styles).

If compatible, return compatible: true.
If incompatible, identify which item is the weakest link, explain why in 1-2 sentences, and suggest 2-3 alternatives from the replacement pool that would work better.`;

  const userPrompt = `SELECTED ITEMS TO EVALUATE:
${JSON.stringify(anchors)}

AVAILABLE REPLACEMENTS (same categories as selected items):
${JSON.stringify(replacementPool)}`;

  return callAI(LOVABLE_API_KEY, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], [
    {
      type: "function",
      function: {
        name: "evaluate_compatibility",
        description: "Evaluate whether selected wardrobe items are compatible for an outfit",
        parameters: {
          type: "object",
          properties: {
            compatible: { type: "boolean", description: "Whether the items work together" },
            reason: { type: "string", description: "Explanation of the clash (only if incompatible)" },
            problem_item_id: { type: "string", description: "ID of the item causing the clash (only if incompatible)" },
            suggested_replacements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Wardrobe item ID" },
                  reason: { type: "string", description: "Why this is a better choice (1 sentence)" },
                },
                required: ["id", "reason"],
                additionalProperties: false,
              },
              description: "2-3 alternative items (only if incompatible)",
            },
          },
          required: ["compatible"],
          additionalProperties: false,
        },
      },
    },
  ], { type: "function", function: { name: "evaluate_compatibility" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    await authenticateUser(req);

    const body = await req.json();
    const { selectedItem, selectedItems, wardrobeItems, excludeOutfits } = body;

    // Input validation
    if (!wardrobeItems || !Array.isArray(wardrobeItems) || wardrobeItems.length > 500) {
      return new Response(
        JSON.stringify({ error: "Invalid or too many wardrobe items (max 500)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!selectedItem && (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0)) {
      return new Response(
        JSON.stringify({ error: "At least one selected item is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const anchors: any[] = selectedItems && selectedItems.length > 0
      ? selectedItems
      : [selectedItem];

    const anchorIds = new Set(anchors.map((a: any) => a.id));
    const isMulti = anchors.length > 1;

    // --- Compatibility check for multi-item selections ---
    if (isMulti) {
      const compatResult = await checkCompatibility(LOVABLE_API_KEY, anchors, wardrobeItems);
      if (compatResult.error) {
        return new Response(
          JSON.stringify({ error: compatResult.error }),
          { status: compatResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (compatResult.result && !compatResult.result.compatible) {
        return new Response(
          JSON.stringify({
            compatible: false,
            reason: compatResult.result.reason,
            problem_item_id: compatResult.result.problem_item_id,
            suggested_replacements: compatResult.result.suggested_replacements || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // --- Generate outfit suggestions ---
    const anchorCategories = anchors.map((a: any) => a.category);

    const otherItems = wardrobeItems.filter((i: any) => !anchorIds.has(i.id));
    const grouped: Record<string, any[]> = {};
    for (const item of otherItems) {
      const cat = item.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    const allCategories = ["shoes", "pants", "tops", "outerwear"];
    const missingCategories = allCategories.filter(cat => !anchorCategories.includes(cat));
    const isFullOutfit = missingCategories.length === 0;

    let excludeBlock = "";
    if (excludeOutfits && Array.isArray(excludeOutfits) && excludeOutfits.length > 0) {
      const limited = excludeOutfits.slice(0, 20);
      excludeBlock = `\n\nIMPORTANT — Do NOT reuse any of the following outfit combinations (listed by item IDs):\n${limited.map((ids: string[], i: number) => `- Outfit ${i + 1}: ${ids.join(", ")}`).join("\n")}\n\nYou must suggest DIFFERENT combinations that have not appeared above. If you cannot produce 3 new unique outfits, return as many as you can (even 0).`;
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (isFullOutfit) {
      // --- Full-outfit variation mode ---
      systemPrompt = `You are StyleMatch, a fashion-savvy AI stylist specializing in color theory and outfit coordination.

The user has selected a COMPLETE outfit (one item from each category: shoes, pants, tops, outerwear). Your job is to suggest EXACTLY 3 variation outfits. Each variation must SWAP exactly ONE item from the original selection for a different item from the same category, keeping the other 3 items intact.

Rules:
- Each of the 3 suggestions must swap a DIFFERENT item (e.g., suggestion 1 swaps shoes, suggestion 2 swaps pants, suggestion 3 swaps the top). If there are not enough alternatives in a category, you may swap the same category twice with different replacements.
- NEVER return the original selection unchanged.
- Each suggestion must still have exactly 4 items (one per category).
- Explain how the swap changes the outfit's character using color theory terms. Keep explanations concise (2-3 sentences max).
- Give each variation a short creative name.`;

      userPrompt = `ORIGINAL OUTFIT (the user's current selection):
${JSON.stringify(anchors)}

AVAILABLE ALTERNATIVES BY CATEGORY (pick swaps from these):
${Object.entries(grouped).map(([cat, items]) => `## ${cat}\n${JSON.stringify(items)}`).join("\n\n")}

Return exactly 3 outfit variations. Each must swap exactly ONE item from the original for an alternative, keeping the other 3 items.${excludeBlock}`;
    } else if (isMulti) {
      systemPrompt = `You are StyleMatch, a fashion-savvy AI stylist specializing in color theory and outfit coordination.

Given ${anchors.length} selected wardrobe items (the "anchors"), return EXACTLY 3 complete outfit suggestions. Each outfit MUST include ALL of the anchor items, plus items from the remaining categories to complete a full outfit with one item from each of these 4 categories:
1. Shoes
2. Pants
3. Tops
4. Outerwear

The anchor items are already assigned to their categories. For any category not covered by an anchor, pick the single best-matching item from the user's wardrobe.

Color theory principles to apply:
- Complementary colors (opposite on the color wheel) for bold contrast
- Analogous colors (adjacent on the color wheel) for harmonious looks
- Neutral anchoring (black, white, gray, beige) to ground bold pieces
- Tonal dressing (shades of the same hue) for sophisticated monochrome looks
- The 60-30-10 rule: 60% dominant color, 30% secondary, 10% accent

Each outfit must use a DIFFERENT styling approach so the 3 suggestions feel distinct. For each outfit, explain WHY the colors and pieces work together using specific color theory terms. Keep explanations concise (2-3 sentences max). Give each outfit a short creative name.`;

      const anchorLabel = "ANCHOR ITEMS (must ALL appear in every outfit)";
      userPrompt = `${anchorLabel}:
${JSON.stringify(anchors)}

AVAILABLE ITEMS BY CATEGORY (pick from these to fill remaining categories):
${Object.entries(grouped).map(([cat, items]) => `## ${cat}\n${JSON.stringify(items)}`).join("\n\n")}

Return exactly 3 complete outfits. Each outfit must include all anchor items plus one item from each of the other categories (to complete shoes, pants, tops, outerwear).${excludeBlock}`;
    } else {
      systemPrompt = `You are StyleMatch, a fashion-savvy AI stylist specializing in color theory and outfit coordination.

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

      const anchorLabel = "ANCHOR ITEM (must appear in every outfit)";
      userPrompt = `${anchorLabel}:
${JSON.stringify(anchors[0])}

AVAILABLE ITEMS BY CATEGORY (pick from these to fill remaining categories):
${Object.entries(grouped).map(([cat, items]) => `## ${cat}\n${JSON.stringify(items)}`).join("\n\n")}

Return exactly 3 complete outfits. Each outfit must include the anchor item plus one item from each of the other categories (to complete shoes, pants, tops, outerwear).${excludeBlock}`;
    }

    const aiResult = await callAI(LOVABLE_API_KEY, [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], [
      {
        type: "function",
        function: {
          name: "suggest_outfits",
          description: "Return exactly 3 complete outfit suggestions, each with one item from every category.",
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
                      description: "IDs of wardrobe items in this outfit (must include all selected items)",
                    },
                    explanation: {
                      type: "string",
                      description: "2-3 sentence color theory explanation of why these pieces work together",
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
    ], { type: "function", function: { name: "suggest_outfits" } });

    if (aiResult.error) {
      return new Response(
        JSON.stringify({ error: aiResult.error }),
        { status: aiResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ compatible: true, ...aiResult.result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("match-outfit error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
