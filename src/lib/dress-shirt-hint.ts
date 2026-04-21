import type { WardrobeItem } from "@/lib/wardrobe-data";

const DRESS_HINTS = [
  "dress shirt",
  "button-down",
  "button down",
  "button-up",
  "button up",
  "oxford shirt",
  "formal shirt",
  "collared shirt",
];
const NON_DRESS_HINTS = ["t-shirt", "tee", "hoodie", "sweater", "crewneck", "tank", "polo", "jersey"];
const SHORT_SLEEVE_HINTS = ["short sleeve", "short-sleeve", "camp collar", "cuban collar", "resort shirt", "hawaiian shirt", "vacation shirt"];

function searchText(item: WardrobeItem): string {
  const tags = Array.isArray(item.style_tags) ? item.style_tags.join(" ") : "";
  return `${item.name ?? ""} ${item.subcategory ?? ""} ${tags}`.toLowerCase();
}

export function isDressShirt(item: WardrobeItem): boolean {
  if (item.category !== "tops") return false;
  const text = searchText(item);
  if (!DRESS_HINTS.some((k) => text.includes(k))) return false;
  if (NON_DRESS_HINTS.some((k) => text.includes(k))) return false;
  // Short-sleeve button-ups are smart-casual, not formal dress shirts
  if (SHORT_SLEEVE_HINTS.some((k) => text.includes(k))) return false;
  return true;
}

/**
 * Returns a friendly missing-pieces hint when a dress shirt is selected
 * without the required formal companions, or null when the outfit is on track.
 */
export function getDressShirtHint(items: WardrobeItem[]): string | null {
  if (!items.some(isDressShirt)) return null;

  const missing: string[] = [];
  if (!items.some((i) => i.category === "suits")) missing.push("a suit");
  if (!items.some((i) => i.category === "dress-shoes")) missing.push("dress shoes");
  if (!items.some((i) => i.category === "accessories")) missing.push("a tie");

  if (missing.length === 0) return null;

  const list =
    missing.length === 1
      ? missing[0]
      : missing.length === 2
        ? `${missing[0]} and ${missing[1]}`
        : `${missing.slice(0, -1).join(", ")}, and ${missing[missing.length - 1]}`;

  return `Dress shirts pair with formalwear — add ${list} to complete the look.`;
}
