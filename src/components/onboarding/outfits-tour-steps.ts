import type { TourStep } from "./tour-steps";

export const OUTFITS_TOUR_STEPS: TourStep[] = [
  {
    title: "Your Saved Outfits 🎉",
    body: "Quick tour — here's how to use this page to manage and share the looks you've saved.",
    placement: "center",
  },
  {
    targetId: "outfits-mood-filter",
    title: "Filter by mood",
    body: "Browse your saved outfits by vibe: casual, elevated, bold, minimal, or sporty.",
    placement: "bottom",
  },
  {
    targetId: "outfits-export",
    title: "Export as a lookbook",
    body: "Download all the outfits matching your current filter as a beautifully styled PDF.",
    placement: "bottom",
  },
  {
    targetId: "nav-wardrobe",
    title: "Generate more outfits",
    body: "To create new looks, head back to Wardrobe and tap any item — the AI will build a complete outfit around it.",
    placement: "top",
  },
  {
    title: "You're all set 👌",
    body: "That's it! Tap items in your Wardrobe anytime to generate fresh outfits.",
    placement: "center",
  },
];
