

# StyleMatch — AI-Powered Wardrobe & Outfit App

## Overview
A minimalist, clean wardrobe management app that helps users catalog their clothing, get AI-powered outfit suggestions, and make smarter shopping decisions by matching new finds against their existing wardrobe.

---

## 1. User Accounts & Onboarding
- Email/password signup and login
- Onboarding flow where users set their style profile: skin tone, body type, color preferences, and style mood (e.g., neutral, bold, luxury)
- Your profile will be pre-configured as the demo user (dark skin, athletic build, earth tones & warm neutrals preference)

## 2. Wardrobe Catalog
- Grid-based wardrobe view organized by category: Shoes, Pants, Tops, Outerwear
- Each item displays a photo, name, primary color swatch, and style tags (casual, neutral, bold)
- Users can upload a photo of a clothing item; AI will auto-detect the item type, dominant color, and suggest style tags
- Manual editing of all metadata after AI detection
- Ability to tag items as "New" or "Featured" for quick reference
- **Pre-loaded with your wardrobe**: Court Green, Wonder Oxide, Putty Beige, Sesame shoes; Haze Blue, Light Coffee, Dark Green, Black, Dark Gray, Navy pants; Cream, White, Taupe, Olive shirts; Oatmeal, Mustard, Gray, White, Black hoodies and Black field jacket

## 3. Smart Matching Engine
- Hybrid approach: AI analyzes uploaded item colors + rule-based color theory matching (complementary, analogous, triadic)
- When viewing any item, see instant outfit suggestions from existing wardrobe pieces
- Mood-based filtering: get suggestions for "casual day," "polished neutral," or "bold accent" looks
- Each suggestion includes a brief explanation of why the combo works (e.g., "Analogous earth tones create a cohesive modern look")
- Matching adapts to user profile — e.g., prioritizing high-contrast pairings for dark skin tones

## 4. Shopping Mode
- Camera/upload feature specifically for items spotted while shopping (in-store photos or online screenshots)
- AI detects the item's color and type, then instantly shows outfit combinations using your existing wardrobe
- "Full Look" button generates a complete head-to-toe outfit suggestion incorporating the potential purchase
- Helps answer "does this go with anything I own?" before buying

## 5. Outfit Builder & Favorites
- Visual outfit preview showing items arranged together (top → bottom → shoes layout)
- Save outfits to a Favorites collection
- Browse saved outfits for daily inspiration
- Rate or dismiss suggestions to help the app learn preferences over time

## 6. Style Profile & Learning
- Profile stores color preferences, skin tone, body type, and style mood
- The app weighs suggestions based on profile — your setup emphasizes earth tones, bold neutrals, and complementary warm accents
- Over time, favorited and dismissed outfits refine future suggestions

## Tech Approach
- **Backend**: Lovable Cloud for database (wardrobe items, outfits, profiles), authentication, and file storage (item photos)
- **AI**: Lovable AI for color detection from photos and intelligent matching suggestions
- **Design**: Minimalist & clean — white backgrounds, crisp typography, subtle shadows, Pinterest-style grid layout

