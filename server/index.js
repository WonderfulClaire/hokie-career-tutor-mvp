import "./env.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import app from "./app.js";
import { isDemoMode } from "./gemini.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// In production, serve the built static frontend from /dist.
const distDir = path.join(rootDir, "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] demo mode: ${isDemoMode ? "ON (no GEMINI_API_KEY)" : "OFF"}`);
});
