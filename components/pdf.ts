"use client";

export type ReadDoc = { text: string; images: string[] };

/** Reads a PDF or image in the browser: text layer + JPEG renders of the first pages for Nemotron VL. */
export async function readDocument(file: File): Promise<ReadDoc> {
  if (file.type.startsWith("image/")) return { text: "", images: [await imageToJpeg(file)] };
  if (file.type === "text/plain" || file.name.endsWith(".txt")) return { text: await file.text(), images: [] };
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  const images: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 8); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join("") + "\n\n";
    if (i <= 2) {
      const viewport = page.getViewport({ scale: 1.3 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
      images.push(canvas.toDataURL("image/jpeg", 0.6));
    }
  }
  return { text: text.trim(), images };
}

async function imageToJpeg(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width * scale;
  canvas.height = bmp.height * scale;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}
