import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import {
  PenTool, FileText, Mic, Mail, Radio, MessageSquare,
  Loader2, Copy, Download, RefreshCw, Check, Cloud,
  AlertCircle, Sparkles, BookOpen, Pencil, CloudOff
} from 'lucide-react';
import { createPortal } from 'react-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
const DRAFT_TYPES = [
  { id: 'Speech', label: 'Speech', icon: Mic },
  { id: 'Press Statement', label: 'Press Statement', icon: Radio },
  { id: 'Official Letter', label: 'Official Letter', icon: Mail },
  { id: 'Response to Media', label: 'Response to Media', icon: MessageSquare }
];

const TONES = ['Formal', 'Inspirational', 'Assertive', 'Empathetic'];
const LENGTHS = [
  { id: 'Short', label: 'Short (~2 min)' },
  { id: 'Medium', label: 'Medium (~5 min)' },
  { id: 'Long', label: 'Long (~10 min)' }
];

export default function Speeches() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const { currentUser } = useAuth();

  // State variables
  const [step, setStep] = useState(1);
  const [speeches, setSpeeches] = useState([]);
  const [activeSpeech, setActiveSpeech] = useState(null);

  // Form fields
  const [draftType, setDraftType] = useState('Speech');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Formal');
  const [audience, setAudience] = useState('');
  const [length, setLength] = useState('Medium');
  const [context, setContext] = useState('');

  // Generation & Result states
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [draftContent, setDraftContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const saveTimeoutRef = useRef(null);
  const [headerNode, setHeaderNode] = useState(null);

  useEffect(() => {
    setHeaderNode(document.getElementById('page-header-content'));
  }, []);

  // Fetch saved drafts
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'speeches'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpeeches(docs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle Auto-save
  useEffect(() => {
    if (step !== 3 || !activeSpeech || !activeSpeech.id) return;

    // Don't auto-save if content hasn't changed from original
    if (draftContent === activeSpeech.content) return;

    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'speeches', activeSpeech.id);
        await updateDoc(docRef, {
          content: draftContent,
          updatedAt: new Date()
        });

        // Update local activeSpeech reference to accurately compare next time
        setActiveSpeech(prev => ({ ...prev, content: draftContent }));

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('idle'); // or an error state
      }
    }, 1500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [draftContent, activeSpeech?.id]);

  const handleNewDraft = () => {
    setActiveSpeech(null);
    setStep(1);
    setTopic('');
    setAudience('');
    setContext('');
    setDraftContent('');
    setError(null);
    setMobileSidebarOpen(false);
  };

  const handleSelectSpeech = (speech) => {
    setActiveSpeech(speech);
    setDraftType(speech.type || 'Speech');
    setTopic(speech.title || '');
    setTone(speech.tone || 'Formal');
    setAudience(speech.audience || '');
    setLength(speech.length || 'Medium');
    setContext(speech.context || '');
    // Wait briefly for states to settle before injecting HTML into quill
    setTimeout(() => {
      setDraftContent(speech.content || '');
    }, 50);
    setStep(3);
    setError(null);
    setMobileSidebarOpen(false);
  };


  const getTypeIcon = (typeTitle) => {
    const typeObj = DRAFT_TYPES.find(t => t.id === typeTitle);
    const Icon = typeObj ? typeObj.icon : FileText;
    return <Icon className="w-4 h-4" />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleGenerate = async () => {
    if (!draftType || !topic.trim()) return;

    setStep(2);
    setIsGenerating(true);
    setError(null);

    try {
      let wordLengthHint = '~700 words';
      if (length === 'Short') wordLengthHint = '~300 words';
      if (length === 'Long') wordLengthHint = '~1200 words';

      const systemPrompt = `You are an expert speechwriter and communications advisor for senior Indian government officials and public leaders. 
Write a ${draftType} for the following request. 
Tone: ${tone}. 
Approximate length: ${length} (${wordLengthHint}).
${audience ? 'Target Audience: ' + audience : ''}
${context ? 'Additional Context: ' + context : ''}
Write ONLY the draft content itself — no titles, no preamble, no explanations. 
Format the response using standard HTML tags (e.g. <b>, <i>, <u>, <h1>, <h2>, <p>, <ul>, <li>) so that it can be rendered securely by a rich text editor.
Just the HTML speech/letter/statement text, ready to deliver or send. 
Use clear paragraphs. For speeches, include a strong opening and closing. 
For official letters, use proper formal structure.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // cheap robust model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Topic / Occasion: ${topic.trim()}` }
          ],
          max_tokens: 2048,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(`Groq API Error ${response.status}: ${errorBody?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content.trim();

      // Save to Firestore
      const newDocData = {
        title: topic.trim(),
        type: draftType,
        tone,
        audience: audience.trim(),
        length,
        context: context.trim(),
        content: generatedText,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'speeches'), newDocData);

      setActiveSpeech({ id: docRef.id, ...newDocData });
      setDraftContent(generatedText);
      setStep(3);

    } catch (err) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(draftContent);
    // Optional: add a small toast/state to show "Copied!"
  };

  const handleDownload = () => {
    // Strip HTML tags for download using a temporary element
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = draftContent;
    const cleanText = tempDiv.textContent || tempDiv.innerText || "";

    const blob = new Blob([cleanText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}-draft.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = () => {
    setStep(1);
    // Values are already pre-filled from activeSpeech in state
  };

  const handleTitleSubmit = async () => {
    if (!editTitle.trim() || !activeSpeech || !activeSpeech.id) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'speeches', activeSpeech.id);
      await updateDoc(docRef, { title: editTitle.trim() });
      setActiveSpeech(prev => ({ ...prev, title: editTitle.trim() }));
      setTopic(editTitle.trim()); // Sync the form state too
    } catch (err) {
      console.error('Error updating title:', err);
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">

      {/* ── Top Header (Portaled to AppShell on Desktop) */}
      {headerNode && createPortal(
        <div className="flex items-center justify-between w-full h-full animate-in fade-in">
          <div className="flex flex-col justify-center shrink-0">
            <h1 className="text-base font-bold text-white tracking-tight leading-none">AI Speechwriter</h1>
            <p className="text-zinc-400 text-[10px] leading-none hidden md:block mt-1">Draft speeches, letters, and statements.</p>
          </div>
        </div>,
        headerNode
      )}

      {/* ── Mobile Action Bar (Sticky) */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold">AI Speechwriter</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className={`p-2 rounded-lg border transition-all ${mobileSidebarOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={handleNewDraft}
            className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg active:scale-95 transition-transform"
          >
            <PenTool className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">

        {/* LEFT PANEL / SIDEBAR (Collapsible on Mobile) */}
        <aside className={`
          absolute inset-0 z-20 lg:relative lg:flex lg:flex-col lg:w-80 border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 transform
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10 hidden lg:block">
              <button
                onClick={handleNewDraft}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                <PenTool className="w-4 h-4" /> New Draft
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              <div className="px-2 flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Saved Drafts</h3>
                <span className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{speeches.length}</span>
              </div>

              {speeches.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center h-full">
                  <BookOpen className="w-10 h-10 text-zinc-800 mb-3" />
                  <p className="text-zinc-600 text-sm">No drafts saved yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {speeches.map(speech => (
                    <button
                      key={speech.id}
                      onClick={() => handleSelectSpeech(speech)}
                      className={`w-full text-left p-3 rounded-xl border transition-all relative group ${activeSpeech?.id === speech.id
                          ? 'bg-indigo-600/10 border-indigo-500/30'
                          : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeSpeech?.id === speech.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                          {getTypeIcon(speech.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate leading-tight ${activeSpeech?.id === speech.id ? 'text-white' : 'text-zinc-200'}`}>
                            {speech.title || 'Untitled'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-800/80">
                          {speech.type?.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-medium">{formatDate(speech.createdAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {mobileSidebarOpen && (
          <div
            className="absolute inset-0 bg-black/60 z-10 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden relative">

          {step === 1 && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="max-w-2xl mx-auto pb-10">
                <header className="mb-8">
                  <h2 className="text-2xl font-black text-white tracking-tight">Create New Draft</h2>
                  <p className="text-zinc-500 text-sm mt-1">Set your preferences for the perfect draft.</p>
                </header>

                <div className="space-y-8">
                  {/* Draft Type */}
                  <section>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Draft Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {DRAFT_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => setDraftType(type.id)}
                          className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 ${draftType === type.id
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] scale-105 z-10'
                              : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                        >
                          <type.icon className={`w-5 h-5 ${draftType === type.id ? 'text-white' : 'text-zinc-500'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Topic */}
                  <section>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Topic / Occasion</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. Inauguration of NH-48 Highway..."
                      className="w-full bg-zinc-900 border-2 border-zinc-800 text-zinc-100 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600 text-base"
                    />
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tone */}
                    <section>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Tone</label>
                      <div className="flex flex-wrap gap-2">
                        {TONES.map(t => (
                          <button
                            key={t}
                            onClick={() => setTone(t)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${tone === t
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                              }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Length */}
                    <section>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Length</label>
                      <div className="flex flex-wrap gap-2">
                        {LENGTHS.map(l => (
                          <button
                            key={l.id}
                            onClick={() => setLength(l.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${length === l.id
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                              }`}
                          >
                            {l.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Context */}
                  <section>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Additional Context</label>
                    <textarea
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      placeholder="Notes, statistics, or specific talking points..."
                      rows={4}
                      className="w-full bg-zinc-900 border-2 border-zinc-800 text-zinc-100 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600 resize-none text-base"
                    />
                  </section>
                </div>

                <div className="mt-12 flex items-center justify-center">
                  <button
                    onClick={handleGenerate}
                    disabled={!topic.trim() || isGenerating}
                    className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate Draft
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                <Loader2 className="w-16 h-16 text-indigo-500 animate-[spin_1.5s_linear_infinite] relative z-10" />
              </div>
              <h3 className="text-2xl font-black text-white mt-8 mb-2 tracking-tight">Drafting In Progress</h3>
              <p className="text-zinc-500 text-center max-w-70">Our legislative engine is crafting your {draftType.toLowerCase()} response...</p>

              {error && (
                <div className="mt-10 max-w-sm p-5 bg-red-950/20 border-2 border-red-900/30 rounded-3xl text-center space-y-4">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <span className="text-sm font-bold text-red-500 uppercase tracking-widest">Error Occurred</span>
                  </div>
                  <p className="text-sm text-zinc-400">{error}</p>
                  <button onClick={() => setStep(1)} className="w-full py-2.5 bg-zinc-800 rounded-xl text-xs font-bold text-white uppercase tracking-wider">Try Selection Again</button>
                </div>
              )}
            </div>
          )}

          {step === 3 && activeSpeech && (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 animate-in slide-in-from-right-4 duration-500">

              {/* Toolbar */}
              <div className="px-4 py-4 md:px-6 md:py-5 border-b border-zinc-900 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md shrink-0">
                <div className="flex-1 min-w-0 pr-2">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSubmit();
                        if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                      onBlur={handleTitleSubmit}
                      className="w-full bg-zinc-900 border-2 border-indigo-500/50 text-white text-base md:text-lg font-black rounded-xl px-4 py-2 focus:outline-none"
                    />
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">{activeSpeech.type}</span>
                        {saveStatus === 'saving' && <span className="text-[9px] font-bold text-zinc-600 uppercase animate-pulse">● Saving</span>}
                        {saveStatus === 'saved' && <Cloud className="w-3 h-3 text-zinc-700" />}
                      </div>
                      <h2
                        className="text-lg md:text-xl font-black text-white truncate cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-2"
                        onClick={() => { setEditTitle(activeSpeech.title); setIsEditingTitle(true); }}
                      >
                        {activeSpeech.title}
                        < Pencil className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                      </h2>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 m-auto md:m-0">
                  <button onClick={handleCopyToClipboard} className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:text-white hover:border-zinc-700 transition-all active:scale-90" title="Copy Content">
                    <Copy className="w-4.5 h-4.5" />
                  </button>
                  <button onClick={handleDownload} className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:text-white hover:border-zinc-700 transition-all active:scale-90" title="Download Text">
                    <Download className="w-4.5 h-4.5" />
                  </button>
                  <button onClick={handleRegenerate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Modify</span>
                  </button>
                </div>
              </div>

              {/* Editor Container */}
              <div className="flex-1 min-h-0 bg-zinc-950 overflow-hidden relative group">
                <style>{`
                  .speeches-quill-container .ql-toolbar {
                    border: none !important;
                    border-bottom: 2px solid #18181b !important;
                    background-color: #09090b !important;
                    padding: 10px 16px !important;
                  }
                  .speeches-quill-container .ql-container {
                    border: none !important;
                    font-size: 16px !important;
                    color: #e4e4e7 !important;
                    height: calc(100% - 44px) !important;
                  }
                  .speeches-quill-container .ql-editor {
                    padding: 24px !important;
                    line-height: 1.6 !important;
                    scrollbar-width: thin;
                    scrollbar-color: #27272a transparent;
                  }
                  .speeches-quill-container .ql-stroke { stroke: #52525b !important; }
                  .speeches-quill-container .ql-fill { fill: #52525b !important; }
                  .speeches-quill-container .ql-picker { color: #52525b !important; font-weight: bold !important; }
                  .speeches-quill-container .ql-active .ql-stroke, 
                  .speeches-quill-container .ql-active .ql-fill,
                  .speeches-quill-container button:hover .ql-stroke { stroke: #6366f1 !important; }
                  @media (max-width: 768px) {
                    .speeches-quill-container .ql-editor { padding: 16px !important; font-size: 15px !important; }
                    .speeches-quill-container .ql-toolbar { padding: 8px !important; overflow-x: auto; display: flex; align-items: center; }
                  }
                `}</style>
                <div className="h-full speeches-quill-container">
                  <ReactQuill
                    theme="snow"
                    value={draftContent}
                    onChange={setDraftContent}
                    className="h-full"
                  />
                </div>
              </div>

            </div>
          )}
        </main>

      </div>
    </div>
  );
}
