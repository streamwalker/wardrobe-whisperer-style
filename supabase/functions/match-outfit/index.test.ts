import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

// We'll test the shared validation logic directly
import { isValidOutfitPairing } from "../_shared/dress-shirt-rules.ts";

// Mock items
const joggers = { id: "joggers-1", category: "pants", name: "Black Joggers", description: "Comfortable jogger pants", subcategory: "joggers", style_tags: ["casual", "sporty"] };
const dressShirt = { id: "dress-1", category: "tops", name: "White Dress Shirt", description: "Formal button-down dress shirt", subcategory: "dress shirt", style_tags: ["formal"] };
const suit = { id: "suit-1", category: "suits", name: "Navy Suit", description: "Tailored navy suit", subcategory: "suit", style_tags: ["formal"] };
const dressShoes = { id: "dshoes-1", category: "dress-shoes", name: "Black Oxford Dress Shoes", description: "Leather oxford dress shoes", subcategory: "oxford", style_tags: ["formal"] };
const hoodie = { id: "hoodie-1", category: "tops", name: "Gray Hoodie", description: "Cotton pullover hoodie", subcategory: "hoodie", style_tags: ["casual"] };
const sneakers = { id: "sneak-1", category: "shoes", name: "White Sneakers", description: "Casual sneaker shoes", subcategory: "sneakers", style_tags: ["casual"] };
const tshirt = { id: "tshirt-1", category: "tops", name: "Black T-Shirt", description: "Cotton crew neck tee", subcategory: "t-shirt", style_tags: ["casual"] };
const chinos = { id: "chinos-1", category: "pants", name: "Khaki Chinos", description: "Tailored chino trousers", subcategory: "chinos", style_tags: ["smart casual"] };
const blazer = { id: "blazer-1", category: "outerwear", name: "Navy Blazer", description: "Structured tailored blazer", subcategory: "blazer", style_tags: ["formal"] };
const tie = { id: "tie-1", category: "accessories", name: "Silk Tie", description: "Navy silk tie", subcategory: "tie", style_tags: ["formal"] };
const loafers = { id: "loafer-1", category: "shoes", name: "Brown Loafers", description: "Leather penny loafer shoes", subcategory: "loafers", style_tags: ["smart casual"] };

// --- Jogger rules ---
Deno.test("Joggers + Dress Shirt = invalid", () => {
  const result = isValidOutfitPairing([joggers, dressShirt, sneakers]);
  assertEquals(result, false);
});

Deno.test("Joggers + Suit = invalid", () => {
  const result = isValidOutfitPairing([joggers, suit, dressShirt, dressShoes, tie]);
  assertEquals(result, false);
});

Deno.test("Joggers + Dress Shoes = invalid", () => {
  const result = isValidOutfitPairing([joggers, tshirt, dressShoes]);
  assertEquals(result, false);
});

Deno.test("Joggers + T-Shirt + Sneakers = valid (all casual)", () => {
  const result = isValidOutfitPairing([joggers, tshirt, sneakers]);
  assertEquals(result, true);
});

// --- Suit rules ---
Deno.test("Suit + Sneakers = invalid", () => {
  const result = isValidOutfitPairing([suit, dressShirt, sneakers, tie]);
  assertEquals(result, false);
});

Deno.test("Suit + Hoodie = invalid", () => {
  const result = isValidOutfitPairing([suit, hoodie, dressShoes, tie]);
  assertEquals(result, false);
});

Deno.test("Suit + Dress Shirt + Dress Shoes + Tie = valid", () => {
  const result = isValidOutfitPairing([suit, dressShirt, dressShoes, tie]);
  assertEquals(result, true);
});

// --- Hoodie rules ---
Deno.test("Hoodie + Dress Shoes = invalid", () => {
  const result = isValidOutfitPairing([hoodie, chinos, dressShoes]);
  assertEquals(result, false);
});

Deno.test("Hoodie + Sneakers + Joggers = valid (all casual)", () => {
  const result = isValidOutfitPairing([hoodie, joggers, sneakers]);
  assertEquals(result, true);
});

// --- Dress shirt strict suit-only rule ---
Deno.test("Dress Shirt + Chinos + Loafers + Blazer (no suit) = invalid", () => {
  const result = isValidOutfitPairing([dressShirt, chinos, loafers, blazer]);
  assertEquals(result, false);
});

Deno.test("Dress Shirt without Suit = invalid", () => {
  const result = isValidOutfitPairing([dressShirt, chinos, dressShoes, tie]);
  assertEquals(result, false);
});

// --- Polo rules ---
const polo = { id: "polo-1", category: "tops", name: "Navy Polo Shirt", description: "Classic pique polo", subcategory: "polo", style_tags: ["smart casual"] };

Deno.test("Polo + Chinos + Loafers = valid (smart casual)", () => {
  const result = isValidOutfitPairing([polo, chinos, loafers]);
  assertEquals(result, true);
});

Deno.test("Polo + Suit = invalid", () => {
  const result = isValidOutfitPairing([polo, suit, dressShoes]);
  assertEquals(result, false);
});

Deno.test("Polo + Dress Shoes = invalid", () => {
  const result = isValidOutfitPairing([polo, chinos, dressShoes]);
  assertEquals(result, false);
});

Deno.test("Polo + Joggers = invalid", () => {
  const result = isValidOutfitPairing([polo, joggers, sneakers]);
  assertEquals(result, false);
});

Deno.test("Polo + Hoodie = invalid", () => {
  const result = isValidOutfitPairing([polo, hoodie, chinos, sneakers]);
  assertEquals(result, false);
});
