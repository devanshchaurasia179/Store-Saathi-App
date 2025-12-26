// utils/generateBarcode.ts

/**
 * Generates a unique numeric barcode string
 * - 14 digits (EAN-like)
 * - Safe for printing & scanning
 * - No special characters
 */
export function generateBarcode(): string {
  const timestamp = Date.now().toString(); // milliseconds
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  // Take last 13 digits → keeps barcode short & unique
  const barcode = (timestamp + random).slice(-14);

  return barcode;
}
