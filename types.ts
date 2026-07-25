
export interface AnalysisResult {
  content: string;
  isStreaming: boolean;
  error?: string;
}

export interface ResumeData {
  text: string;
  fileName: string;
}

export type AppMode = 'ANALYZE' | 'INTERVIEW' | 'REPORT';
export type InterviewType = 'TEXT' | 'VIDEO';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type InterviewerStyle = 'Friendly' | 'Professional' | 'Tough';

export interface InterviewConfig {
  roleFocus: string;
  difficulty: Difficulty;
  style: InterviewerStyle;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}
