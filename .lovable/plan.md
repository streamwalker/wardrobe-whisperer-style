

## Export Outfits to Shareable PDF

### What It Does
Adds an "Export PDF" button on the Outfits page that generates a nicely formatted PDF containing the user's saved outfits. The PDF is designed for sharing — each outfit gets a visual card with item thumbnails, outfit name, mood badge, and styling explanation. Perfect for sending to friends to vote on looks.

### Technical Approach

**Library**: Use the browser-native approach with `window.print()` and a dedicated print-optimized hidden container, OR use `jspdf` + `html2canvas` for a proper downloadable PDF. I recommend **`jspdf` + `html2canvas`** since it produces a real `.pdf` file the user can share via any messaging app.

**New packages needed**: `jspdf`, `html2canvas`

### Changes

**1. `src/pages/Outfits.tsx`**
- Add an "Export PDF" button in the header area (next to the title)
- Add state for selecting which outfits to export (default: all filtered outfits, or let user pick specific ones via checkboxes)
- Import and call the PDF generation utility

**2. New file: `src/lib/export-outfits-pdf.ts`**
- Utility function `exportOutfitsPdf(outfits, itemsMap)` that:
  - Creates a hidden DOM container with a styled layout
  - Renders each outfit as a card: name, mood emoji, item thumbnails in a row, and explanation text
  - Adds a title page: "Which look do you like best?" with date
  - Each outfit gets roughly 1/3 of a page (fits ~3 outfits per page)
  - Uses `html2canvas` to capture the container, then `jspdf` to build the PDF
  - Triggers download as `outfits-{date}.pdf`
  - Cleans up the hidden container

**3. PDF Layout Design**
- **Header**: App name + "My Outfit Ideas" + date
- **Per outfit card**: Outfit name (bold), mood badge, horizontal row of item photos/color swatches, explanation text below
- **Footer prompt**: "Which look is your favorite? Let me know! 💬"
- Clean, minimal styling — white background, subtle borders, readable typography

### User Flow
1. User views their saved outfits (optionally filters by mood)
2. Clicks "Export PDF" button
3. A PDF is generated from the currently visible outfits and downloads automatically
4. User shares the PDF with friends

