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

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    await authenticateUser(req);

    const body = await req.json();
    const { imageUrl, backImageUrl } = body;

    // Input validation
    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(JSON.stringify({ error: "imageUrl is required and must be a string" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (imageUrl.length > 2048) {
      return new Response(JSON.stringify({ error: "imageUrl is too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try { new URL(imageUrl); } catch {
      return new Response(JSON.stringify({ error: "imageUrl must be a valid URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional back image validation
    let validBackUrl: string | null = null;
    if (backImageUrl !== undefined && backImageUrl !== null && backImageUrl !== "") {
      if (typeof backImageUrl !== "string" || backImageUrl.length > 2048) {
        return new Response(JSON.stringify({ error: "backImageUrl must be a string under 2048 chars" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try { new URL(backImageUrl); validBackUrl = backImageUrl; } catch {
        return new Response(JSON.stringify({ error: "backImageUrl must be a valid URL" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a fashion item analyzer and identifier. Given a photo of a clothing item, identify:
- A short descriptive name (2-3 words, e.g. "Navy Chinos", "White Sneakers")
- A detailed description: try to identify the brand, collection, model name, material, and any distinguishing features. Write a concise 1-2 sentence description. Example: "Ralph Lauren 2025 spring collection 'Joffrey' green sports jacket in lightweight cotton twill." If you cannot identify specific brand details, describe the item's style, material, and notable features.
- The category: shoes, pants, tops, outerwear, suits, or accessories
- The dominant/primary color name (e.g. "Navy", "Cream", "Olive")
- The hex code of that color
- 1-3 style tags from: casual, neutral, bold, luxury, minimal, sporty
- The pattern: solid, striped, plaid, checkered, floral, camo, graphic, herringbone, pinstripe, houndstooth. Use "solid" if no visible pattern.
- The texture/fabric: cotton, linen, wool, silk, denim, corduroy, suede, leather, knit, fleece, tweed, canvas, poplin, flannel, chambray, velvet. Pick the closest match based on visual appearance.`;

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
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              { type: "text", text: "Analyze this clothing item." },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_item",
              description: "Return the analysis of a clothing item from its photo.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Short 2-3 word name" },
                  description: { type: "string", description: "Detailed 1-2 sentence description including brand, collection, model, material, and features if identifiable" },
                  category: {
                    type: "string",
                    enum: ["shoes", "pants", "tops", "outerwear", "suits", "accessories"],
                  },
                  primary_color: { type: "string", description: "Color name" },
                  color_hex: { type: "string", description: "Hex code e.g. #2C3E50" },
                   style_tags: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["casual", "neutral", "bold", "luxury", "minimal", "sporty"],
                    },
                  },
                  pattern: {
                    type: "string",
                    enum: ["solid", "striped", "plaid", "checkered", "floral", "camo", "graphic", "herringbone", "pinstripe", "houndstooth"],
                    description: "The visible pattern of the item",
                  },
                  texture: {
                    type: "string",
                    enum: ["cotton", "linen", "wool", "silk", "denim", "corduroy", "suede", "leather", "knit", "fleece", "tweed", "canvas", "poplin", "flannel", "chambray", "velvet"],
                    description: "The fabric/texture of the item",
                  },
                },
                required: ["name", "description", "category", "primary_color", "color_hex", "style_tags", "pattern", "texture"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_item" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No analysis returned from AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    console.error("analyze-clothing error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
