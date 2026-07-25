
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { extractTextFromPdf } from './services/pdfService';
import { analyzeResume, sendInterviewMessage, generateInterviewReport, fetchStatus } from './services/geminiService';
import { ResumeData, AnalysisResult, AppMode, ChatMessage, InterviewType, InterviewConfig, Difficulty, InterviewerStyle, Lang } from './types';
import { makeT, detectLang, TranslationKey } from './i18n';
import { getSampleData } from './sampleData';
import Toasts, { ToastItem } from './components/Toast';
import ScoreCard from './components/ScoreCard';

const IconUpload = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
const IconSparkles = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconMic = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>;
const IconVideo = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
const IconText = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconStop = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>;

// Persisted session shape (localStorage).
const LS_KEY = 'cp_session_v1';
interface SavedSession {
  resume: ResumeData | null;
  jd: string;
  analysisContent: string;
}
function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch {
    return null;
  }
}

// Extract "MATCH_SCORE: NN" (first line emitted by the backend) from the raw analysis text.
function parseScore(content: string): { score: number | null; body: string } {
  const m = content.match(/^\s*MATCH_SCORE:\s*(\d{1,3})\s*$/m);
  if (!m) return { score: null, body: content };
  return {
    score: Math.min(100, parseInt(m[1], 10)),
    body: content.replace(m[0], '').replace(/^\s+/, ''),
  };
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const App: React.FC = () => {
  const saved = useRef<SavedSession | null>(loadSession());

  const [lang, setLang] = useState<Lang>(() => detectLang());
  const t = useMemo(() => makeT(lang), [lang]);

  const [mode, setMode] = useState<AppMode>('ANALYZE');
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const [resume, setResume] = useState<ResumeData | null>(saved.current?.resume ?? null);
  const [jd, setJd] = useState<string>(saved.current?.jd ?? '');
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    content: saved.current?.analysisContent ?? '',
    isStreaming: false,
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [resumeInputMode, setResumeInputMode] = useState<'upload' | 'paste'>('upload');
  const [mobileTab, setMobileTab] = useState<'input' | 'result'>('input');

  // Interview configuration
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig>({
    roleFocus: '',
    difficulty: 'Medium',
    style: 'Professional',
  });

  // Interview state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interviewStart, setInterviewStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);
  const pushToast = (type: ToastItem['type'], key: TranslationKey) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, type, text: t(key) }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3200);
  };

  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  // Persist language choice
  useEffect(() => {
    localStorage.setItem('cp_lang', lang);
  }, [lang]);

  // Persist session (resume / jd / last analysis) so refreshes don't lose work
  useEffect(() => {
    if (analysis.isStreaming) return;
    try {
      const data: SavedSession = { resume, jd, analysisContent: analysis.content };
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch { /* quota errors are non-fatal */ }
  }, [resume, jd, analysis.content, analysis.isStreaming]);

  // Load backend status (demo mode banner)
  useEffect(() => {
    fetchStatus().then(s => setDemoMode(!!s.demoMode)).catch(() => {});
  }, []);

  // Interview timer
  useEffect(() => {
    if (interviewStart === null) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - interviewStart) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [interviewStart]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInputValue(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [lang]);

  // Handle Camera for Video Mode
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (mode === 'INTERVIEW' && interviewType === 'VIDEO' && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => console.error("Camera access failed", err));
    }
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [mode, interviewType]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // TTS Logic
  const speak = (text: string) => {
    if (interviewType === 'VIDEO') {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsExtracting(true);
      try {
        const text = await extractTextFromPdf(file);
        setResume({ text, fileName: file.name });
      } catch (err) { pushToast('error', 'toast.pdfFail'); }
      finally { setIsExtracting(false); }
    }
  };

  const handlePasteResume = (value: string) => {
    setResume(value.trim() ? { text: value, fileName: t('analyze.pastedName') } : null);
  };

  const loadSample = () => {
    const sample = getSampleData(lang);
    setResume({ text: sample.resumeText, fileName: sample.fileName });
    setJd(sample.jd);
    setResumeInputMode('paste');
    pushToast('success', 'toast.sampleLoaded');
  };

  const stopGenerating = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const handleAnalyze = async () => {
    if (!resume || !jd.trim()) return;
    setMode('ANALYZE');
    setMobileTab('result');
    setAnalysis({ content: '', isStreaming: true });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await analyzeResume(resume.text, jd, lang, (chunk) => {
        setAnalysis(prev => ({ ...prev, content: prev.content + chunk }));
      }, controller.signal);
    } catch (err: any) {
      if (err?.name === 'AbortError') pushToast('info', 'toast.stopped');
      else pushToast('error', 'toast.analyzeFail');
    } finally {
      abortRef.current = null;
      setAnalysis(prev => ({ ...prev, isStreaming: false }));
    }
  };

  const initInterview = async (type: InterviewType) => {
    if (!resume || !jd) return;
    setInterviewType(type);
    setShowModeSelection(false);
    setMode('INTERVIEW');
    setMessages([]);
    setIsChatLoading(true);
    setInterviewStart(Date.now());
    setElapsed(0);

    try {
      let fullText = '';
      setMessages([{ role: 'model', parts: [{ text: '' }] }]);
      await sendInterviewMessage(
        {
          resumeText: resume.text,
          jd,
          type,
          config: interviewConfig,
          history: [],
          message: 'Hello. I am ready for the interview. Please start.',
          lang,
        },
        (chunk) => {
          fullText += chunk;
          setMessages([{ role: 'model', parts: [{ text: fullText }] }]);
        }
      );
      speak(fullText);
    } catch (e) {
      pushToast('error', 'toast.startFail');
      setMode('ANALYZE');
      setInterviewType(null);
      setInterviewStart(null);
    } finally {
      setIsChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isChatLoading || !resume) return;
    if (isListening) stopListening();

    const currentInput = inputValue;
    const userMsg: ChatMessage = { role: 'user', parts: [{ text: currentInput }] };
    const historyBeforeSend = messages;
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsChatLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);
      await sendInterviewMessage(
        {
          resumeText: resume.text,
          jd,
          type: interviewType || 'TEXT',
          config: interviewConfig,
          history: historyBeforeSend,
          message: currentInput,
          lang,
        },
        (chunk) => {
          fullText += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', parts: [{ text: fullText }] };
            return updated;
          });
        },
        controller.signal
      );
      speak(fullText);
    } catch (e: any) {
      if (e?.name === 'AbortError') pushToast('info', 'toast.stopped');
      else pushToast('error', 'toast.connFail');
    } finally {
      abortRef.current = null;
      setIsChatLoading(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      pushToast('error', 'chat.noSpeech');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([analysis.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(analysis.content);
      pushToast('success', 'report.copied');
    } catch {
      pushToast('error', 'toast.connFail');
    }
  };

  const endInterview = async () => {
    window.speechSynthesis.cancel();
    setInterviewStart(null);
    if (messages.length < 2) {
      setMode('ANALYZE');
      setInterviewType(null);
      return;
    }
    setIsChatLoading(true);
    try {
      const report = await generateInterviewReport(messages, lang);
      setAnalysis({ content: report, isStreaming: false });
      setMode('REPORT');
      setMobileTab('result');
    } catch (e) {
      pushToast('error', 'toast.reportFail');
    } finally {
      setIsChatLoading(false);
      setInterviewType(null);
    }
  };

  const answeredCount = messages.filter(m => m.role === 'user').length;
  const { score, body: analysisBody } = useMemo(
    () => parseScore(analysis.content),
    [analysis.content]
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden text-gray-800">
      {/* Navbar */}
      <nav className="bg-white border-b px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setMode('ANALYZE'); setInterviewType(null); }}>
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><IconSparkles /></div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight">{t('nav.title')}</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {demoMode && (
            <div className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200" title={t('nav.demoTip')}>
              {t('nav.demo')}
            </div>
          )}
          <div className="hidden sm:block text-xs font-mono bg-gray-100 px-3 py-1 rounded-full text-gray-500">
            {mode} {interviewType ? `(${interviewType})` : ''}
          </div>
          <button
            onClick={() => setLang(l => (l === 'zh' ? 'en' : 'zh'))}
            className="text-xs font-bold border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 px-3 py-1.5 rounded-full transition-colors"
            title="Switch language / 切换语言"
          >
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
      </nav>

      {/* Mode Selection Modal */}
      {showModeSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold text-center mb-2">{t('modal.title')}</h2>
            <p className="text-center text-sm text-gray-400 mb-6">{t('modal.subtitle')}</p>

            {/* Interview configuration */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('modal.focus')}</label>
                <input
                  value={interviewConfig.roleFocus}
                  onChange={(e) => setInterviewConfig(c => ({ ...c, roleFocus: e.target.value }))}
                  placeholder={t('modal.focusPlaceholder')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('modal.difficulty')}</label>
                <select
                  value={interviewConfig.difficulty}
                  onChange={(e) => setInterviewConfig(c => ({ ...c, difficulty: e.target.value as Difficulty }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Easy">{t('modal.easy')}</option>
                  <option value="Medium">{t('modal.medium')}</option>
                  <option value="Hard">{t('modal.hard')}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('modal.style')}</label>
                <select
                  value={interviewConfig.style}
                  onChange={(e) => setInterviewConfig(c => ({ ...c, style: e.target.value as InterviewerStyle }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Friendly">{t('modal.friendly')}</option>
                  <option value="Professional">{t('modal.professional')}</option>
                  <option value="Tough">{t('modal.tough')}</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <button 
                onClick={() => initInterview('TEXT')}
                className="group border-2 border-gray-100 hover:border-indigo-500 rounded-2xl p-6 text-left transition-all hover:shadow-lg bg-gray-50 hover:bg-white"
              >
                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <IconText />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('modal.text')}</h3>
                <p className="text-sm text-gray-500">{t('modal.textDesc')}</p>
              </button>
              
              <button 
                onClick={() => initInterview('VIDEO')}
                className="group border-2 border-gray-100 hover:border-indigo-500 rounded-2xl p-6 text-left transition-all hover:shadow-lg bg-gray-50 hover:bg-white"
              >
                <div className="bg-rose-100 text-rose-600 p-3 rounded-xl w-fit mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <IconVideo />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('modal.video')}</h3>
                <p className="text-sm text-gray-500">{t('modal.videoDesc')}</p>
              </button>
            </div>
            <button 
              onClick={() => setShowModeSelection(false)}
              className="mt-8 w-full text-gray-400 hover:text-gray-600 text-sm font-medium"
            >
              {t('modal.cancel')}
            </button>
          </div>
        </div>
      )}

      {mode === 'INTERVIEW' ? (
        /* Interview Interface (Split if Video) */
        <div className="flex-1 flex bg-gray-50 overflow-hidden relative">
          <div className="absolute top-4 left-0 right-0 z-10 flex justify-center items-center gap-3 px-4">
             <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-xs font-mono text-gray-600 shadow-md">
               <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
               {formatElapsed(elapsed)}
               <span className="text-gray-300">|</span>
               {answeredCount} {t('chat.answered')}
             </div>
             <button onClick={endInterview} className="bg-white text-red-600 border border-red-200 px-6 py-2 rounded-full text-sm font-bold hover:bg-red-50 transition-all shadow-md active:scale-95">
               {t('chat.end')}
             </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left side: Camera Preview for Video Mode */}
            {interviewType === 'VIDEO' && (
              <div className="hidden lg:block w-1/2 p-8 pt-20">
                <div className="relative h-full rounded-3xl overflow-hidden bg-black shadow-2xl border-4 border-white">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {t('chat.live')}
                  </div>
                </div>
              </div>
            )}

            {/* Right side: Chat */}
            <div className={`flex flex-col flex-1 h-full pt-16 ${interviewType === 'VIDEO' ? 'lg:w-1/2' : 'w-full max-w-3xl mx-auto'}`}>
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                    }`}>
                      {/* Fixed: Wrapped ReactMarkdown in a div because it may not accept className directly in some type versions */}
                      <div className={`prose prose-sm prose-p:leading-relaxed ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                        <ReactMarkdown>
                          {msg.parts[0].text}
                        </ReactMarkdown>
                        {isChatLoading && idx === messages.length - 1 && msg.role === 'model' && msg.parts[0].text && (
                          <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse align-middle ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && !messages[messages.length-1]?.parts[0].text && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{t('chat.thinking')}</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-8 bg-white/80 backdrop-blur-sm border-t shrink-0">
                <div className="max-w-4xl mx-auto flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={isListening ? t('chat.listening') : t('chat.placeholder')}
                      disabled={isChatLoading}
                      className={`w-full border rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12 ${
                        isListening ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-inner' : 'border-gray-200'
                      }`}
                    />
                    {interviewType === 'VIDEO' && (
                      <button 
                        onClick={isListening ? stopListening : startListening}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                          isListening ? 'bg-red-500 text-white shadow-lg scale-110' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                        }`}
                      >
                        <IconMic />
                      </button>
                    )}
                  </div>
                  {isChatLoading && abortRef.current ? (
                    <button
                      onClick={stopGenerating}
                      className="bg-gray-800 text-white p-4 rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center w-14 h-14"
                      title={t('analyze.stop')}
                    >
                      <IconStop />
                    </button>
                  ) : (
                    <button 
                      onClick={sendMessage}
                      disabled={isChatLoading || !inputValue.trim()}
                      className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 disabled:bg-gray-300 transition-all shadow-lg active:scale-95 flex items-center justify-center w-14 h-14"
                    >
                      <IconSend />
                    </button>
                  )}
                </div>
                {interviewType === 'VIDEO' && (
                  <p className="text-center text-[10px] text-gray-400 mt-3 uppercase tracking-widest font-bold">
                    {t('chat.videoActive')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Analyze & Report View */
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile tab switcher */}
          <div className="md:hidden flex border-b bg-white shrink-0">
            {(['input', 'result'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${
                  mobileTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'
                }`}
              >
                {tab === 'input' ? t('analyze.tabInput') : t('analyze.tabResult')}
              </button>
            ))}
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className={`${mobileTab === 'input' ? 'block' : 'hidden'} md:block w-full md:w-5/12 overflow-y-auto p-6 border-r bg-gray-50/50 custom-scrollbar`}>
            <div className="max-w-md mx-auto space-y-8">
              <button
                onClick={loadSample}
                className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all active:scale-[0.99]"
              >
                {t('analyze.sample')}
              </button>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('analyze.step1')}</label>
                  <div className="flex text-xs rounded-lg overflow-hidden border border-gray-200">
                    {(['upload', 'paste'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setResumeInputMode(m)}
                        className={`px-3 py-1.5 font-medium transition-colors ${
                          resumeInputMode === m ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {m === 'upload' ? t('analyze.uploadTab') : t('analyze.pasteTab')}
                      </button>
                    ))}
                  </div>
                </div>
                {resumeInputMode === 'upload' ? (
                  <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${resume ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'}`}>
                    <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {isExtracting ? <div className="animate-spin h-6 w-6 border-b-2 border-indigo-600 mx-auto" /> : 
                    resume ? <div className="text-green-700 font-medium truncate">{resume.fileName}</div> : 
                    <div className="text-gray-400 flex flex-col items-center"><IconUpload /><p className="text-xs mt-2 font-medium">{t('analyze.uploadHint')}</p></div>}
                  </div>
                ) : (
                  <textarea
                    value={resume?.text ?? ''}
                    onChange={(e) => handlePasteResume(e.target.value)}
                    className="w-full h-40 p-4 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    placeholder={t('analyze.pastePlaceholder')}
                  />
                )}
              </section>

              <section className="space-y-3">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('analyze.step2')}</label>
                <textarea 
                  value={jd} 
                  onChange={(e) => setJd(e.target.value)} 
                  className="w-full h-48 p-4 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                  placeholder={t('analyze.jdPlaceholder')}
                />
              </section>

              {analysis.isStreaming ? (
                <button
                  onClick={stopGenerating}
                  className="w-full py-4 bg-gray-800 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <IconStop /> {t('analyze.stop')}
                </button>
              ) : (
                <button 
                  onClick={handleAnalyze} 
                  disabled={!resume || !jd}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {t('analyze.analyzeBtn')}
                </button>
              )}
            </div>
            </div>

            <div className={`${mobileTab === 'result' ? 'block' : 'hidden'} md:block w-full md:w-7/12 overflow-y-auto bg-white custom-scrollbar`}>
            {!analysis.content ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 p-12">
                <div className="bg-gray-50 p-6 rounded-full mb-6">
                  <IconSparkles />
                </div>
                <h3 className="text-lg font-semibold text-gray-400">{analysis.isStreaming ? t('analyze.analyzing') : t('analyze.emptyTitle')}</h3>
                <p className="mt-2 text-center text-sm max-w-xs">{t('analyze.emptyDesc')}</p>
              </div>
            ) : (
              <div className="p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {mode === 'ANALYZE' && score !== null && (
                  <ScoreCard score={score} label={t('analyze.score')} />
                )}
                <div className="prose prose-indigo max-w-none prose-headings:font-bold prose-p:text-gray-600">
                   <ReactMarkdown>{analysisBody}</ReactMarkdown>
                </div>
                {analysis.isStreaming && (
                  <span className="inline-block w-2.5 h-5 bg-indigo-500 animate-pulse mt-1" />
                )}
                
                {mode === 'ANALYZE' && !analysis.isStreaming && (
                  <div className="mt-12 p-8 md:p-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl border border-indigo-200 flex flex-col items-center text-center shadow-inner">
                    <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg mb-6">
                      <IconSparkles />
                    </div>
                    <h3 className="text-2xl font-black text-indigo-900 mb-2">{t('cta.title')}</h3>
                    <p className="text-indigo-700 mb-8 text-sm max-w-md">{t('cta.desc')}</p>
                    <button 
                      onClick={() => setShowModeSelection(true)}
                      className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      {t('cta.btn')}
                    </button>
                  </div>
                )}

                {mode === 'REPORT' && (
                  <div className="mt-8 flex flex-wrap justify-center items-center gap-4 md:gap-6">
                    <button onClick={downloadReport} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                      {t('report.download')}
                    </button>
                    <button onClick={copyReport} className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-2xl font-bold shadow-sm hover:bg-indigo-50 transition-all active:scale-95">
                      {t('report.copy')}
                    </button>
                    <button onClick={() => { setMode('ANALYZE'); setAnalysis({ content: '', isStreaming: false }); setMobileTab('input'); }} className="text-indigo-600 font-bold hover:underline flex items-center gap-2">
                      {t('report.restart')}
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </main>
      )}

      <Toasts items={toasts} />
    </div>
  );
};

export default App;
