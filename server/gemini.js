import { GoogleGenAI } from "@google/genai";

/**
 * Gemini 服务封装。
 * - 当配置了 GEMINI_API_KEY 时，调用真实的 Gemini API。
 * - 当未配置 API key 时，进入「演示模式」，返回结构化的模拟内容，
 *   保证站点在没有密钥的情况下依然可以完整体验流程。
 */

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const isDemoMode = !API_KEY;

let aiClient = null;
function getClient() {
  if (!API_KEY) return null;
  if (!aiClient) aiClient = new GoogleGenAI({ apiKey: API_KEY });
  return aiClient;
}

/* ------------------------------------------------------------------ */
/* Prompt builders                                                     */
/* ------------------------------------------------------------------ */

function buildAnalysisPrompt(resumeText, jobDescription) {
  return `
You are a world-class Recruitment Specialist and Career Coach.
Analyze the provided RESUME against the JOB DESCRIPTION (JD).

RESUME:
${resumeText}

JD:
${jobDescription}

Provide the analysis in Markdown with these sections:
1. **Match Score (%)** — a single overall percentage with one sentence of justification.
2. **Key Strengths** — bullet list.
3. **Missing Skills / Gaps** — bullet list.
4. **Optimization Suggestions** — concrete, actionable rewrite tips.
5. **Interview Questions to Prepare** — 5 tailored questions.
Keep it concise and skimmable.
`;
}

function buildInterviewSystemInstruction(resumeText, jd, type, config = {}) {
  const role = config.roleFocus || "the target role described in the JD";
  const difficulty = config.difficulty || "Medium";
  const style = config.style || "Professional";

  const base = `
You are a strict and professional Interviewer.
TARGET JD: ${jd}
CANDIDATE RESUME: ${resumeText}

INTERVIEW SETTINGS:
- Focus area: ${role}
- Difficulty: ${difficulty}
- Interviewer style: ${style}

RULES:
1. Act as a specific hiring manager or technical lead matching the interviewer style above.
2. Ask ONE challenging question at a time, calibrated to the chosen difficulty.
3. After the candidate answers, give a brief (1 sentence) professional critique, then ask the NEXT question.
4. Focus on gaps identified in the resume relative to the JD and the chosen focus area.
5. Stay in character.
`;

  const oral =
    type === "VIDEO"
      ? "6. IMPORTANT: You are in a VIDEO CALL. Be conversational, use spoken-language patterns, keep responses concise and easy to listen to. Avoid long lists."
      : "";

  return base + oral;
}

function buildReportPrompt(history) {
  return `
Based on the following mock interview transcript, provide a final "Interview Performance Feedback Report".

TRANSCRIPT:
${JSON.stringify(history)}

Structure your report exactly as follows (Markdown):
# Interview Performance Feedback
- **Overall Rating**: [x/10]
- **Communication Clarity**: [feedback]
- **Technical Competence**: [feedback]
- **Key Strengths Demonstrated**: [list]
- **Areas for Improvement**: [actionable advice]
`;
}

/* ------------------------------------------------------------------ */
/* Mock (demo mode) generators                                         */
/* ------------------------------------------------------------------ */

function mockAnalysis(resumeText, jd) {
  const resumeWords = (resumeText || "").split(/\s+/).filter(Boolean).length;
  const jdWords = (jd || "").split(/\s+/).filter(Boolean).length;
  const score = Math.min(95, 55 + (Math.abs(resumeWords - jdWords) % 40));
  return `## Resume ↔ JD Match Analysis  _(Demo Mode)_

> ⚠️ This is a **simulated** result generated without a live AI key. Configure \`GEMINI_API_KEY\` on the server to enable real analysis.

**1. Match Score:** ${score}%
A solid baseline match — your background overlaps with several core requirements, with a few gaps to close.

**2. Key Strengths**
- Clear, relevant experience aligned with the role's primary responsibilities.
- Demonstrated ownership and measurable impact in past projects.
- Good foundation in the core technical stack mentioned in the JD.

**3. Missing Skills / Gaps**
- Some JD keywords are not explicitly reflected in the resume.
- Limited evidence of large-scale / production-level experience.
- Soft-skill signals (leadership, communication) could be stronger.

**4. Optimization Suggestions**
- Mirror the exact terminology from the JD in your summary and bullet points.
- Quantify achievements (%, $, time saved) wherever possible.
- Add a short "Highlights" section surfacing your 3 most relevant wins.

**5. Interview Questions to Prepare**
1. Walk me through a project most relevant to this role.
2. How do you approach a problem you've never seen before?
3. Describe a time you disagreed with a teammate — what happened?
4. Which requirement in this JD excites you most, and why?
5. Where do you see the biggest gap in your profile for this role?`;
}

