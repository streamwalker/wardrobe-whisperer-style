

## Goal
Unzip `DripSlayerClaudeEdits.zip` and merge the changes into the current Drip Slayer codebase carefully, without clobbering recent work (Stripe monetization, security RLS hardening, shared wardrobe RPCs).

## Why a plan first
I'm in read-only/plan mode and can't run `unzip` to inspect the archive's contents. The zip appears to be a Claude-generated refactor (`wardrobe-refactor.zip` inside), and a blind overwrite could undo:
- Stripe edge functions (`check-subscription`, `create-checkout`, `customer-portal`)
- New `useSubscription` hook, `Pricing` page, gating in `Shop`/`Wardrobe`/`Profile`/`AppLayout`
- The recent security migration (token-gated RPCs, tightened storage policies)
- Auto-generated files that must NEVER be edited: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`, `supabase/config.toml` project-level settings

## Approach

1. **Extract and inventory**
   - Unzip to `/tmp/edits/` and list every file with size + path.
   - Show you the file tree so we both understand the scope before merging.

2. **Diff each file against the current codebase**
   - For every file in the zip, compare to the matching project file.
   - Categorize each as: **new file**, **safe overwrite** (pure improvement), **conflict** (touches Stripe/security/auto-generated files), or **skip** (forbidden file).

3. **Protect critical files (hard skip list)**
   - `src/integrations/supabase/client.ts`
   - `src/integrations/supabase/types.ts`
   - `.env`
   - `supabase/config.toml` (project-level keys)
   - Any file that would remove Stripe gating or weaken the security migration

4. **Merge strategy per category**
   - **New files / pure additions** → copy in as-is.
   - **Safe overwrites** (UI polish, refactors not touching monetization/security) → apply directly.
   - **Conflicts** → merge by hand, keeping both the Claude refactor's improvements AND the Stripe + security work. Show you the merged result.
   - **SQL migrations in the zip** → never overwrite existing migration files; if needed, create a NEW timestamped migration that layers on top.

5. **Verify**
   - Run the linter / typecheck after merging.
   - Confirm Stripe gating still works (`useSubscription`, `Pricing`, `Shop` lock).
   - Confirm the security migration is intact (token-gated RPCs still present).

6. **Report back**
   - Summary of: files added, files merged, files skipped (and why), and any conflicts I resolved with a judgment call.

## What I need from you
Just approval — once approved I'll switch to default mode, unzip, and walk through the merge. If the archive contains anything that conflicts with the Stripe/security work, I'll flag it and ask before overriding.

