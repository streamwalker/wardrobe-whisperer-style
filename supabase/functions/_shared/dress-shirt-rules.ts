type WardrobeItem = {
  id?: string;
  category?: string;
  name?: string;
  description?: string;
  subcategory?: string;
  style_tags?: string[] | null;
};

function toSearchText(item: WardrobeItem): string {
  const styleTags = Array.isArray(item.style_tags) ? item.style_tags.join(" ") : "";
  return `${item.name ?? ""} ${item.description ?? ""} ${item.subcategory ?? ""} ${styleTags}`.toLowerCase();
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function isDressShirt(item: WardrobeItem): boolean {
  if (item.category !== "tops") return false;

  const text = toSearchText(item);
  const dressHints = [
    "dress shirt",
    "button-down",
    "button down",
    "button-up",
    "button up",
    "oxford shirt",
    "formal shirt",
    "collared shirt",
  ];
  const nonDressHints = ["t-shirt", "tee", "hoodie", "sweater", "crewneck", "tank", "polo", "jersey"];

  return hasAnyKeyword(text, dressHints) && !hasAnyKeyword(text, nonDressHints);
}

export function isSportyItem(item: WardrobeItem): boolean {
  const text = toSearchText(item);
  return hasAnyKeyword(text, [
    "sporty",
    "athletic",
    "jogger",
    "sweatpant",
    "hoodie",
    "sneaker",
    "running",
    "runner",
    "training",
    "gym",
    "yeezy",
    "air force",
    "air max",
    "boost",
  ]);
}

export function isFormalItem(item: WardrobeItem): boolean {
  if (item.category === "suits") return true;
  if (item.category === "accessories") return true;
  if (item.category === "dress-shoes") return true;
  if (isDressShirt(item)) return true;
  return false;
}

export function isBusinessCasualPant(item: WardrobeItem): boolean {
  if (item.category !== "pants") return false;

  const text = toSearchText(item);
  if (hasAnyKeyword(text, ["jogger", "sweat", "cargo", "jean", "denim", "track"])) return false;
  return hasAnyKeyword(text, ["chino", "trouser", "slack", "tailored", "pleated", "dress pant"]);
}

export function isBusinessCasualShoe(item: WardrobeItem): boolean {
  if (item.category === "dress-shoes") return true;
  if (item.category !== "shoes") return false;

  const text = toSearchText(item);
  if (hasAnyKeyword(text, ["sneaker", "runner", "running", "yeezy", "air force", "air max", "boost", "trainer"])) {
    return false;
  }

  return hasAnyKeyword(text, ["loafer", "chelsea", "oxford", "derby", "brogue", "monk", "dress shoe", "penny"]);
}

export function isBusinessCasualOuterwear(item: WardrobeItem): boolean {
  if (item.category !== "outerwear") return false;

  const text = toSearchText(item);
  if (hasAnyKeyword(text, ["hoodie", "puffer", "windbreaker", "bomber", "parka", "denim jacket"])) return false;
  return hasAnyKeyword(text, ["blazer", "sport coat", "structured", "tailored", "suit jacket"]);
}

function isFormalShoe(item: WardrobeItem): boolean {
  if (item.category === "dress-shoes") return true;
  if (item.category !== "shoes") return false;

  const text = toSearchText(item);
  return hasAnyKeyword(text, ["oxford", "derby", "loafer", "chelsea", "brogue", "monk", "dress shoe", "luxury"]);
}

function hasTieOrAccessory(item: WardrobeItem): boolean {
  if (item.category !== "accessories") return false;
  const text = toSearchText(item);
  return text.trim().length === 0 || hasAnyKeyword(text, ["tie", "necktie", "bow tie", "silk tie"]);
}

export function isValidDressShirtPairing(items: WardrobeItem[]): boolean {
  const hasDressShirt = items.some((item) => isDressShirt(item));
  if (!hasDressShirt) return true;

  const hasSuit = items.some((item) => item.category === "suits");

  if (hasSuit) {
    const hasFormalShoes = items.some((item) => isFormalShoe(item));
    const hasAccessory = items.some((item) => hasTieOrAccessory(item));
    return hasFormalShoes && hasAccessory;
  }

  const hasBusinessPant = items.some((item) => isBusinessCasualPant(item));
  const hasBusinessShoe = items.some((item) => isBusinessCasualShoe(item));
  const hasStructuredOuterwear = items.some((item) => isBusinessCasualOuterwear(item));
  const hasSportyPiece = items.some((item) => isSportyItem(item));

  return hasBusinessPant && hasBusinessShoe && hasStructuredOuterwear && !hasSportyPiece;
}
