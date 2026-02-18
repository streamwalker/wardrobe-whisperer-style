// Pre-loaded wardrobe items for the demo user
export type WardrobeCategory = 'shoes' | 'pants' | 'tops' | 'outerwear';
export type StyleTag = 'casual' | 'neutral' | 'bold' | 'luxury' | 'minimal' | 'sporty';

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  primary_color: string;
  color_hex: string;
  style_tags: StyleTag[];
  is_new: boolean;
  is_featured: boolean;
}

export const DEMO_WARDROBE: WardrobeItem[] = [
  // Shoes
  { id: 's1', name: 'Court Green', category: 'shoes', primary_color: 'Green', color_hex: '#6B8E6B', style_tags: ['casual', 'bold'], is_new: false, is_featured: true },
  { id: 's2', name: 'Wonder Oxide', category: 'shoes', primary_color: 'Pink', color_hex: '#C48B7A', style_tags: ['bold', 'luxury'], is_new: false, is_featured: false },
  { id: 's3', name: 'Putty Beige', category: 'shoes', primary_color: 'Beige', color_hex: '#C8B99A', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: true },
  { id: 's4', name: 'Sesame', category: 'shoes', primary_color: 'Tan', color_hex: '#B5A48A', style_tags: ['neutral', 'casual'], is_new: false, is_featured: false },

  // Pants
  { id: 'p1', name: 'Haze Blue', category: 'pants', primary_color: 'Blue', color_hex: '#7A8FA0', style_tags: ['casual', 'neutral'], is_new: false, is_featured: false },
  { id: 'p2', name: 'Light Coffee', category: 'pants', primary_color: 'Brown', color_hex: '#A68B6B', style_tags: ['neutral', 'luxury'], is_new: false, is_featured: true },
  { id: 'p3', name: 'Dark Green', category: 'pants', primary_color: 'Green', color_hex: '#3D5A3D', style_tags: ['bold', 'casual'], is_new: false, is_featured: false },
  { id: 'p4', name: 'Black Pants', category: 'pants', primary_color: 'Black', color_hex: '#1A1A1A', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false },
  { id: 'p5', name: 'Dark Gray', category: 'pants', primary_color: 'Gray', color_hex: '#4A4A4A', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false },
  { id: 'p6', name: 'Navy', category: 'pants', primary_color: 'Navy', color_hex: '#2C3E50', style_tags: ['neutral', 'luxury'], is_new: false, is_featured: false },

  // Tops
  { id: 't1', name: 'Cream Shirt', category: 'tops', primary_color: 'Cream', color_hex: '#F5F0E1', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: true },
  { id: 't2', name: 'White Shirt', category: 'tops', primary_color: 'White', color_hex: '#FAFAFA', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false },
  { id: 't3', name: 'Taupe Shirt', category: 'tops', primary_color: 'Taupe', color_hex: '#B0A090', style_tags: ['neutral', 'casual'], is_new: false, is_featured: false },
  { id: 't4', name: 'Olive Shirt', category: 'tops', primary_color: 'Olive', color_hex: '#6B7B4A', style_tags: ['bold', 'casual'], is_new: false, is_featured: false },

  // Outerwear
  { id: 'o1', name: 'Oatmeal Hoodie', category: 'outerwear', primary_color: 'Oatmeal', color_hex: '#D4C9B0', style_tags: ['casual', 'neutral'], is_new: false, is_featured: true },
  { id: 'o2', name: 'Mustard Hoodie', category: 'outerwear', primary_color: 'Mustard', color_hex: '#C49B2A', style_tags: ['bold', 'casual'], is_new: false, is_featured: false },
  { id: 'o3', name: 'Gray Hoodie', category: 'outerwear', primary_color: 'Gray', color_hex: '#8A8A8A', style_tags: ['neutral', 'casual'], is_new: false, is_featured: false },
  { id: 'o4', name: 'White Hoodie', category: 'outerwear', primary_color: 'White', color_hex: '#F0F0F0', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false },
  { id: 'o5', name: 'Black Hoodie', category: 'outerwear', primary_color: 'Black', color_hex: '#1A1A1A', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false },
  { id: 'o6', name: 'Black Field Jacket', category: 'outerwear', primary_color: 'Black', color_hex: '#2A2A2A', style_tags: ['bold', 'luxury'], is_new: false, is_featured: true },
];

export const CATEGORIES: { value: WardrobeCategory; label: string; icon: string }[] = [
  { value: 'shoes', label: 'Shoes', icon: '👟' },
  { value: 'pants', label: 'Pants', icon: '👖' },
  { value: 'tops', label: 'Tops', icon: '👕' },
  { value: 'outerwear', label: 'Outerwear', icon: '🧥' },
];
