import { Lang } from './types';

/**
 * Lightweight i18n: a flat dictionary per language plus a tiny helper.
 * Keep keys short and grouped by prefix (nav / analyze / modal / chat / report / toast).
 */

const en = {
  // Navbar
  'nav.title': 'Career Pro AI',
  'nav.demo': 'DEMO MODE',
  'nav.demoTip': 'No GEMINI_API_KEY configured on the server. Responses are simulated.',

  // Analyze view
  'analyze.step1': 'Step 1: Resume',
  'analyze.uploadTab': 'Upload PDF',
  'analyze.pasteTab': 'Paste Text',
  'analyze.uploadHint': 'Upload PDF Resume',
  'analyze.pastePlaceholder': 'Paste your resume text here...',
  'analyze.pastedName': 'Pasted resume',
  'analyze.step2': 'Step 2: Job Context',
  'analyze.jdPlaceholder': 'Paste the target Job Description...',
  'analyze.analyzeBtn': 'Start Matching Analysis',
  'analyze.analyzing': 'Analyzing Context...',
  'analyze.stop': 'Stop Generating',
  'analyze.sample': '⚡ Try with sample data',
  'analyze.emptyTitle': 'Analysis Engine Ready',
  'analyze.emptyDesc': 'Upload your profile and JD to generate optimization insights and prep for interviews.',
  'analyze.tabInput': 'Input',
  'analyze.tabResult': 'Result',
  'analyze.score': 'Match Score',

  // Interview CTA
  'cta.title': 'Ready for a Live Simulation?',
  'cta.desc': 'Our AI Interviewer can conduct a full session via chat or video to prepare you for the real deal.',
  'cta.btn': 'Enter Mock Interview Chamber',

  // Interview modal
  'modal.title': 'Choose Your Interview Format',
  'modal.subtitle': 'Customize the session, then pick a format.',
  'modal.focus': 'Focus Area (optional)',
  'modal.focusPlaceholder': 'e.g. System design, React, Behavioral...',
  'modal.difficulty': 'Difficulty',
  'modal.easy': 'Easy',
  'modal.medium': 'Medium',
  'modal.hard': 'Hard',
  'modal.style': 'Interviewer Style',
  'modal.friendly': 'Friendly',
  'modal.professional': 'Professional',
  'modal.tough': 'Tough',
  'modal.text': 'Text Mode',
  'modal.textDesc': 'Chat-based technical evaluation. Quiet and thoughtful environment.',
  'modal.video': 'Video Mode',
  'modal.videoDesc': 'Face-to-face simulation. Includes voice interaction and AI speech synthesis.',
  'modal.cancel': 'Cancel',

  // Interview view
  'chat.end': 'End Session & Generate Report',
  'chat.thinking': 'AI Interviewer is thinking...',
  'chat.listening': 'Listening...',
  'chat.placeholder': 'Type or speak your answer...',
  'chat.videoActive': 'Video Mode Active • Voice Synthesis ON',
  'chat.live': 'Interviewing Live',
  'chat.answered': 'answered',
  'chat.noSpeech': 'Speech recognition not supported in this browser.',

  // Report view
  'report.download': '↓ Download Report (.md)',
  'report.copy': 'Copy Full Text',
  'report.copied': 'Copied to clipboard',
  'report.restart': '← Start Over / New Analysis',

  // Toasts
  'toast.pdfFail': 'Failed to extract text from the PDF.',
  'toast.analyzeFail': 'Analysis failed. Please try again.',
  'toast.startFail': 'Failed to start the interview session.',
  'toast.connFail': 'Connection error. Please try again.',
  'toast.reportFail': 'Failed to generate the report.',
  'toast.sampleLoaded': 'Sample resume & JD loaded — hit Analyze!',
  'toast.stopped': 'Generation stopped.',
  'toast.restored': 'Previous session restored.',
};

const zh: Record<keyof typeof en, string> = {
  'nav.title': 'Career Pro AI',
  'nav.demo': '演示模式',
  'nav.demoTip': '服务器未配置 GEMINI_API_KEY，当前返回的是模拟内容。',

  'analyze.step1': '第一步：简历',
  'analyze.uploadTab': '上传 PDF',
  'analyze.pasteTab': '粘贴文本',
  'analyze.uploadHint': '上传 PDF 简历',
  'analyze.pastePlaceholder': '在此粘贴你的简历文本…',
  'analyze.pastedName': '粘贴的简历',
  'analyze.step2': '第二步：目标岗位',
  'analyze.jdPlaceholder': '粘贴目标岗位描述（JD）…',
  'analyze.analyzeBtn': '开始匹配分析',
  'analyze.analyzing': '正在分析…',
  'analyze.stop': '停止生成',
  'analyze.sample': '⚡ 用示例数据快速体验',
  'analyze.emptyTitle': '分析引擎就绪',
  'analyze.emptyDesc': '上传简历并粘贴 JD，即可生成优化建议并进入模拟面试。',
  'analyze.tabInput': '输入',
  'analyze.tabResult': '结果',
  'analyze.score': '匹配度',

  'cta.title': '准备好实战模拟了吗？',
  'cta.desc': 'AI 面试官可以通过文字或视频进行完整的模拟面试，帮你为真实面试做好准备。',
  'cta.btn': '进入模拟面试室',

  'modal.title': '选择面试形式',
  'modal.subtitle': '先自定义面试设置，再选择形式。',
  'modal.focus': '重点方向（可选）',
  'modal.focusPlaceholder': '例如：系统设计、React、行为面试…',
  'modal.difficulty': '难度',
  'modal.easy': '简单',
  'modal.medium': '中等',
  'modal.hard': '困难',
  'modal.style': '面试官风格',
  'modal.friendly': '亲和',
  'modal.professional': '专业',
  'modal.tough': '严苛',
  'modal.text': '文字模式',
  'modal.textDesc': '基于聊天的技术评估，安静且便于思考。',
  'modal.video': '视频模式',
  'modal.videoDesc': '面对面模拟，包含语音输入与 AI 语音合成。',
  'modal.cancel': '取消',

  'chat.end': '结束面试并生成报告',
  'chat.thinking': 'AI 面试官思考中…',
  'chat.listening': '正在听…',
  'chat.placeholder': '输入或语音说出你的回答…',
  'chat.videoActive': '视频模式已开启 • 语音合成开启',
  'chat.live': '面试进行中',
  'chat.answered': '已回答',
  'chat.noSpeech': '当前浏览器不支持语音识别。',

  'report.download': '↓ 下载报告 (.md)',
  'report.copy': '复制全文',
  'report.copied': '已复制到剪贴板',
  'report.restart': '← 重新开始 / 新的分析',

  'toast.pdfFail': 'PDF 文本提取失败。',
  'toast.analyzeFail': '分析失败，请重试。',
  'toast.startFail': '面试启动失败。',
  'toast.connFail': '连接出错，请重试。',
  'toast.reportFail': '报告生成失败。',
  'toast.sampleLoaded': '示例简历和 JD 已填入，点击「开始匹配分析」！',
  'toast.stopped': '已停止生成。',
  'toast.restored': '已恢复上次的会话内容。',
};

const dictionaries: Record<Lang, typeof en> = { en, zh };

export type TranslationKey = keyof typeof en;

export function makeT(lang: Lang) {
  const dict = dictionaries[lang] || en;
  return (key: TranslationKey): string => dict[key] ?? en[key] ?? key;
}

export function detectLang(): Lang {
  const saved = localStorage.getItem('cp_lang');
  if (saved === 'zh' || saved === 'en') return saved;
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
