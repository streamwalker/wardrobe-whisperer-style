/**
 * Client-side style/formality heuristics, mirrored from
 * `supabase/functions/_shared/dress-shirt-rules.ts` so the catalog-match
 * scorer can run fully offline. Keep these two files in sync if rules change.
 */

interface ItemLike {
  category?: string;
  name?: string;
  description?: string;
  subcategory?: string;
  style_tags?: string[] | null;
}

function toSearchText(item: ItemLike): string {
  const tags = Array.isArray(item.style_tags) ? item.style_tags.join(" ") : "";
  return `${item.name ?? ""} ${item.description ?? ""} ${item.subcategory ?? ""} ${tags}`.toLowerCase();
}

function has(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

export function isShortSleeveButtonUp(item: ItemLike): boolean {
  if (item.category !== "tops") return false;
  const t = toSearchText(item);
  return (
    has(t, ["short sleeve", "short-sleeve", "camp collar", "cuban collar", "resort shirt", "hawaiian shirt", "vacation shirt"]) &&
    has(t, ["button-down", "button down", "button-up", "button up", "camp collar", "cuban collar", "resort shirt", "hawaiian shirt"])
  );
}

export function isDressShirt(item: ItemLike): boolean {
  if (item.category !== "tops") return false;
  const t = toSearchText(item);
  const dress = ["dress shirt", "button-down", "button down", "button-up", "button up", "oxford shirt", "formal shirt", "collared shirt"];
  const nonDress = ["t-shirt", "tee", "hoodie", "sweater", "crewneck", "tank", "polo", "jersey"];
  if (!has(t, dress) || has(t, nonDress)) return false;
  if (isShortSleeveButtonUp(item)) return false;
  return true;
}

export function isHoodie(item: ItemLike): boolean {
  const t = toSearchText(item);
  return has(t, ["hoodie", "hooded sweatshirt"]);
}

export function isJogger(item: ItemLike): boolean {
  if (item.category !== "pants") return false;
  const t = toSearchText(item);
  return has(t, ["jogger", "joggers", "sweatpant", "sweatpants", "track pant", "track pants"]);
}

export function isSneaker(item: ItemLike): boolean {
  if (item.category !== "shoes") return false;
  const t = toSearchText(item);
  return has(t, ["sneaker", "sneakers", "hi-top", "high-top", "trainer", "trainers", "running", "runner", "yeezy", "air force", "air max", "boost", "jordan", "dunk", "new balance"]);
}

export function isFormalItem(item: ItemLike): boolean {
  if (item.category === "suits") return true;
  if (item.category === "dress-shoes") return true;
  if (isDressShirt(item)) return true;
  return false;
}

export function isCasualItem(item: ItemLike): boolean {
  if (isHoodie(item) || isJogger(item) || isSneaker(item)) return true;
  const tags = (item.style_tags || []).map((t) => String(t).toLowerCase());
  return tags.includes("sporty") || tags.includes("casual");
}

/**
 * Returns a -1..+1 formality compatibility score:
 *  +1 when both are formal or both are casual
 *   0 when neither is strongly typed
 *  -1 on a hard mismatch (formal × casual)
 */
export function formalityCompatibility(a: ItemLike, b: ItemLike): number {
  const aFormal = isFormalItem(a);
  const bFormal = isFormalItem(b);
  const aCasual = isCasualItem(a);
  const bCasual = isCasualItem(b);

  if ((aFormal && bCasual) || (bFormal && aCasual)) return -1;
  if (aFormal && bFormal) return 1;
  if (aCasual && bCasual) return 1;
  return 0;
}
