

## Goal
Move the onboarding-completed flag from `localStorage` to the `profiles` table so the tour state follows users across devices and browsers.

## Approach

### 1. Database migration
Add a nullable timestamp column to `profiles`:

```sql
ALTER TABLE public.profiles
ADD COLUMN onboarding_completed_at timestamp with time zone;
```

Using a timestamp (vs boolean) gives us free analytics and remains backward-compatible with existing rows (NULL = not completed). No backfill needed — existing users will see the tour once on their next visit, which is acceptable (and we'll guard with the empty-wardrobe condition so returning users with items won't be interrupted).

### 2. Refactor `useOnboarding` hook
Replace localStorage reads/writes with Supabase calls:

- Accept `userId` as a parameter.
- On mount (when `ready` + `shouldAutoStart`), `SELECT onboarding_completed_at FROM profiles WHERE user_id = ?`.
- If null AND `shouldAutoStart`, open the tour after a short delay.
- `finish()` → `UPDATE profiles SET onboarding_completed_at = now() WHERE user_id = ?`, then close.
- `start()` unchanged (just opens).
- Export a new `restartOnboarding(userId)` async function that sets `onboarding_completed_at = NULL`.

Keep the in-memory `isOpen` state. Remove the `STORAGE_KEY` constant entirely — no localStorage fallback (clean cutover).

### 3. Update call sites
- **`src/pages/Wardrobe.tsx`** — pass `user.id` into `useOnboarding({ userId, ready, shouldAutoStart })`.
- **`src/pages/Profile.tsx`** — "Replay tour" button becomes async: call the new `restartOnboarding(user.id)` then navigate to `/wardrobe` (or call `start()` if the hook is mounted there). Show a toast on completion.

### 4. Files touched
- **New migration** under `supabase/migrations/` — adds `onboarding_completed_at` column.
- **Edit:** `src/hooks/useOnboarding.ts` — swap localStorage for Supabase.
- **Edit:** `src/pages/Wardrobe.tsx` — pass `userId` to the hook.
- **Edit:** `src/pages/Profile.tsx` — async replay handler.

No changes to `OnboardingTour.tsx`, `tour-steps.ts`, or any anchors.

## Verification checklist
- New account on Browser A → tour shows → complete it → reload → tour does not reappear.
- Same account on Browser B (or incognito) → tour does NOT reappear (flag is server-side).
- Profile → **Replay tour** → flag clears → tour shows again on /wardrobe.
- Existing users with non-empty wardrobes → still not interrupted (empty-wardrobe guard preserved).
- RLS: only the user's own profile row is read/updated (existing policies already enforce this).

