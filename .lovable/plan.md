

# Fix: Outfit Saving Fails Due to UUID Type Mismatch

## Problem
The `saved_outfits` table has `item_ids` defined as `uuid[]` (array of UUIDs), but the wardrobe items in the app use short string IDs like `"p2"`, `"t1"`, `"s1"`. When saving an outfit, the database rejects these IDs with:

> `invalid input syntax for type uuid: "p2"`

## Solution
Run a database migration to change the `item_ids` column from `uuid[]` to `text[]` so it accepts the short string IDs used by the demo wardrobe.

## Changes

### Database migration (SQL)
- Alter the `saved_outfits` table to change `item_ids` from `uuid[]` to `text[]`
- Update the default value from `'{}'::uuid[]` to `'{}'::text[]`

### No code changes needed
The frontend already sends string arrays -- it's only the database column type that's wrong.

