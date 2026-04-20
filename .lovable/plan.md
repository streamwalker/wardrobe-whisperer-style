
## Goal
Unzip `DripSlayerClaudeEdits2.zip` and incorporate its contents into the codebase, protecting recent Stripe + security work.

## Approach (same playbook as last round)

1. **Extract & inventory** — unzip to `/tmp/edits2/`, list every file with paths and sizes.
2. **Diff each file** against the current codebase and categorize:
   - **New file** → add as-is
   - **Safe overwrite** (UI/refactor only) → apply directly
   - **Conflict** (touches Stripe gating, security RPCs, or auto-generated files) → hand-merge, preserving both sides
   - **Skip** (forbidden file)
3. **Hard skip list** (never overwrite):
   - `src/integrations/supabase/client.ts`
   - `src/integrations/supabase/types.ts`
   - `.env`
   - `supabase/config.toml` project-level keys
4. **Protect recent work**:
   - Stripe: `useSubscription`, `Pricing`, `check-subscription` / `create-checkout` / `customer-portal` edge functions, gating in `Shop`/`Wardrobe`/`Profile`/`AppLayout`
   - Security migration: token-gated RPCs (`get_shared_profile`, `get_shared_wardrobe`), tightened storage policies, sanitized edge-function errors
   - The 6 wardrobe hooks just extracted (`useWardrobeItems`, `useWardrobeFilters`, `useWardrobeShare`, `useImageGeneration`, `useItemSelection`, `useHighlightFlash`)
5. **SQL migrations in the zip** → never overwrite existing migrations; layer on top with a fresh timestamp if needed.
6. **Verify** — run `tsc` after merging; confirm Stripe gating + token-gated RPCs still intact.
7. **Report back** — files added / merged / skipped with reasons, and any judgment calls.

## What I need from you
Approval. Once approved I'll switch to default mode, unzip, and walk through the merge — flagging any conflict with Stripe/security before overriding.
