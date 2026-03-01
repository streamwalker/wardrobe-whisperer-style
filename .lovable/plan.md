

# Transfer and Redeem Wardrobe Feature

## Overview
Add two new buttons to the Wardrobe page -- **Transfer** (generate a one-time code) and **Redeem** (paste a code to copy items) -- allowing users to share their entire wardrobe with another user as a copy.

## Database Changes

### New table: `wardrobe_transfers`
| Column | Type | Details |
|--------|------|---------|
| id | uuid | PK, default `gen_random_uuid()` |
| sender_id | uuid | NOT NULL, the user who created the code |
| transfer_code | text | NOT NULL, unique, 8-char hex code |
| redeemed_by | uuid | NULL until someone redeems it |
| redeemed_at | timestamptz | NULL until redeemed |
| created_at | timestamptz | default `now()` |

### RLS Policies
- **SELECT own transfers**: `auth.uid() = sender_id` (so senders can see their codes)
- **INSERT own transfers**: `auth.uid() = sender_id`
- No public read -- redemption will go through a secure database function

### Database function: `redeem_wardrobe_transfer(p_code text)`
A `SECURITY DEFINER` function that:
1. Looks up the transfer by code
2. Checks it hasn't already been redeemed (returns error if so)
3. Marks it as redeemed (`redeemed_by = auth.uid()`, `redeemed_at = now()`)
4. Copies all `wardrobe_items` from the sender into the redeemer's account (new UUIDs, same name/category/color/style/photo data, `user_id = auth.uid()`)
5. Returns the count of items copied

Using an RPC function ensures the entire operation is atomic and secure -- no one can redeem the same code twice.

## Frontend Changes

### Wardrobe.tsx
- Add two new state variables: `transferDialogOpen` and `redeemDialogOpen`
- Add two new buttons in the header button row (next to Occasion and Share):
  - **Transfer** button (with `ArrowRightLeft` icon)
  - **Redeem** button (with `Gift` icon)

### Transfer Dialog
- On click, insert a row into `wardrobe_transfers` with the user's ID
- Display the generated `transfer_code` in a dialog with a copy button (same pattern as existing Share dialog)

### Redeem Dialog
- Text input for pasting a transfer code
- "Redeem" button that calls `supabase.rpc('redeem_wardrobe_transfer', { p_code: code })`
- On success, show a toast with the number of items copied and refresh the wardrobe list
- On error (already redeemed / invalid code), show an error toast

## Technical Details

```text
+------------------+       +-------------------------+
|  Transfer Button | ----> | INSERT wardrobe_transfers|
|  (generates code)|       | (returns transfer_code)  |
+------------------+       +-------------------------+

+------------------+       +-----------------------------+
|  Redeem Button   | ----> | RPC redeem_wardrobe_transfer |
|  (pastes code)   |       | - validates code             |
+------------------+       | - checks not redeemed        |
                           | - copies all sender items    |
                           | - marks code as used         |
                           +-----------------------------+
```

### Migration SQL summary
- Create `wardrobe_transfers` table with RLS enabled
- Add RLS policies for owner access
- Create `redeem_wardrobe_transfer` RPC function as `SECURITY DEFINER`

### Items copied per transfer
All columns from `wardrobe_items` are duplicated except `id` (new UUID) and `user_id` (set to redeemer). The `created_at`/`updated_at` timestamps reset to `now()`.

