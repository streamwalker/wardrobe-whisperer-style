

## Fix: Distorted Photos in PDF Export

### Problem
`html2canvas` has poor support for `object-fit: cover`. The images are being stretched to fill the 90x90 container instead of being cropped, causing visible distortion in the PDF output.

### Solution
Replace the `object-fit: cover` approach with a background-image technique that `html2canvas` handles correctly. Instead of an `<img>` tag, use a `<div>` with `background-image`, `background-size: cover`, and `background-position: center`. This achieves the same visual cropping but renders correctly in `html2canvas`.

### Changes

**`src/lib/export-outfits-pdf.ts`** — Update the item thumbnail rendering:

Replace:
```html
<div style="width:90px;height:90px;background:...;overflow:hidden;">
  <img src="..." style="width:100%;height:100%;object-fit:cover;" />
</div>
```

With:
```html
<div style="width:90px;height:90px;background-image:url(...);background-size:cover;background-position:center;background-color:#f4f4f5;"></div>
```

Also increase thumbnail size from 90px to 110px for better visual quality in the PDF, and add `allowTaint: true` alongside `useCORS: true` for broader image compatibility.

