import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from a .env file (if present) without any
// external dependency. Node's built-in loader is used when available,
// otherwise we fall back to a tiny parser.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");

function fallbackLoad(file) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

try {
  if (typeof process.loadEnvFile === "function" && fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  } else {
    fallbackLoad(envPath);
  }
} catch {
  fallbackLoad(envPath);
}
