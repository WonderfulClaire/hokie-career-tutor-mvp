import { GoogleGenAI } from "@google/genai";

/**
 * Gemini 服务封装。
 * - 当配置了 GEMINI_API_KEY 时，调用真实的 Gemini API。
 * - 当未配置 API key 时，进入「演示模式」，返回结构化的模拟内容，
 *   保证站点在没有密钥的情况下依然可以完整体验流程。
 *
 * 所有接口均支持 lang 参数（"en" | "zh"），控制 AI 回复语言。
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

function langDirective(lang) {
  return lang === "zh"
    ? "\nIMPORTANT: Respond entirely in Simplified Chinese (简体中文)."
    : "";
}

/* ------------------------------------------------------------------ */
/* Prompt builders                                                     */
/* ------------------------------------------------------------------ */

function buildAnalysisPrompt(resumeText, jobDescription, lang) {
  return `
You are a world-class Recruitment Specialist and Career Coach.
Analyze the provided RESUME against the JOB DESCRIPTION (JD).

RESUME:
${resumeText}

JD:
${jobDescription}

OUTPUT FORMAT (strict):
- The VERY FIRST line must be exactly: MATCH_SCORE: <integer 0-100>
  (plain text, no markdown, nothing else on that line — the UI parses it.)
- Then provide the analysis in Markdown with these sections:
1. **Key Strengths** — bullet list.
2. **Missing Skills / Gaps** — bullet list.
3. **Optimization Suggestions** — concrete, actionable rewrite tips.
4. **Interview Questions to Prepare** — 5 tailored questions.
Keep it concise and skimmable.${langDirective(lang)}
`;
}

function buildInterviewSystemInstruction(resumeText, jd, type, config = {}, lang) {
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
5. Stay in character.${langDirective(lang)}
`;

  const oral =
    type === "VIDEO"
      ? "6. IMPORTANT: You are in a VIDEO CALL. Be conversational, use spoken-language patterns, keep responses concise and easy to listen to. Avoid long lists."
      : "";

  return base + oral;
}

function buildReportPrompt(history, lang) {
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
- **Areas for Improvement**: [actionable advice]${langDirective(lang)}
`;
}

/* ------------------------------------------------------------------ */
/* Mock (demo mode) generators                                         */
/* ------------------------------------------------------------------ */

function mockAnalysis(resumeText, jd, lang) {
  const resumeWords = (resumeText || "").split(/\s+/).filter(Boolean).length;
  const jdWords = (jd || "").split(/\s+/).filter(Boolean).length;
  const score = Math.min(95, 55 + (Math.abs(resumeWords - jdWords) % 40));

  if (lang === "zh") {
    return `MATCH_SCORE: ${score}

## 简历 ↔ JD 匹配分析  _(演示模式)_

> ⚠️ 这是**模拟**结果（服务器未配置 AI 密钥）。在服务端配置 \`GEMINI_API_KEY\` 后即可获得真实分析。

**1. 核心优势**
- 过往经历与岗位核心职责有明显重合。
- 项目中体现了主人翁意识和可量化的业务影响。
- 具备 JD 中提到的核心技术栈基础。

**2. 缺失技能 / 差距**
- 简历中未显式覆盖 JD 的部分关键词。
- 缺少大规模 / 生产级项目经验的佐证。
- 软技能信号（领导力、沟通协作）可以更突出。

**3. 优化建议**
- 在个人总结和条目描述中直接复用 JD 的原始措辞。
- 尽可能量化成果（百分比、金额、节省的时间）。
- 增加一个「亮点」小节，突出 3 条与岗位最相关的成绩。

**4. 需要准备的面试问题**
1. 请介绍一个与该岗位最相关的项目。
2. 面对完全陌生的问题，你的解决思路是什么？
3. 讲一次你与同事意见不合的经历，最后如何解决？
4. JD 中哪一项要求最让你兴奋？为什么？
5. 你认为自己与该岗位最大的差距在哪里？`;
  }

  return `MATCH_SCORE: ${score}

## Resume ↔ JD Match Analysis  _(Demo Mode)_

> ⚠️ This is a **simulated** result generated without a live AI key. Configure \`GEMINI_API_KEY\` on the server to enable real analysis.

**1. Key Strengths**
- Clear, relevant experience aligned with the role's primary responsibilities.
- Demonstrated ownership and measurable impact in past projects.
- Good foundation in the core technical stack mentioned in the JD.

**2. Missing Skills / Gaps**
- Some JD keywords are not explicitly reflected in the resume.
- Limited evidence of large-scale / production-level experience.
- Soft-skill signals (leadership, communication) could be stronger.

**3. Optimization Suggestions**
- Mirror the exact terminology from the JD in your summary and bullet points.
- Quantify achievements (%, $, time saved) wherever possible.
- Add a short "Highlights" section surfacing your 3 most relevant wins.

**4. Interview Questions to Prepare**
1. Walk me through a project most relevant to this role.
2. How do you approach a problem you've never seen before?
3. Describe a time you disagreed with a teammate — what happened?
4. Which requirement in this JD excites you most, and why?
5. Where do you see the biggest gap in your profile for this role?`;
}

