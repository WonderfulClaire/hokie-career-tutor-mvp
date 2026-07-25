import express from "express";
import {
  streamAnalysis,
  streamInterview,
  generateReport,
  isDemoMode,
} from "./gemini.js";

// Express app with API routes only. Reused by:
// - server/index.js  (local / traditional Node hosting, adds static serving)
// - api/index.js     (Vercel serverless function entry)
const app = express();
app.use(express.json({ limit: "4mb" }));

// Simple health / status endpoint. The frontend uses `demoMode` to show a banner.
app.get("/api/status", (_req, res) => {
  res.json({ ok: true, demoMode: isDemoMode });
});

// Stream plain-text chunks to the client.
function setupTextStream(res) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
}

app.post("/api/analyze", async (req, res) => {
  const { resumeText, jobDescription } = req.body || {};
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "resumeText and jobDescription are required" });
  }
  try {
    setupTextStream(res);
    for await (const chunk of streamAnalysis(resumeText, jobDescription)) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    console.error("/api/analyze error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Analysis failed." });
    else res.end();
  }
});

app.post("/api/interview", async (req, res) => {
  const { resumeText, jd, type, config, history, message } = req.body || {};
  try {
    setupTextStream(res);
    for await (const chunk of streamInterview({
      resumeText,
      jd,
      type,
      config,
      history,
      message,
    })) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    console.error("/api/interview error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Interview failed." });
    else res.end();
  }
});

app.post("/api/report", async (req, res) => {
  const { history } = req.body || {};
  try {
    const report = await generateReport(history || []);
    res.json({ report });
  } catch (err) {
    console.error("/api/report error:", err);
    res.status(500).json({ error: "Report failed." });
  }
});

export default app;
