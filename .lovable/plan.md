
## Add 7 Default Silk Dress Shirts to Your Wardrobe

Since your wardrobe already has items, the auto-seeding logic was skipped. I'll manually insert the 7 luxury silk dress shirts directly into your wardrobe using a database insert.

### Items to Add
1. White Button-Down Dress Shirt
2. Purple Button-Down Dress Shirt
3. Pink Button-Down Dress Shirt
4. Black Button-Down Dress Shirt
5. Dark Navy Button-Down Dress Shirt
6. Light Gray Button-Down Dress Shirt
7. Dark Storm Gray Button-Down Dress Shirt

All items will use the refined silk shirt images already stored in `public/wardrobe/` and will be fully editable/deletable like any other wardrobe item.

### Technical Details
- Run a single SQL `INSERT` into the `wardrobe_items` table for user `51557f90-45be-4ef8-a725-72f6ad45083e`
- Each row will include: name, category ("tops"), primary_color, color_hex, style_tags, photo_url (pointing to the local `/wardrobe/shirt-*.jpeg` assets), is_new, and is_featured values matching the defaults in `src/lib/default-wardrobe-items.ts`
- No schema changes needed -- this is a data-only operation
- After insertion, refreshing the wardrobe page will show the new shirts immediately
