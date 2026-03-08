import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import mammoth from 'mammoth';
import { UploadCloud, FileText, CheckCircle, Clock, Download, Share2, Send, Loader2, BookOpen, Book, File, CornerDownRight, MessageSquare, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerPort) {
  pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();
}

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Processing' },
  { id: 3, label: 'Summary' },
  { id: 4, label: 'Export' }
];

const getFileEmoji = (filename) => {
  if (filename.endsWith('.pdf')) return '📕';
  if (filename.endsWith('.docx')) return '📘';
  if (filename.endsWith('.txt')) return '📙';
  return '📄';
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function Documents() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const { currentUser } = useAuth();
  const [recentDocs, setRecentDocs] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [step, setStep] = useState(1);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [askQuery, setAskQuery] = useState('');
  const [askResponses, setAskResponses] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [fullText, setFullText] = useState('');
  const fileInputRef = useRef(null);

  // ── NEW: Mobile top-level tab: 'upload' | 'summary' | 'history'
  const [activeMobileTab, setActiveMobileTab] = useState('upload');
  
  // Measure header height for desktop calc
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(105);
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'users', currentUser.uid, 'documents'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentDocs(docs);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const processFile = async (file) => {
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit.');
      return;
    }

    setIsProcessing(true);
    setStep(2);
    setAskResponses([]);
    setActiveDoc({ filename: file.name, fileSize: file.size, status: 'processing' });

    try {
      setProcessingStatus('Extracting text...');
      let text = '';
      let pageCount = null;

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pageCount = pdf.numPages;
        let extractedText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        text = extractedText;
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        text = await file.text();
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value || '';
      } else {
        throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.');
      }

      if (text.trim().length === 0) {
        throw new Error('Could not extract any text from this file. It may be a scanned image PDF or corrupted.');
      }

      setFullText(text);
      setProcessingStatus('Analyzing content...');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant for government officials that analyzes documents.
You MUST respond with ONLY a valid JSON object — no explanation, no markdown, no backticks.
The JSON must have exactly this shape:
{
  "summary": "A clear 3-4 sentence paragraph summarizing the document.",
  "keyPoints": [
    "First key insight or takeaway from the document",
    "Second key insight or takeaway from the document",
    "Third key insight or takeaway from the document"
  ]
}
Do not include any text before or after the JSON.`
            },
            { role: 'user', content: text.substring(0, 80000) }
          ],
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(`Groq API Error ${response.status}: ${errorBody?.error?.message || response.statusText}`);
      }

      setProcessingStatus('Generating summary...');
      const data = await response.json();
      const rawContent = data.choices[0].message.content;

      let parsed;
      try {
        const cleaned = rawContent.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { summary: rawContent.trim() || 'Summary could not be generated.', keyPoints: [] };
      }

      const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : 'Summary could not be generated.';

      const keyPoints = Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.filter(p => typeof p === 'string' && p.trim()).map(p => p.trim())
        : [];

      const summaryData = {
        filename: file.name,
        fileSize: file.size,
        pageCount: pageCount || null,
        summary,
        keyPoints,
        textContext: text.substring(0, 80000),
        status: 'summarized'
      };

      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'documents'), {
        ...summaryData,
        createdAt: new Date()
      });

      setActiveDoc({ id: docRef.id, ...summaryData });
      setStep(3);
      // ── AUTO-SWITCH to Summary tab on mobile when result is ready
      setActiveMobileTab('summary');

    } catch (error) {
      alert(error.message || 'An error occurred during processing.');
      setStep(1);
      setActiveDoc(null);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleSelectDoc = (doc) => {
    setActiveDoc(doc);
    setStep(3);
    setAskResponses([]);
    setFullText(doc.textContext || '');
    // ── When user taps a past doc from History, jump to Summary tab
    setActiveMobileTab('summary');
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!askQuery.trim() || !fullText) return;

    const userMessage = { role: 'user', content: askQuery };
    setAskResponses(prev => [...prev, userMessage]);
    setAskQuery('');
    setIsAsking(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `You are a helpful assistant analyzing this document context:\n${fullText.substring(0, 80000)}\n\nAnswer the user's question concisely based ONLY on the provided document context.` },
            ...askResponses.map(r => ({ role: r.role === 'user' ? 'user' : 'assistant', content: r.content })),
            userMessage
          ],
          max_tokens: 512
        })
      });

      if (!response.ok) throw new Error('Failed to fetch answer');
      const data = await response.json();
      setAskResponses(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
    } catch {
      setAskResponses(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while analyzing the document.' }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleDownload = () => {
    if (!activeDoc) return;
    const textContent = `${activeDoc.filename} - Summary\n\nSummary:\n${activeDoc.summary}\n\nKey Points:\n${activeDoc.keyPoints.join('\n')}`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.filename}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStep(4);
  };

  const handleShare = () => {
    if (!activeDoc) return;
    const textContent = `${activeDoc.filename} - Summary\n\nSummary:\n${activeDoc.summary}\n\nKey Points:\n${activeDoc.keyPoints.join('\n')}`;
    navigator.clipboard.writeText(textContent);
    alert('Summary copied to clipboard!');
    setStep(4);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --------------------------------------------------------------------------
  // SHARED UI BLOCKS
  // --------------------------------------------------------------------------

  const UploadPanel = () => (
    <div
      className={`bg-zinc-900/50 rounded-2xl shadow-sm border ${isProcessing ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-zinc-800 border-dashed hover:border-indigo-500/50 hover:bg-zinc-900'} p-6 md:p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer`}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isProcessing ? (
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
      ) : (
        <div className="w-12 h-12 bg-zinc-800/80 text-zinc-300 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-zinc-700/50">
          <UploadCloud className="w-6 h-6" />
        </div>
      )}

      <h3 className="text-lg font-medium text-white">
        {isProcessing ? 'Processing Document' : 'Upload Document'}
      </h3>
      <p className="text-sm text-zinc-400 mt-1">
        {isProcessing ? processingStatus : 'Supports PDF, DOCX, TXT · Max 50MB'}
      </p>

      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        accept=".pdf,.docx,.txt"
        onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
      />

      {!isProcessing && (
        <button className="mt-6 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-sm">
          Browse Files
        </button>
      )}

      {activeDoc && isProcessing && (
        <div className="mt-4 p-3 bg-zinc-800/80 rounded-lg w-full text-left flex items-center gap-3 border border-zinc-700">
          <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{activeDoc.filename}</p>
            <p className="text-xs text-zinc-400">{formatBytes(activeDoc.fileSize)}</p>
          </div>
        </div>
      )}
    </div>
  );

  const HistoryList = () => (
    <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Documents</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {recentDocs.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500 flex flex-col items-center justify-center min-h-[50vh] lg:min-h-full">
            <History className="w-10 h-10 text-zinc-700 mb-3" />
            <p>No documents found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-zinc-950/50 border border-zinc-800/60 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col"
                onClick={() => handleSelectDoc(doc)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors border border-zinc-700/50 text-xl pt-0.5">
                    {getFileEmoji(doc.filename)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors ${activeDoc?.id === doc.id ? 'text-indigo-400' : 'text-zinc-200'}`}>
                      {doc.filename}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-medium text-zinc-500">
                      <span>{formatTime(doc.createdAt)}</span>
                      {doc.pageCount && <span className="flex items-center gap-1"><File className="w-3 h-3" /> {doc.pageCount} Pages</span>}
                    </div>
                  </div>
                </div>
                {doc.summary && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mt-auto">
                    {doc.summary}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-zinc-800/50">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600 group-hover:text-indigo-500 transition-colors text-right w-full flex items-center justify-end gap-1">
                    View Details
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const SummaryPanel = () => (
    activeDoc && activeDoc.status === 'summarized' ? (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">

        <div className="px-2 py-4 md:p-6 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white truncate max-w-sm" title={activeDoc.filename}>
                {activeDoc.filename}
              </h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1.5">
                {activeDoc.pageCount && <span className="flex items-center gap-1"><File className="w-3.5 h-3.5" /> {activeDoc.pageCount} Pages</span>}
                {activeDoc.pageCount && activeDoc.fileSize && <span>·</span>}
                {activeDoc.fileSize && <span>{formatBytes(activeDoc.fileSize)}</span>}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> Complete
          </span>
        </div>

        <div className="w-full bg-zinc-800 h-0.5">
          <div className="bg-emerald-500 h-0.5 w-full rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>

        <div className="p-2 md:p-8 flex-1 overflow-y-auto">
          <div className="max-w-none">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 tracking-tight">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Executive Summary
            </h3>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-[15px]">{activeDoc.summary}</p>

            <hr className="my-8 border-zinc-800" />

            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 tracking-tight">
              <Clock className="w-5 h-5 text-indigo-400" /> Key Points Extracted
            </h3>
            <ul className="space-y-3">
              {activeDoc.keyPoints?.length > 0 ? (
                activeDoc.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex gap-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                    <span className="text-lg font-bold text-indigo-400 shrink-0 font-mono mt-0.5">{idx + 1}.</span>
                    <span className="text-zinc-300 leading-relaxed text-[15px]">{point}</span>
                  </li>
                ))
              ) : (
                <li className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/80 text-zinc-500 text-sm">
                  No key points could be extracted from this document.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="p-5 border-t border-zinc-800 flex flex-wrap gap-3 bg-zinc-900/50">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Download Summary
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-medium rounded-lg hover:bg-zinc-700 hover:text-white transition-colors shadow-sm"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Ask AI Section */}
        <div className="border-t border-zinc-800 bg-zinc-950/50">
          <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-[13px] font-medium text-zinc-300 uppercase tracking-widest">Ask AI about this document</span>
          </div>

          {askResponses.length > 0 && (
            <div className="px-5 py-4 max-h-60 overflow-y-auto space-y-4">
              {askResponses.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] text-zinc-500 mb-1 ml-1">{msg.role === 'user' ? 'You' : 'Neeti AI'}</span>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm' : 'bg-zinc-800 border border-zinc-700/50 text-zinc-200 rounded-tl-sm shadow-sm'}`}>
                    {msg.role === 'user' ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAskAI} className="px-5 py-4 flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                placeholder={fullText ? "Ask anything about this document..." : "No document context available"}
                disabled={!fullText || isAsking}
                className="w-full pl-4 pr-10 py-2 bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 placeholder-zinc-500"
              />
              <CornerDownRight className="w-4 h-4 text-zinc-600 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              disabled={!askQuery.trim() || !fullText || isAsking}
              className="inline-flex items-center justify-center bg-indigo-600 text-white w-10 h-10 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-sm shrink-0"
            >
              {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    ) : (
      <HistoryList />
    )
  );

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-full bg-zinc-950 pb-6 md:pb-10 text-zinc-100">

      {/* ── Top Header (always visible) */}
      <div ref={headerRef} className="bg-zinc-950 px-4 py-4 md:px-6 md:py-6 border-b border-zinc-800 sticky top-0 z-10 w-full overflow-hidden">
        <div className="max-w-400 mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Document Summarizer</h1>
            <p className="text-zinc-400 text-xs md:text-sm mt-1">Upload long documents for instant AI summaries.</p>
          </div>

          {/* Step progress — hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto py-2 flex-nowrap shrink-0 scrollbar-hide md:justify-end">
            {STEPS.map((s, idx) => {
              let statusClass = "text-zinc-500 border-zinc-800 bg-zinc-900";
              let lineClass = "bg-zinc-800";
              if (step > s.id) { statusClass = "text-indigo-400 border-indigo-500/30 bg-indigo-500/10"; lineClass = "bg-indigo-500/50"; }
              else if (step === s.id) { statusClass = "text-indigo-300 border-indigo-500 bg-indigo-500/20 font-medium"; }
              return (
                <div key={s.id} className="flex items-center shrink-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border text-sm transition-colors ${statusClass}`}>
                    {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                  </div>
                  <span className={`ml-2 text-sm whitespace-nowrap ${step === s.id ? 'text-indigo-300 font-medium' : 'text-zinc-500'}`}>{s.label}</span>
                  {idx < STEPS.length - 1 && <div className={`w-8 md:w-12 h-0.5 mx-3 ${lineClass}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mobile 3-tab bar — only visible below lg breakpoint */}
        <div className="lg:hidden mt-3 flex rounded-xl bg-zinc-900 border border-zinc-800 p-1 gap-1">
          {[
            { key: 'upload', label: 'Upload', icon: <UploadCloud className="w-4 h-4" /> },
            { key: 'summary', label: 'Summary', icon: <BookOpen className="w-4 h-4" /> },
            { key: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveMobileTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMobileTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {/* Green dot on Summary tab when result is ready */}
              {tab.key === 'summary' && activeDoc?.status === 'summarized' && activeMobileTab !== 'summary' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── MOBILE CONTENT (below lg) — show only the active tab */}
      <div className="lg:hidden px-4 pt-4 pb-6 flex flex-col gap-4">
        {activeMobileTab === 'upload' && <UploadPanel />}
        {activeMobileTab === 'summary' && <SummaryPanel />}
        {activeMobileTab === 'history' && <HistoryList />}
      </div>

      {/* ── DESKTOP CONTENT (lg and above) — explicit calc height anchored to header */}
      <div className="hidden lg:flex w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 lg:gap-8" style={{ height: `calc(100vh - ${headerHeight}px)` }}>

        {/* LEFT COLUMN */}
        <div className="w-[35%] xl:w-1/3 flex flex-col gap-4 overflow-hidden">
          <div className="shrink-0">
            <UploadPanel />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <SummaryPanel />
        </div>

      </div>
    </div>
  );
}