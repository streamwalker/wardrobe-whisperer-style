
# Personalize Wardrobe Title with User's Name

## Problem
The wardrobe page always shows "My Wardrobe" regardless of who is logged in. The user wants it to display the logged-in user's name, e.g. "Phil's Wardrobe".

## Solution
Fetch the current user's profile from the `profiles` table and use their `display_name` to personalize the heading.

## Changes

### `src/pages/Wardrobe.tsx`

1. Import `useAuth` hook and add a query to fetch the user's profile from the `profiles` table
2. Replace the static `"My Wardrobe"` heading with dynamic text:
   - If a `display_name` exists: show **"Phil's Wardrobe"**
   - Fallback to **"My Wardrobe"** if no name is set or user is not logged in

### Technical details

- Use `useAuth()` to get the current `user.id`
- Query `profiles` table: `supabase.from('profiles').select('display_name').eq('user_id', user.id).single()`
- Use `@tanstack/react-query` (`useQuery`) for the fetch, following existing patterns
- Handle the possessive correctly (e.g. "James's Wardrobe" vs "Phil's Wardrobe")
- Show a skeleton or "My Wardrobe" while loading to avoid layout shift
