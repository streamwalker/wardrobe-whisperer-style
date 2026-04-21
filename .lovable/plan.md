

## Goal
Unzip `DripSlayerClaudeEdits3.zip`, inventory its contents, and merge changes into the codebase without clobbering recent work (Stripe monetization, security RLS hardening, dialog viewport fix, dress-shirt/polo strict pairing rules, dress-shirt UI hint).

## Why a plan first
I'm in read-only/plan mode and can't run `unzip` to inspect the archive. I'll follow the same proven playbook used for `DripSlayerClaudeEdits.zip` and `…Edits2.zip`.

## Approach

1. **Extract & inventory**
   - Copy `user-uploads://DripSlayerClaudeEdits3.zip` → `/tmp/edits3.zip`, unzip to `/tmp/edits3/`.
   - List every file with path + size for a clean inventory.

2. **Diff each file against current codebase**, categorize:
   - **New file** → add as-is.
   - **Safe upgrade** (additive, no conflict with recent work) → apply.
   - **Conflict with recent work** → skip or surgically merge, flag in report.
   - **Outdated** (stale snapshot of file we've since improved) → skip.

3. **Protected areas — do NOT clobber**
   - Stripe monetization: `useSubscription`, `Pricing`, `Shop` lock, `create-checkout`, `customer-portal`, `check-subscription`.
   - Security: token-gated RPCs for shared wardrobe; RLS policies (PERMISSIVE only).
   - Dialog viewport fix: `src/components/ui/dialog.tsx`, `EditItemDialog.tsx` sticky footer.
   - Outfit rules: `supabase/functions/_shared/dress-shirt-rules.ts` (strict dress-shirt + polo rules), `match-outfit/index.ts` prompts, `match-outfit/index.test.ts` (16 passing tests).
   - Dress-shirt hint: `src/lib/dress-shirt-hint.ts`, `src/pages/Wardrobe.tsx` hint card.
   - Auth flow: signup with EULA/GDPR consent, no anonymous signups.
   - Auto-generated files: `src/integrations/supabase/client.ts`, `types.ts`, `.env`, `supabase/config.toml` project-level keys.

4. **SQL migrations in the zip**
   - Never overwrite existing migrations.
   - If new schema changes are present, layer with a fresh timestamp via `supabase--migration` after user approval.
   - Validate against existing CHECK constraints (e.g., `wardrobe_items.category`).

5. **Verify after merge**
   - Run `tsc` (build check).
   - Run `supabase--test_edge_functions` for `match-outfit` to confirm 16 dress-shirt/polo tests still pass.
   - Sanity-check Stripe gating + token-gated RPCs intact.
   - Quick visual confirmation that dialog viewport fix and dress-shirt hint still work.

6. **Report back**
   - Files added / merged / skipped with reasons.
   - Any judgment calls flagged, conflicts resolved, follow-ups recommended.

## What I need from you
Approval. Once approved I'll switch to default mode, unzip, inventory, and walk through the merge — flagging any conflict with protected areas before overriding.

