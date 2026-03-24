import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { UploadCloud, FileText, CheckCircle, Clock, Download, Share2, Send, Loader2, BookOpen, Book, File, CornerDownRight, MessageSquare, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import Tesseract from 'tesseract.js';
import { StyledSwal } from '../utils/sweetalert';
import { Sparkles } from 'lucide-react';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
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
  
  const [headerNode, setHeaderNode] = useState(null);
  useEffect(() => {
    setHeaderNode(document.getElementById('page-header-content'));
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
    if (!file || isProcessing) return;
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit.');
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
        console.log("PDF Extracted text length:", text.length, text.substring(0, 100));
        let extractedText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        text = extractedText;
        
        // Log individual page items for debugging
        if (text.trim().length < 100) {
          console.error("PDF text extraction returned very little or empty text. PDF might be a scanned image.");
          setProcessingStatus('Performing OCR (this may take a minute)...');
          
          let ocrText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            setProcessingStatus(`Performing OCR on page ${i} of ${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const { data: { text: pageText } } = await Tesseract.recognize(canvas, 'eng', {
              logger: m => console.log(m)
            });
            ocrText += pageText + '\n';
          }
          text = ocrText;
        }
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
        console.warn('PDF extracted text is empty. Bypassing strict error to allow debugging.');
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
            { role: 'user', content: text.substring(0, 25000) }
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
        textContext: text.substring(0, 25000),
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
      console.error('Document Processing Error Detail:', error);
      
      const isRateLimit = error.message?.includes('413') || error.message?.includes('Limit');
      
      StyledSwal.fire({
        title: isRateLimit ? 'Document Too Large' : 'Processing Error',
        text: isRateLimit 
          ? 'This document is very long. We recommend uploading a shorter version or a more concise PDF.'
          : (error.message || 'An error occurred during processing.'),
        icon: isRateLimit ? 'warning' : 'error',
        confirmButtonText: 'Understood'
      });

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
            { role: 'system', content: `You are a helpful assistant analyzing this document context:\n${fullText.substring(0, 25000)}\n\nAnswer the user's question concisely based ONLY on the provided document context.` },
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
    toast.success('Summary copied to clipboard!');
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

  const uploadPanelContent = (
    <div
      className={`bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border ${isProcessing ? 'border-indigo-500/30 bg-indigo-500/5 pointer-events-none' : 'border-[var(--border-main)] dark:border-zinc-800 border-dashed hover:border-indigo-500/50 hover:bg-[var(--bg-app)] dark:hover:bg-zinc-900 shadow-xs'} transition-all`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        id="document-upload-input"
        type="file"
        className="hidden"
        ref={fileInputRef}
        accept=".pdf,.docx,.txt"
        onChange={(e) => { 
          if (e.target.files?.[0]) {
            processFile(e.target.files[0]);
            e.target.value = ''; 
          }
        }}
      />

      {isProcessing ? (
        <div className="p-4 md:p-5 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
            Processing Document
          </h3>
          <p className="text-sm text-[var(--text-dim)] dark:text-[var(--text-muted)] mt-1">
            {processingStatus}
          </p>
          {activeDoc && (
            <div className="mt-4 p-3 bg-white dark:bg-zinc-800/80 rounded-lg w-full text-left flex items-center gap-3 border border-[var(--border-main)] dark:border-zinc-700 shadow-sm animate-in fade-in duration-300">
              <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{activeDoc.filename}</p>
                <p className="text-xs text-[var(--text-dim)] dark:text-[var(--text-muted)]">{formatBytes(activeDoc.fileSize)}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor="document-upload-input"
          className="p-4 md:p-5 flex flex-col items-center justify-center text-center cursor-pointer w-full h-full min-h-[180px]"
        >
          <div className="w-12 h-12 bg-[var(--bg-app)] dark:bg-zinc-800/80 text-[var(--text-dim)] dark:text-zinc-300 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-[var(--border-subtle)] dark:border-zinc-700/50 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
            Upload Document
          </h3>
          <p className="text-sm text-[var(--text-dim)] dark:text-[var(--text-muted)] mt-1">
            Supports PDF, DOCX, TXT · Max 50MB
          </p>

          <span className="mt-6 px-4 py-2 bg-white dark:bg-zinc-800 border border-[var(--border-main)] dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-[var(--bg-app)] dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-sm">
            Browse Files
          </span>
        </label>
      )}
    </div>
  );

  const historyListContent = (
    <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-zinc-900 rounded-2xl border border-[var(--border-main)] dark:border-zinc-800 shadow-sm flex flex-col">
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] dark:border-zinc-800 bg-[var(--bg-app)] dark:bg-zinc-900/50 shrink-0">
        <h3 className="text-xs font-semibold text-[var(--text-dim)] dark:text-[var(--text-muted)] uppercase tracking-wider">Recent Documents</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {recentDocs.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-dim)] flex flex-col items-center justify-center min-h-[50vh] lg:min-h-full">
            <History className="w-10 h-10 text-zinc-700 mb-3" />
            <p>No documents found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-[var(--bg-app)] dark:bg-zinc-950/50 border border-[var(--border-main)] dark:border-zinc-800/60 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all cursor-pointer group flex flex-col shadow-xs"
                onClick={() => handleSelectDoc(doc)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/80 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors border border-[var(--border-main)] dark:border-zinc-700/50 text-xl pt-0.5 shadow-xs">
                    {getFileEmoji(doc.filename)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${activeDoc?.id === doc.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-zinc-200'}`}>
                      {doc.filename}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-medium text-[var(--text-dim)]">
                      <span>{formatTime(doc.createdAt)}</span>
                      {doc.pageCount && <span className="flex items-center gap-1"><File className="w-3 h-3" /> {doc.pageCount} Pages</span>}
                    </div>
                  </div>
                </div>
                {doc.summary && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mt-auto">
                    {doc.summary}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] dark:border-zinc-800/50">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-dim)] dark:text-zinc-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-500 transition-colors text-right w-full flex items-center justify-end gap-1">
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

  const summaryPanelContent = (
    activeDoc && (activeDoc.status === 'summarized' || isProcessing) ? (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[var(--border-main)] dark:border-zinc-800 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">

        <div className="px-5 py-4 border-b border-[var(--border-subtle)] dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${isProcessing ? 'bg-indigo-500/10' : 'bg- emerald-500/10'} border ${isProcessing ? 'border-indigo-500/20' : 'border-emerald-500/20'} rounded-xl flex items-center justify-center shrink-0`}>
              {isProcessing ? (
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white truncate max-w-sm" title={activeDoc.filename}>
                {activeDoc.filename}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] dark:text-[var(--text-muted)] mt-1.5">
                {activeDoc.pageCount && <span className="flex items-center gap-1"><File className="w-3.5 h-3.5" /> {activeDoc.pageCount} Pages</span>}
                {activeDoc.pageCount && activeDoc.fileSize && <span>·</span>}
                {activeDoc.fileSize && <span>{formatBytes(activeDoc.fileSize)}</span>}
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${isProcessing ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {isProcessing ? 'Analyzing...' : 'Complete'}
          </span>
        </div>

        <div className="w-full bg-gray-100 dark:bg-zinc-800 h-0.5">
          <div className={`${isProcessing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'} h-0.5 w-full rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]`}></div>
        </div>

        {isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-zinc-900/20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-white dark:bg-zinc-900 rounded-3xl border border-indigo-500/30 flex items-center justify-center shadow-xl">
                <Sparkles className="w-12 h-12 text-indigo-500 animate-bounce" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 leading-tight">Neeti AI is hard at work</h3>
            <p className="text-[var(--text-dim)] dark:text-[var(--text-muted)] max-w-md mx-auto mb-8 font-medium">
              We're analyzing your document's content, extracting key points, and generating an executive summary just for you.
            </p>
            
            <div className="w-full max-w-xs space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                <span>{processingStatus || 'Initializing Analysis'}</span>
                <span className="animate-pulse">...</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full animate-[progress_2s_infinite_linear]"></div>
              </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes progress {
                0% { width: 0%; transform: translateX(-100%); }
                50% { width: 100%; transform: translateX(0%); }
                100% { width: 0%; transform: translateX(100%); }
              }
            ` }} />
          </div>
        ) : (
          <>
            <div className="p-4 md:p-5 flex-1 overflow-y-auto">
              <div className="max-w-none">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 tracking-tight">
                  <BookOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Executive Summary
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-[15px]">{activeDoc.summary}</p>

                <hr className="my-8 border-[var(--border-subtle)] dark:border-zinc-800" />

                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 tracking-tight">
                  <Clock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Key Points Extracted
                </h3>
                <ul className="space-y-3">
                  {activeDoc.keyPoints?.length > 0 ? (
                    activeDoc.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex gap-4 p-4 bg-[var(--bg-app)] dark:bg-zinc-950/50 rounded-xl border border-[var(--border-main)] dark:border-zinc-800/80 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors shadow-xs">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 shrink-0 font-mono mt-0.5">{idx + 1}.</span>
                        <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-[15px]">{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/80 text-[var(--text-dim)] text-sm">
                      No key points could be extracted from this document.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-subtle)] dark:border-zinc-800 flex flex-wrap gap-3 bg-[var(--bg-app)] dark:bg-zinc-900/50 shadow-sm">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Summary
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-[var(--border-main)] dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg hover:bg-[var(--bg-app)] dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {/* Ask AI Section */}
            <div className="border-t border-[var(--border-main)] dark:border-zinc-800 bg-[var(--bg-app)] dark:bg-zinc-950/50">
              <div className="px-5 py-3 border-b border-[var(--border-subtle)] dark:border-zinc-800/60 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">Ask AI about this document</span>
              </div>

              {askResponses.length > 0 && (
                <div className="px-5 py-4 max-h-60 overflow-y-auto space-y-4">
                  {askResponses.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[11px] text-[var(--text-dim)] mb-1 ml-1">{msg.role === 'user' ? 'You' : 'Neeti AI'}</span>
                      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm' : 'bg-white dark:bg-zinc-800 border border-[var(--border-main)] dark:border-zinc-700/50 text-zinc-800 dark:text-zinc-200 rounded-tl-sm shadow-sm'}`}>
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
                    className="w-full pl-4 pr-10 py-2 bg-white dark:bg-zinc-950 border border-[var(--border-main)] dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 placeholder-zinc-400 dark:placeholder-zinc-500"
                  />
                  <CornerDownRight className="w-4 h-4 text-[var(--text-muted)] dark:text-zinc-600 absolute right-4 top-1/2 -translate-y-1/2" />
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
          </>
        )}
      </div>
    ) : (
      historyListContent
    )
  );

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-full bg-[var(--bg-app)] dark:bg-zinc-950 pb-6 md:pb-10 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">

      {/* ── Top Header (Portaled to AppShell on Desktop) */}
      {headerNode && createPortal(
        <div className="flex items-center justify-between w-full h-full animate-in fade-in transition-colors duration-300">
          <div className="flex flex-col justify-center shrink-0">
            <h1 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight leading-none transition-colors duration-300">Document Summarizer</h1>
            <p className="text-[var(--text-dim)] dark:text-[var(--text-muted)] text-[10px] leading-none hidden md:block mt-1 transition-colors duration-300">Upload long documents for instant AI summaries.</p>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap shrink-0 scrollbar-hide ml-auto pl-4 min-w-0">
            {STEPS.map((s, idx) => {
              let statusClass = "text-[var(--text-muted)] dark:text-[var(--text-dim)] border-[var(--border-main)] dark:border-zinc-800 bg-[var(--bg-app)] dark:bg-zinc-900";
              let lineClass = "bg-gray-200 dark:bg-zinc-800";
              if (step > s.id) { statusClass = "text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10"; lineClass = "bg-indigo-300 dark:bg-indigo-500/50"; }
              else if (step === s.id) { statusClass = "text-indigo-600 dark:text-indigo-300 border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 font-medium"; }
              return (
                <div key={s.id} className="flex items-center shrink-0">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full border text-[10px] transition-all duration-300 ${statusClass}`}>
                    {step > s.id ? <CheckCircle className="w-3 h-3" /> : s.id}
                  </div>
                  <span className={`ml-1.5 text-[11px] whitespace-nowrap transition-colors duration-300 ${step === s.id ? 'text-indigo-600 dark:text-indigo-300 font-medium block' : 'text-[var(--text-muted)] dark:text-[var(--text-dim)] hidden lg:block'}`}>{s.label}</span>
                  {idx < STEPS.length - 1 && <div className={`w-3 lg:w-6 h-px mx-1 lg:mx-2 transition-colors duration-300 ${lineClass}`} />}
                </div>
              );
            })}
          </div>
        </div>,
        headerNode
      )}

      {/* ── Mobile Top Header (Visible only on small screens) */}
      <div className="md:hidden px-4 pt-4 pb-2 transition-colors duration-300">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight leading-none transition-colors duration-300">Document Summarizer</h1>
        <p className="text-[var(--text-dim)] dark:text-[var(--text-muted)] text-[11px] mt-1.5 transition-colors duration-300">Upload long documents for instant AI summaries.</p>
      </div>

      {/* ── Mobile 3-tab bar — only visible below lg breakpoint */}
      <div className="lg:hidden mt-3 mx-4 flex rounded-xl bg-white dark:bg-zinc-900 border border-[var(--border-main)] dark:border-zinc-800 p-1 gap-1 transition-colors duration-300 shadow-sm">
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
                  : 'text-[var(--text-dim)] dark:text-[var(--text-muted)] hover:text-zinc-900 dark:hover:text-zinc-200'
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

      {/* ── MOBILE CONTENT (below lg) — show only the active tab */}
      <div className="lg:hidden px-4 pt-4 pb-6 flex flex-col gap-4">
        {activeMobileTab === 'upload' && uploadPanelContent}
        {activeMobileTab === 'summary' && summaryPanelContent}
        {activeMobileTab === 'history' && historyListContent}
      </div>

      {/* ── DESKTOP CONTENT (lg and above) */}
      <div className="hidden lg:flex w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 lg:gap-8 flex-1 min-h-0">

        {/* LEFT COLUMN */}
        <div className="w-[35%] xl:w-1/3 flex flex-col gap-4 overflow-hidden">
          <div className="shrink-0">
            {uploadPanelContent}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {summaryPanelContent}
        </div>

      </div>
    </div>
  );
}