function mockInterviewReply(priorAnswers, config = {}, lang) {
  const turns = priorAnswers;

  if (lang === "zh") {
    const questions = [
      "我们开始吧。请介绍一个你简历中与该岗位最匹配的项目。",
      "好的。能深入讲讲你在其中做的技术决策以及背后的原因吗？",
      "明白。讲一次你的方案失败或效果不佳的经历——你是如何应对的？",
      "谢谢。如果 JD 中某项要求你经验有限，你会怎么处理？",
      "了解。最后一个问题：与同样优秀的候选人相比，我们为什么要选择你？",
    ];
    const critique =
      turns === 0
        ? ""
        : "回答得还不错——下次可以补充更具体的数据指标。";
    const q = questions[Math.min(turns, questions.length - 1)];
    return `${critique}${q}\n\n_(演示模式——配置 GEMINI_API_KEY 后可体验真实 AI 面试官。)_`;
  }

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

function mockReport(history, lang) {
  const answers = history.filter((m) => m.role === "user").length;
  const rating = Math.max(5, Math.min(9, 4 + answers));

  if (lang === "zh") {
    return `# 面试表现反馈报告  _(演示模式)_

> ⚠️ 模拟报告。在服务端配置 \`GEMINI_API_KEY\` 后可获得真实的 AI 评估。

- **综合评分**: ${rating}/10
- **表达清晰度**: 回答基本清楚，建议采用更紧凑的结构（情境 → 行动 → 结果）。
- **技术能力**: 基础掌握尚可，建议用具体、可量化的例子加深说服力。
- **展现出的优势**: 参与度高、愿意复盘、背景与岗位相关。
- **待改进方向**: 补充可量化的成果，准备 2–3 个代表性故事，并练习简洁表达。`;
  }

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

export async function* streamAnalysis(resumeText, jobDescription, lang) {
  const client = getClient();
  if (!client) {
    yield* chunkString(mockAnalysis(resumeText, jobDescription, lang));
    return;
  }
  const responseStream = await client.models.generateContentStream({
    model: MODEL_NAME,
    contents: buildAnalysisPrompt(resumeText, jobDescription, lang),
  });
  for await (const chunk of responseStream) {
    if (chunk.text) yield chunk.text;
  }
}

export async function* streamInterview({ resumeText, jd, type, config, history, message, lang }) {
  const client = getClient();
  if (!client) {
    const priorAnswers = (history || []).filter((m) => m.role === "user").length;
    yield* chunkString(mockInterviewReply(priorAnswers, config, lang));
    return;
  }
  const responseStream = await client.models.generateContentStream({
    model: MODEL_NAME,
    contents: historyToContents(history, message),
    config: {
      systemInstruction: buildInterviewSystemInstruction(resumeText, jd, type, config, lang),
    },
  });
  for await (const chunk of responseStream) {
    if (chunk.text) yield chunk.text;
  }
}

export async function generateReport(history, lang) {
  const client = getClient();
  if (!client) {
    return mockReport(history, lang);
  }
  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: buildReportPrompt(history, lang),
  });
  return response.text;
}
