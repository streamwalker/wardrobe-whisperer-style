// Pre-loaded wardrobe items for the demo user
import courtGreen from '@/assets/wardrobe/court-green.jpeg';
import wonderOxide from '@/assets/wardrobe/wonder-oxide.jpeg';
import puttyBeige from '@/assets/wardrobe/putty-beige.jpeg';
import sesame from '@/assets/wardrobe/sesame.jpeg';
import blackFieldJacket from '@/assets/wardrobe/black-field-jacket.jpeg';
import mustardHoodie from '@/assets/wardrobe/mustard-hoodie.jpeg';
import whiteHoodie from '@/assets/wardrobe/white-hoodie.jpeg';
import ashPearl from '@/assets/wardrobe/ash-pearl.jpeg';
import pantsHazeBlue from '@/assets/wardrobe/pants-haze-blue.jpeg';
import pantsLightCoffee from '@/assets/wardrobe/pants-light-coffee.jpeg';
import pantsDarkGreen from '@/assets/wardrobe/pants-dark-green.jpeg';
import pantsBlack from '@/assets/wardrobe/pants-black.jpeg';
import pantsDarkGray from '@/assets/wardrobe/pants-dark-gray.jpeg';
import pantsNavy from '@/assets/wardrobe/pants-navy.jpeg';
import pantsSapphireBlue from '@/assets/wardrobe/pants-sapphire-blue.jpeg';
import pantsArmyGreen from '@/assets/wardrobe/pants-army-green.jpeg';
import pantsPurple from '@/assets/wardrobe/pants-purple.jpeg';
import pantsKhaki from '@/assets/wardrobe/pants-khaki.jpeg';
import pantsCamoGreen from '@/assets/wardrobe/pants-camo-green.jpeg';
import pantsCamoArmy from '@/assets/wardrobe/pants-camo-army.jpeg';
import pantsCamoGray from '@/assets/wardrobe/pants-camo-gray.jpeg';
import pantsSageGray from '@/assets/wardrobe/pants-sage-gray.jpeg';
import pantsDarkBlue from '@/assets/wardrobe/pants-dark-blue.jpeg';
import pantsLightGray2 from '@/assets/wardrobe/pants-light-gray2.jpeg';
import pantsKhaki2 from '@/assets/wardrobe/pants-khaki2.jpeg';

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
  photo?: string;
}

