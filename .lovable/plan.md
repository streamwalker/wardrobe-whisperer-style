

# Add Category Pairing Rules to Outfit Matching

The current system relies on AI prompts and dress-shirt-specific validation, but doesn't enforce hard rules for other category mismatches the user described. We need both prompt-level guidance AND a post-generation validation layer.

## Changes

### 1. Shared Rules (`supabase/functions/_shared/dress-shirt-rules.ts`)
Add new validation functions and a master `isValidOutfitPairing` function that checks ALL rules:

- `isSneaker(item)` — detects sneakers/hi-tops from shoes category
- `isBoot(item)` — detects boots from shoes category  
- `isJogger(item)` — detects joggers/sweatpants from pants category
- `isHoodie(item)` — detects hoodies from tops/outerwear category
- `hasSuit(items)` — checks if outfit contains a suit

New hard rules enforced in code:
- **Sneakers + Suits = invalid** (sneakers cannot pair with suits)
- **Boots + Suits = invalid** (boots cannot pair with suits)
- **Joggers + Dress shirts = invalid** (already covered but making explicit)
- **Hoodies + Suits = invalid** (hoodies cannot pair with suits)

Rename/expand `isValidDressShirtPairing` → `isValidOutfitPairing` that runs ALL checks including the existing dress shirt rules.

### 2. Edge Function (`supabase/functions/match-outfit/index.ts`)
- Update import to use new `isValidOutfitPairing`
- Add these rules to the `styleRules` and `systemPrompt` strings so the AI avoids generating them in the first place
- Update the post-generation filter (line 395) to use the new combined validator

### 3. Prompt Updates
Add to the HARD STYLE RULES section in all prompts:
```
- SUITS require dress shoes (never sneakers, boots, or casual shoes)
- SUITS require dress shirts or formal tops (never hoodies, t-shirts, or casual tops)
- JOGGERS/SWEATPANTS are strictly casual — never pair with dress shirts, suits, or formal items
- HOODIES are strictly casual — never pair with suits, dress shoes, or formal accessories
```

### Files to Edit
| File | Change |
|------|--------|
| `supabase/functions/_shared/dress-shirt-rules.ts` | Add sneaker/boot/jogger/hoodie detectors + master `isValidOutfitPairing` |
| `supabase/functions/match-outfit/index.ts` | Update imports, prompts, and post-generation filter |

