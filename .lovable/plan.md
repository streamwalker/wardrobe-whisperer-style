

## Fix: Profile Updates Not Saving

### Root Cause

All RLS policies on the `profiles` table are set as **RESTRICTIVE** (`Permissive: No`). In PostgreSQL, restrictive policies only further narrow access that was already granted by a permissive policy. Since there are **zero permissive policies**, no access is granted at all — reads and writes silently fail.

The same issue affects all four tables (`profiles`, `saved_outfits`, `wardrobe_items`, `wardrobe_shares`, `wardrobe_transfers`), but the user is currently hitting it on `profiles`.

### Fix

Run a migration to drop the existing restrictive policies on `profiles` and recreate them as **permissive** policies:

1. Drop all four existing policies on `profiles`
2. Recreate them as permissive (the default) with the same logic
3. Also fix the other tables' policies since they have the same problem (prevents future issues)

### Files to Change
- **Database migration only** — no code changes needed. The frontend code is correct; the RLS policy type is the issue.

