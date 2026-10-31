import type { DraftPhoto } from "./draft-model";

/** Decode and re-encode locally: no upload, original metadata or filename retained. */
export async function preparePhoto(file: File): Promise<DraftPhoto> {
  if (file.size > 5 * 1024 * 1024 || file.size === 0) throw new Error("Choose a photo smaller than 5 MB.");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!jpeg && !png && !webp) throw new Error("Choose a real JPG, PNG or WebP photo. SVG, GIF and documents are not supported.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 30_000_000) throw new Error("Choose a photo under 30 megapixels.");
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d"); if (!context) throw new Error("Photo processing is unavailable in this browser.");
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("This photo could not be processed.")), "image/jpeg", 0.8));
    if (blob.size > 1024 * 1024) throw new Error("This photo is too detailed to store locally. Please choose a smaller image.");
    return { id: crypto.randomUUID(), blob, alt: "" };
  } catch (error) { throw new Error(error instanceof Error && !/decode/i.test(error.message) ? error.message : "This photo could not be read. Try another JPG, PNG or WebP image."); }
  finally { URL.revokeObjectURL(url); }
}
