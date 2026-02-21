

# Separate Pants Photos — One Per Card

## Problem
Currently, two group photos are reused across multiple pants items:
- `pants-colors.jpeg` (multi-color lineup) is used for both **Light Coffee** and **Dark Green**
- `pants-dark.jpeg` (dark pants lineup) is used for **Black Pants**, **Dark Gray**, and **Navy**

This makes cards look repetitive and confusing since each card shows pants that don't match its label.

## Solution
Remove the shared group photos from pants items and fall back to the solid color swatch for now, until individual photos are uploaded.

### Changes
**File: `src/lib/wardrobe-data.ts`**
- Remove the `photo` property from all 6 pants entries (Haze Blue, Light Coffee, Dark Green, Black Pants, Dark Gray, Navy)
- Keep `pantsHazeBlue` import only if it shows a single pair — otherwise remove it too
- Remove unused `pantsColors` and `pantsDark` imports

Each pants card will display its `color_hex` swatch as a clean placeholder until you upload individual photos for each pair.

## Alternative
If you have (or want to upload) individual photos for each pair of pants, I can assign those instead. Just upload one photo per pair and I'll map them to the correct items.

