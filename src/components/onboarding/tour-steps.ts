export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export type TourStep = {
  targetId?: string; // omit for centered (welcome/done) steps
  title: string;
  body: string;
  placement?: TourPlacement;
};

export const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Drip Slayer 👋",
    body: "Let's take a quick tour so you know exactly how to build your dream wardrobe and generate killer outfits.",
    placement: "center",
  },
  {
    targetId: "add-item",
    title: "Add a single item",
    body: "Snap or upload a photo of any clothing piece. Our AI auto-tags color, pattern, and style for you.",
    placement: "bottom",
  },
  {
    targetId: "batch-upload",
    title: "Batch upload",
    body: "Got a closet full of pieces? Upload many photos at once and review them in a grid.",
    placement: "bottom",
  },
  {
    targetId: "category-sidebar",
    title: "Browse by category",
    body: "Jump between Tops, Bottoms, Shoes and more. You can also drag items between categories to reorganize.",
    placement: "right",
  },
  {
    targetId: "filter-bar",
    title: "Filter your wardrobe",
    body: "Narrow down by color tone, style, pattern, or texture to find the perfect piece in seconds.",
    placement: "bottom",
  },
  {
    targetId: "nav-outfits",
    title: "AI Outfits",
    body: "Once you've added a few items, head here to generate complete, professionally-styled outfits.",
    placement: "top",
  },
  {
    targetId: "nav-profile",
    title: "Your style profile",
    body: "Add your sizes, body type, and color preferences for sharper, more personalized suggestions.",
    placement: "top",
  },
  {
    title: "You're all set 🎉",
    body: "Start by adding your first item. You can replay this tour anytime from your Profile page.",
    placement: "center",
  },
];
