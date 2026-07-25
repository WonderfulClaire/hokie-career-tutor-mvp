import { ChatMessage, InterviewType, InterviewConfig } from "../types";

/**
 * Frontend service layer.
 * All AI calls now go through our backend (/api/*), which keeps the
 * Gemini API key on the server. This module never touches the API key.
 */

// Read a plain-text streaming response chunk by chunk.
async function streamText(
  url: string,
  body: unknown,
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onChunk(chunk);
    }
  }
  return full;
}

export const analyzeResume = async (
  resumeText: string,
  jobDescription: string,
  onChunk: (text: string) => void
): Promise<void> => {
  await streamText("/api/analyze", { resumeText, jobDescription }, onChunk);
};

/**
 * Send one interview turn. The interview is stateless on the backend:
 * we pass the full history plus the new message each time.
 * Returns the AI reply as a full string (also streamed via onChunk).
 */
export const sendInterviewMessage = async (
  params: {
    resumeText: string;
    jd: string;
    type: InterviewType;
    config: InterviewConfig;
    history: ChatMessage[];
    message: string;
  },
  onChunk: (text: string) => void
): Promise<string> => {
  return streamText("/api/interview", params, onChunk);
};

export const generateInterviewReport = async (
  history: ChatMessage[]
): Promise<string> => {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history }),
  });
  if (!res.ok) throw new Error("Report failed.");
  const data = await res.json();
  return data.report as string;
};

export const fetchStatus = async (): Promise<{ demoMode: boolean }> => {
  try {
    const res = await fetch("/api/status");
    if (!res.ok) return { demoMode: false };
    return await res.json();
  } catch {
    return { demoMode: false };
  }
};
