

## Goal
Auto-create a `profiles` row whenever a new user signs up, eliminating the need for `upsert` bootstrapping in `Profile.tsx`.

## Current state
- `public.handle_new_user()` already exists as a `SECURITY DEFINER` function that inserts `(user_id, display_name = email prefix)` into `profiles`.
- **No trigger is wired to it** — confirmed via `pg_trigger` lookup. So new signups never trigger a profile insert today.
- `Profile.tsx` currently compensates with `.upsert(..., { onConflict: "user_id" })`.

## Approach

### 1. Migration: attach the trigger to `auth.users`
Create a migration that adds:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

The function is already `SECURITY DEFINER` with a locked `search_path`, so no function changes are required.

### 2. Backfill any existing users missing a profile row
Same migration, idempotent insert so existing accounts (including the user's own) get rows immediately:

```sql
INSERT INTO public.profiles (user_id, display_name)
SELECT u.id, split_part(u.email, '@', 1)
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;
```

### 3. Revert `Profile.tsx` to a clean `.update()`
With the trigger guaranteeing the row exists, switch the `updateProfile` mutation back from `.upsert(...)` to:

```ts
const { error } = await supabase
  .from("profiles")
  .update(updates)
  .eq("user_id", user!.id);
```

Keeps the code intent explicit ("I'm editing my profile") and avoids the `onConflict` ceremony.

## Files touched
- New migration file under `supabase/migrations/` — trigger + backfill.
- `src/pages/Profile.tsx` — swap upsert back to update.

## Verification checklist
- Create a brand-new account → check `profiles` table has a row with `display_name = email prefix` immediately, before visiting `/profile`.
- Edit and save profile fields on the new account → values persist after reload.
- Existing accounts (including current user) still load and save normally.
- Deleting a user from `auth.users` cascades cleanly (no change to delete behavior — trigger only fires on INSERT).

