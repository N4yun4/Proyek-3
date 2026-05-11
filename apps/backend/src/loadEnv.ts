import { join } from "path";

// Baca .env secara manual agar env vars pasti tersedia sebelum Firebase init
const envPath = join(import.meta.dir, "../../..", ".env");
try {
  const text = await Bun.file(envPath).text();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
  console.log("✓ .env loaded from", envPath);
} catch {
  console.warn("⚠ .env not found at", envPath, "— using system env");
}
