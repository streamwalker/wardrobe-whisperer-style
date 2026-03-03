export type WardrobeCategory = 'shoes' | 'pants' | 'tops' | 'outerwear' | 'suits' | 'accessories';
export type ShoeSubcategory = 'hi-tops' | 'boots' | 'dress-shoes';
export type AccessorySubcategory = 'ties' | 'belts';
export type StyleTag = 'casual' | 'neutral' | 'bold' | 'luxury' | 'minimal' | 'sporty';

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  subcategory?: string;
  primary_color: string;
  color_hex: string;
  style_tags: StyleTag[];
  is_new: boolean;
  is_featured: boolean;
  photo?: string;
}

export const SHOE_SUBCATEGORIES: { value: ShoeSubcategory; label: string }[] = [
  { value: 'hi-tops', label: '👟 Hi-Tops' },
  { value: 'boots', label: '🥾 Boots' },
  { value: 'dress-shoes', label: '👞 Dress Shoes' },
];

export const ACCESSORY_SUBCATEGORIES: { value: AccessorySubcategory; label: string }[] = [
  { value: 'ties', label: '👔 Ties' },
  { value: 'belts', label: '🪢 Belts' },
];

export const CATEGORIES: { value: WardrobeCategory; label: string; icon: string }[] = [
  { value: 'shoes', label: 'Shoes', icon: '👟' },
  { value: 'pants', label: 'Pants', icon: '👖' },
  { value: 'tops', label: 'Tops', icon: '👕' },
  { value: 'outerwear', label: 'Outerwear', icon: '🧥' },
  { value: 'suits', label: 'Suits', icon: '🤵' },
  { value: 'accessories', label: 'Accessories', icon: '👔' },
];

export type ColorTone = 'dark' | 'light' | 'neutral';

export function getColorTone(hex: string): ColorTone {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.4) return 'dark';
  if (luminance > 0.7) return 'light';
  return 'neutral';
}

export const TONE_FILTERS: { value: ColorTone; label: string }[] = [
  { value: 'dark', label: '🌑 Dark' },
  { value: 'light', label: '☀️ Light' },
  { value: 'neutral', label: '🔘 Neutral' },
];

export const STYLE_FILTERS: { value: StyleTag; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'sporty', label: 'Sporty' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'neutral', label: 'Neutral' },
];
