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
    <div className="flex flex-col min-h-full bg-zinc-950 pb-6 md:pb-10 text-zinc-100 h-full max-h-[100dvh]">
      
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

      {/* ── Mobile Top Header (Visible only on small screens) */}
      <div className="md:hidden px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-white tracking-tight leading-none">AI Speechwriter</h1>
        <p className="text-zinc-400 text-[11px] mt-1.5">Draft speeches, letters, and statements.</p>
      </div>

      <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 gap-6 lg:gap-8 flex-1 min-h-[500px]">
        
        {/* LEFT PANEL */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-hidden lg:h-[calc(100vh-8rem)]">
          <button
            onClick={handleNewDraft}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-sm shrink-0"
          >
            <PenTool className="w-4 h-4" /> New Draft
          </button>
          
          <div className="flex-1 overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm flex flex-col min-h-[300px]">
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Saved Drafts</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
              {speeches.length === 0 ? (
                <div className="p-6 text-center test-sm text-zinc-500 flex flex-col items-center justify-center h-full min-h-[200px]">
                  <BookOpen className="w-8 h-8 text-zinc-700 mb-3" />
                  <p>No drafts yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {speeches.map(speech => (
                    <button
                      key={speech.id}
                      onClick={() => handleSelectSpeech(speech)}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                        activeSpeech?.id === speech.id 
                          ? 'bg-zinc-800 border-indigo-500/50' 
                          : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          activeSpeech?.id === speech.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {getTypeIcon(speech.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className={`text-sm font-semibold truncate mt-0.5 ${activeSpeech?.id === speech.id ? 'text-white' : 'text-zinc-200'}`}>
                            {speech.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">{formatDate(speech.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                          {speech.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col min-h-[500px] lg:h-[calc(100vh-8rem)]">
          {step === 1 && (
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 animate-in fade-in scrollbar-hide">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-6">Create New Draft</h2>
                
                <div className="space-y-6">
                  {/* Draft Type */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Draft Type <span className="text-indigo-400">*</span></label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {DRAFT_TYPES.map(type => {
                        const Icon = type.icon;
                        const isActive = draftType === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setDraftType(type.id)}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                              isActive 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium text-center">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Topic / Occasion <span className="text-indigo-400">*</span></label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. Inauguration of NH-48 Highway, Response to farmer protest..."
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-4 py-3 focus:border-indigo-500/50 outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tone */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Tone <span className="text-indigo-400">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {TONES.map(t => (
                          <button
                            key={t}
                            onClick={() => setTone(t)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                              tone === t 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Length */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Length</label>
                      <div className="flex flex-wrap gap-2">
                        {LENGTHS.map(l => (
                          <button
                            key={l.id}
                            onClick={() => setLength(l.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                              length === l.id 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Target Audience <span className="text-zinc-600 normal-case font-normal max-md:hidden">(Optional)</span></label>
                    <input
                      type="text"
                      value={audience}
                      onChange={e => setAudience(e.target.value)}
                      placeholder="e.g. Farmers, Press Corps, Parliament members..."
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-4 py-3 focus:border-indigo-500/50 outline-none transition-colors"
                    />
                  </div>

                  {/* Context */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Additional Context <span className="text-zinc-600 normal-case font-normal max-md:hidden">(Optional)</span></label>
                    <textarea
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      placeholder="Paste any background notes, key statistics, or talking points..."
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-4 py-3 focus:border-indigo-500/50 outline-none transition-colors resize-y"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800">
                  <button
                    onClick={handleGenerate}
                    disabled={!draftType || !topic.trim() || isGenerating}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                    Generate Draft
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
              <h3 className="text-xl font-semibold text-white mb-2">Drafting your {draftType.toLowerCase()} with AI...</h3>
              <p className="text-zinc-500">This usually takes 5–10 seconds</p>
              
              {error && (
                <div className="mt-8 max-w-md w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center text-center gap-3">
                  <div className="flex items-center gap-2 text-red-400 font-medium">
                    <AlertCircle className="w-5 h-5" />
                    Generation Failed
                  </div>
                  <p className="text-sm text-red-400/80">{error}</p>
                  <button
                    onClick={() => setStep(1)}
                    className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Go Back & Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && activeSpeech && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
              
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-xs font-medium text-zinc-300 border border-zinc-700">
                      {getTypeIcon(activeSpeech.type)}
                      {activeSpeech.type}
                    </span>
                  </div>
                  
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 w-full max-w-xl">
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
                        className="flex-1 bg-zinc-950 border border-indigo-500/50 text-white text-lg font-bold rounded-lg px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div 
                      className="group flex items-center gap-2 cursor-text w-max max-w-full"
                      onClick={() => {
                        setEditTitle(activeSpeech.title);
                        setIsEditingTitle(true);
                      }}
                    >
                      <h2 className="text-xl font-bold text-white truncate group-hover:text-indigo-100 transition-colors">
                        {activeSpeech.title}
                      </h2>
                      <Pencil className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
                
                {/* Auto-save Status indicator */}
                <div className="flex items-center gap-1.5 text-xs font-medium pl-4 shrink-0">
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <CloudOff className="w-3.5 h-3.5 animate-pulse" /> Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <Cloud className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-6 scrollbar-hide">
                <div className="max-w-3xl mx-auto w-full h-full relative speeches-quill-container">
                  <ReactQuill 
                    theme="snow" 
                    value={draftContent} 
                    onChange={setDraftContent}
                    className="h-full bg-zinc-950 text-zinc-100 rounded-xl"
                  />
                  <style>{`
                    .speeches-quill-container .ql-toolbar {
                      border-color: #27272a;
                      background-color: #18181b;
                      border-top-left-radius: 0.75rem;
                      border-top-right-radius: 0.75rem;
                    }
                    .speeches-quill-container .ql-container {
                      border-color: #27272a;
                      border-bottom-left-radius: 0.75rem;
                      border-bottom-right-radius: 0.75rem;
                      font-size: 15px;
                      font-family: inherit;
                      min-height: 400px;
                    }
                    .speeches-quill-container .ql-editor {
                      min-height: 400px;
                    }
                    .speeches-quill-container .ql-stroke {
                      stroke: #a1a1aa;
                    }
                    .speeches-quill-container .ql-fill {
                      fill: #a1a1aa;
                    }
                    .speeches-quill-container .ql-picker {
                      color: #a1a1aa;
                    }
                    .speeches-quill-container .ql-picker-options {
                      background-color: #18181b;
                      border-color: #27272a;
                    }
                    .speeches-quill-container .ql-picker-item:hover {
                      color: #fff;
                    }
                    .speeches-quill-container button:hover .ql-stroke {
                      stroke: #fff;
                    }
                    .speeches-quill-container button:hover .ql-fill {
                      fill: #fff;
                    }
                  `}</style>
                </div>
              </div>
              
              <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex flex-wrap gap-3 items-center shrink-0">
                <button
                  onClick={handleCopyToClipboard}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleRegenerate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Modify Request
                </button>
              </div>
              
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
