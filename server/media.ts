import { nanoid } from "nanoid";
import fs from "node:fs/promises";
import path from "node:path";
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from "../shared/shop";
import { ENV } from "./_core/env";
import { ShopError } from "./db";

export const mediaDir = () => path.resolve(ENV.uploadDir, "media");

/** Checks the first bytes so a file renamed to .jpg cannot slip through as an image. */
function sniff(bytes: Buffer): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

/** Saves an uploaded photo and returns the address it is served from, e.g. /media/Xy12.jpg. */
export async function saveImage(dataBase64: string): Promise<string> {
  const bytes = Buffer.from(dataBase64, "base64");
  if (bytes.length === 0 || bytes.length > IMAGE_MAX_BYTES) throw new ShopError("Photos can be up to 5 MB.");
  const type = sniff(bytes);
  if (!type) throw new ShopError("Photos must be JPG, PNG or WebP.");
  // The stored name is generated here; nothing from the upload reaches the file system path.
  const name = `${nanoid(16)}.${IMAGE_TYPES[type]}`;
  await fs.mkdir(mediaDir(), { recursive: true });
  await fs.writeFile(path.join(mediaDir(), name), bytes);
  return `/media/${name}`;
}