function mockInterviewReply(priorAnswers, config = {}) {
  const turns = priorAnswers;
  const questions = [
    "Let's begin. Tell me about a project from your resume that best matches this role.",
    "Good. Can you dive deeper into the technical decisions you made there and why?",
    "Understood. Describe a time your solution failed or underperformed — how did you respond?",
    "Thanks. How would you handle a requirement in this JD that you have limited experience with?",
    "Noted. Finally, why should we choose you over an equally qualified candidate?",
  ];
  const critique =
    turns === 0
      ? ""
      : "That's a reasonable answer — try to be more specific with concrete metrics next time. ";
  const q = questions[Math.min(turns, questions.length - 1)];
  return `${critique}${q}\n\n_(Demo Mode — configure GEMINI_API_KEY for a real AI interviewer.)_`;
}

function mockReport(history) {
  const answers = history.filter((m) => m.role === "user").length;
  const rating = Math.max(5, Math.min(9, 4 + answers));
  return `# Interview Performance Feedback  _(Demo Mode)_

> ⚠️ Simulated report. Configure \`GEMINI_API_KEY\` on the server for real AI evaluation.

- **Overall Rating**: ${rating}/10
- **Communication Clarity**: Answers were understandable; aim for tighter structure (situation → action → result).
- **Technical Competence**: Reasonable grasp of fundamentals; deepen with concrete, quantified examples.
- **Key Strengths Demonstrated**: Engagement, willingness to reflect, relevant background.
- **Areas for Improvement**: Add measurable outcomes, prepare 2–3 signature stories, and rehearse concise delivery.`;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Convert our ChatMessage[] into the genai `contents` array format.
function historyToContents(history = [], appendUserMessage) {
  const contents = history.map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: m.parts?.[0]?.text ?? "" }],
  }));
  if (appendUserMessage) {
    contents.push({ role: "user", parts: [{ text: appendUserMessage }] });
  }
  return contents;
}

async function* chunkString(str, size = 24, delayMs = 20) {
  for (let i = 0; i < str.length; i += size) {
    yield str.slice(i, i + size);
    // small delay so the frontend shows a streaming effect in demo mode
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

/* ------------------------------------------------------------------ */
/* Public streaming APIs — each yields text chunks                     */
/* ------------------------------------------------------------------ */

export async function* streamAnalysis(resumeText, jobDescription) {
  const client = getClient();
  if (!client) {
    yield* chunkString(mockAnalysis(resumeText, jobDescription));
    return;
  }
  const responseStream = await client.models.generateContentStream({
    model: MODEL_NAME,
    contents: buildAnalysisPrompt(resumeText, jobDescription),
  });
  for await (const chunk of responseStream) {
    if (chunk.text) yield chunk.text;
  }
}

export async function* streamInterview({ resumeText, jd, type, config, history, message }) {
  const client = getClient();
  if (!client) {
    const priorAnswers = (history || []).filter((m) => m.role === "user").length;
    yield* chunkString(mockInterviewReply(priorAnswers, config));
    return;
  }
  const responseStream = await client.models.generateContentStream({
    model: MODEL_NAME,
    contents: historyToContents(history, message),
    config: {
      systemInstruction: buildInterviewSystemInstruction(resumeText, jd, type, config),
    },
  });
  for await (const chunk of responseStream) {
    if (chunk.text) yield chunk.text;
  }
}

export async function generateReport(history) {
  const client = getClient();
  if (!client) {
    return mockReport(history);
  }
  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: buildReportPrompt(history),
  });
  return response.text;
}
