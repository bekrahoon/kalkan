import "server-only";
import jpeg from "jpeg-js";
import jsQR from "jsqr";
import { PNG } from "pngjs";

/**
 * Reads a QR code from a photo or screenshot (JPEG/PNG). Official Kyrgyz documents and receipts
 * often carry a QR that leads to a verification page — where it leads is a strong signal.
 */
export function readQr(mime: string, base64: string): string[] {
  try {
    const buf = Buffer.from(base64, "base64");
    let img: { width: number; height: number; data: Uint8Array | Buffer };
    if (mime === "image/jpeg") img = jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 256 });
    else if (mime === "image/png") img = PNG.sync.read(buf);
    else return [];
    if (img.width * img.height > 12_000_000) return [];
    const data = new Uint8ClampedArray(img.data.buffer, img.data.byteOffset, img.data.byteLength);
    const found = jsQR(data, img.width, img.height, { inversionAttempts: "attemptBoth" });
    return found?.data ? [found.data.trim().slice(0, 1000)] : [];
  } catch (e) {
    console.warn("[qr]", (e as Error).message);
    return [];
  }
}
