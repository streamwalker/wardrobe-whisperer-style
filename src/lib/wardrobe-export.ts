import { CATEGORIES, type WardrobeItem } from './wardrobe-data';

export function exportWardrobeItems(items: WardrobeItem[]) {
  return { version: 2, exportedAt: new Date().toISOString(), photos: 'links-only', items: items.map(item => ({
    name: item.name, category: item.category, subcategory: item.subcategory ?? null,
    primary_color: item.primary_color, color_hex: item.color_hex, style_tags: [...item.style_tags],
    pattern: item.pattern ?? null, texture: item.texture ?? null,
    is_new: item.is_new, is_featured: item.is_featured,
    photo_url: item.photo ?? null, photo_back_url: item.photo_back ?? null,
  })) };
}

export function validImportedItem(item: unknown): item is Record<string, any> {
  if (!item || typeof item !== 'object') return false;
  const value = item as Record<string, unknown>;
  return typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length <= 300 &&
    CATEGORIES.some(category => category.value === value.category) &&
    typeof value.primary_color === 'string' && value.primary_color.length > 0 && value.primary_color.length <= 100 &&
    (value.style_tags == null || (Array.isArray(value.style_tags) && value.style_tags.length <= 20 && value.style_tags.every(tag => typeof tag === 'string' && tag.length <= 100)));
}

function photoLink(value: unknown) {
  if (typeof value !== 'string' || value.length > 4000) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { return new URL(value).protocol === 'https:' ? value : null; } catch { return null; }
}

export function importedItemRow(item: Record<string, any>, userId: string) {
  const optionalText = (value: unknown) => typeof value === 'string' ? value.slice(0, 100) : null;
  return {
    user_id: userId, name: item.name.trim(), category: item.category,
    subcategory: optionalText(item.subcategory), primary_color: item.primary_color,
    color_hex: /^#[0-9a-f]{6}$/i.test(item.color_hex) ? item.color_hex : null,
    style_tags: item.style_tags || [], pattern: optionalText(item.pattern), texture: optionalText(item.texture),
    is_new: item.is_new === true, is_featured: item.is_featured === true,
    photo_url: photoLink(item.photo_url), photo_back_url: photoLink(item.photo_back_url),
  };
}
