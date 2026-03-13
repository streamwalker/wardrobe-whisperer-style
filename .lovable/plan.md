

# Monetize Drip Slayer with Stripe Subscriptions

## Strategy

Freemium model with a **Free** tier and a **Pro** tier ($4.99/month or $39.99/year lifetime-style annual). Gate the AI-powered features behind Pro since those cost you money to run.

## Free vs Pro Feature Split

| Feature | Free | Pro |
|---------|------|-----|
| Wardrobe items | Up to 20 | Unlimited |
| Manual outfit saving | Yes | Yes |
| AI outfit matching | 3 per month | Unlimited |
| Shopping Mode (AI analyze + match) | No | Yes |
| Occasion-based outfit suggestions | No | Yes |
| Export outfits PDF | No | Yes |

## Implementation

### Step 1: Enable Stripe
Use the Stripe integration tool to set up Stripe and create two products:
- **Drip Slayer Pro Monthly** — $4.99/month
- **Drip Slayer Pro Annual** — $39.99/year

### Step 2: Database
- Create `subscriptions` table to track user subscription status (user_id, stripe_customer_id, status, plan, current_period_end)
- Create edge function webhook endpoint to handle Stripe events and update subscription status
- RLS: users can read their own subscription row

### Step 3: Subscription Hook
- Create `useSubscription()` hook that queries the `subscriptions` table for the current user
- Returns `{ isPro, isLoading, subscription }` 
- Used across the app to gate features

### Step 4: Pricing Page
- New `/pricing` route with a clean pricing card layout showing Free vs Pro
- Checkout button calls an edge function that creates a Stripe checkout session
- Success page validates the checkout

### Step 5: Feature Gating
- **Wardrobe page**: Show item count and limit banner for free users (20 items max)
- **Shop page**: Show upgrade prompt instead of the upload area for free users
- **Outfits page**: Limit AI matching to 3/month for free users, show counter
- **Profile page**: Add "Pro" badge and manage subscription link
- **Nav**: Add subtle "Upgrade" button for free users

### Step 6: Customer Portal
- Add "Manage Subscription" link in Profile that opens Stripe's customer portal for billing management

### Files to Create/Edit
| File | Change |
|------|--------|
| Edge function: `checkout` | Create Stripe checkout session |
| Edge function: `stripe-webhook` | Handle subscription lifecycle events |
| `subscriptions` table | Track user subscription status |
| `src/hooks/useSubscription.ts` | Query subscription status |
| `src/pages/Pricing.tsx` | Pricing page with Free vs Pro comparison |
| `src/pages/Shop.tsx` | Gate behind Pro |
| `src/pages/Outfits.tsx` | Add usage counter for free tier |
| `src/pages/Wardrobe.tsx` | Item limit for free tier |
| `src/pages/Profile.tsx` | Pro badge + manage subscription |
| `src/App.tsx` | Add /pricing route |
| `src/components/layout/AppLayout.tsx` | Add upgrade button in nav |

