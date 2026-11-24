import { exportFile } from "./export-file";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";

interface PdfOutfit {
  name: string;
  mood: string | null;
  explanation: string | null;
  items: { name: string; photo?: string; color_hex: string }[];
}

const moodEmoji: Record<string, string> = {
  casual: "☕",
  elevated: "✨",
  bold: "🔥",
  minimal: "◻️",
  sporty: "⚡",
};

export async function exportOutfitsPdf(outfits: PdfOutfit[]) {
  if (outfits.length === 0) return;

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:800px;background:#fff;font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;padding:0;";

  // --- Title page ---
  const header = document.createElement("div");
  header.style.cssText = "padding:48px 40px 24px;text-align:center;";
  header.innerHTML = `
    <h1 style="font-size:28px;font-weight:700;margin:0 0 6px;">Which look do you like best?</h1>
    <p style="font-size:13px;color:#888;margin:0;">My Outfit Ideas · ${format(new Date(), "MMMM d, yyyy")}</p>
  `;
  container.appendChild(header);

  // --- Outfit cards ---
  outfits.forEach((outfit, idx) => {
    const card = document.createElement("div");
    card.style.cssText =
      "margin:16px 40px;border:1px solid #e5e5e5;border-radius:12px;padding:20px 24px;page-break-inside:avoid;";

    const title = document.createElement("div");
    title.style.cssText = "display:flex;align-items:center;margin-bottom:12px;font-size:14px;font-weight:600;";
    title.textContent = `Look ${idx + 1}: ${outfit.name}`;
    if (outfit.mood) {
      const mood = document.createElement("span");
      mood.style.cssText = "background:#f4f4f5;border-radius:9999px;padding:2px 10px;font-size:12px;font-weight:500;margin-left:8px;";
      mood.textContent = `${moodEmoji[outfit.mood] || "👔"} ${outfit.mood}`;
      title.appendChild(mood);
    }
    card.appendChild(title);
    const items = document.createElement("div");
    items.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;padding-bottom:4px;";
    for (const item of outfit.items) {
      const tile = document.createElement("div");
      tile.style.cssText = "flex-shrink:0;width:110px;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;";
      const photo = document.createElement("div");
      photo.style.cssText = "width:110px;height:110px;background-size:cover;background-position:center;";
      photo.style.backgroundColor = item.color_hex || "#f4f4f5";
      if (item.photo) {
        try {
          const url = new URL(item.photo, window.location.origin);
          if (url.protocol === "https:" || (url.protocol === "http:" && url.origin === window.location.origin)) {
            photo.style.backgroundImage = `url(${JSON.stringify(url.href)})`;
          }
        } catch { /* Invalid images leave the item's color swatch visible. */ }
      }
      const label = document.createElement("p");
      label.style.cssText = "margin:0;padding:4px 6px;font-size:10px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
      label.textContent = item.name;
      tile.append(photo, label);
      items.appendChild(tile);
    }
    card.appendChild(items);
    if (outfit.explanation) {
      const explanation = document.createElement("p");
      explanation.style.cssText = "margin:12px 0 0;font-size:12px;line-height:1.5;color:#555;";
      explanation.textContent = outfit.explanation;
      card.appendChild(explanation);
    }
    container.appendChild(card);
  });

  // --- Footer ---
  const footer = document.createElement("div");
  footer.style.cssText = "padding:24px 40px 48px;text-align:center;";
  footer.innerHTML = `<p style="font-size:14px;color:#888;">Which look is your favorite? Let me know! 💬</p>`;
  container.appendChild(footer);

  document.body.appendChild(container);

  // Wait for images to load
  const images = container.querySelectorAll("img");
  await Promise.allSettled(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
    });

    const imgWidth = 210; // A4 mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageHeight = pdf.internal.pageSize.getHeight();

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    await exportFile(pdf.output("blob"), `outfits-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