export const DEMO_WARDROBE: WardrobeItem[] = [
  // Shoes
  { id: 's1', name: 'Court Green', category: 'shoes', primary_color: 'Green', color_hex: '#6B8E6B', style_tags: ['casual', 'bold'], is_new: false, is_featured: true, photo: courtGreen },
  { id: 's2', name: 'Wonder Oxide', category: 'shoes', primary_color: 'Pink', color_hex: '#C48B7A', style_tags: ['bold', 'luxury'], is_new: false, is_featured: false, photo: wonderOxide },
  { id: 's3', name: 'Putty Beige', category: 'shoes', primary_color: 'Beige', color_hex: '#C8B99A', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: true, photo: puttyBeige },
  { id: 's4', name: 'Sesame', category: 'shoes', primary_color: 'Tan', color_hex: '#B5A48A', style_tags: ['neutral', 'casual'], is_new: false, is_featured: false, photo: sesame },
  { id: 's5', name: 'FOG Athletics II', category: 'shoes', primary_color: 'Ash Pearl', color_hex: '#C8B8A8', style_tags: ['luxury', 'neutral'], is_new: true, is_featured: true, photo: ashPearl },

  // Pants
  { id: 'p1', name: 'Haze Blue', category: 'pants', primary_color: 'Blue', color_hex: '#7A8FA0', style_tags: ['casual', 'neutral'], is_new: false, is_featured: false, photo: pantsHazeBlue },
  { id: 'p2', name: 'Light Coffee', category: 'pants', primary_color: 'Brown', color_hex: '#A68B6B', style_tags: ['neutral', 'luxury'], is_new: false, is_featured: true, photo: pantsLightCoffee },
  { id: 'p3', name: 'Dark Green', category: 'pants', primary_color: 'Green', color_hex: '#3D5A3D', style_tags: ['bold', 'casual'], is_new: false, is_featured: false, photo: pantsDarkGreen },
  { id: 'p4', name: 'Black Pants', category: 'pants', primary_color: 'Black', color_hex: '#1A1A1A', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false, photo: pantsBlack },
  { id: 'p5', name: 'Dark Gray', category: 'pants', primary_color: 'Gray', color_hex: '#4A4A4A', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false, photo: pantsDarkGray },
  { id: 'p6', name: 'Navy', category: 'pants', primary_color: 'Navy', color_hex: '#2C3E50', style_tags: ['neutral', 'luxury'], is_new: false, is_featured: false, photo: pantsNavy },
  { id: 'p7', name: 'Sapphire Blue', category: 'pants', primary_color: 'Blue', color_hex: '#1E40AF', style_tags: ['bold', 'sporty'], is_new: true, is_featured: false, photo: pantsSapphireBlue },
  { id: 'p8', name: 'Army Green', category: 'pants', primary_color: 'Green', color_hex: '#4B5320', style_tags: ['bold', 'casual'], is_new: true, is_featured: false, photo: pantsArmyGreen },
  { id: 'p9', name: 'Purple', category: 'pants', primary_color: 'Purple', color_hex: '#5B3A8C', style_tags: ['bold', 'luxury'], is_new: true, is_featured: false, photo: pantsPurple },
  { id: 'p10', name: 'Khaki', category: 'pants', primary_color: 'Khaki', color_hex: '#B0A478', style_tags: ['neutral', 'casual'], is_new: true, is_featured: false, photo: pantsKhaki },
  { id: 'p11', name: 'Camo Green', category: 'pants', primary_color: 'Green', color_hex: '#4A6741', style_tags: ['bold', 'casual'], is_new: true, is_featured: false, photo: pantsCamoGreen },
  { id: 'p12', name: 'Camo Army', category: 'pants', primary_color: 'Green', color_hex: '#5C6B3A', style_tags: ['bold', 'casual'], is_new: true, is_featured: false, photo: pantsCamoArmy },
  { id: 'p13', name: 'Camo Gray', category: 'pants', primary_color: 'Gray', color_hex: '#6B6B6B', style_tags: ['bold', 'minimal'], is_new: true, is_featured: false, photo: pantsCamoGray },
  { id: 'p14', name: 'Sage Gray', category: 'pants', primary_color: 'Gray', color_hex: '#B0B8A8', style_tags: ['neutral', 'minimal'], is_new: true, is_featured: false, photo: pantsSageGray },
  { id: 'p15', name: 'Dark Blue', category: 'pants', primary_color: 'Blue', color_hex: '#1C2533', style_tags: ['neutral', 'minimal'], is_new: true, is_featured: false, photo: pantsDarkBlue },
  { id: 'p16', name: 'Light Gray', category: 'pants', primary_color: 'Gray', color_hex: '#9E9E9E', style_tags: ['neutral', 'casual'], is_new: true, is_featured: false, photo: pantsLightGray2 },
  { id: 'p17', name: 'Khaki Cargo', category: 'pants', primary_color: 'Khaki', color_hex: '#B5A882', style_tags: ['neutral', 'casual'], is_new: true, is_featured: false, photo: pantsKhaki2 },

  // Tops
  { id: 't1', name: 'Cream Shirt', category: 'tops', primary_color: 'Cream', color_hex: '#F5F0E1', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: true },
  { id: 't2', name: 'White Shirt', category: 'tops', primary_color: 'White', color_hex: '#FAFAFA', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false },
  { id: 't3', name: 'Taupe Shirt', category: 'tops', primary_color: 'Taupe', color_hex: '#B0A090', style_tags: ['neutral', 'casual'], is_new: false, is_featured: false },
  { id: 't4', name: 'Olive Shirt', category: 'tops', primary_color: 'Olive', color_hex: '#6B7B4A', style_tags: ['bold', 'casual'], is_new: false, is_featured: false },

  // Outerwear
  { id: 'o1', name: 'Oatmeal Hoodie', category: 'outerwear', primary_color: 'Oatmeal', color_hex: '#D4C9B0', style_tags: ['casual', 'neutral'], is_new: false, is_featured: true },
  { id: 'o2', name: 'Mustard Hoodie', category: 'outerwear', primary_color: 'Mustard', color_hex: '#C49B2A', style_tags: ['bold', 'casual'], is_new: false, is_featured: false, photo: mustardHoodie },
  { id: 'o3', name: 'Gray Hoodie', category: 'outerwear', primary_color: 'Gray', color_hex: '#8A8A8A', style_tags: ['neutral', 'casual'], is_new: false, is_featured: false },
  { id: 'o4', name: 'White Hoodie', category: 'outerwear', primary_color: 'White', color_hex: '#F0F0F0', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false, photo: whiteHoodie },
  { id: 'o5', name: 'Black Hoodie', category: 'outerwear', primary_color: 'Black', color_hex: '#1A1A1A', style_tags: ['neutral', 'minimal'], is_new: false, is_featured: false },
  { id: 'o6', name: 'Black Field Jacket', category: 'outerwear', primary_color: 'Black', color_hex: '#2A2A2A', style_tags: ['bold', 'luxury'], is_new: false, is_featured: true, photo: blackFieldJacket },
];

export const CATEGORIES: { value: WardrobeCategory; label: string; icon: string }[] = [
  { value: 'shoes', label: 'Shoes', icon: '👟' },
  { value: 'pants', label: 'Pants', icon: '👖' },
  { value: 'tops', label: 'Tops', icon: '👕' },
  { value: 'outerwear', label: 'Outerwear', icon: '🧥' },
];
