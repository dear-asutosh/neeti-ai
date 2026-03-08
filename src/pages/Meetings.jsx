import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  UploadCloud, FileText, CheckCircle, Clock, Save, FileAudio, 
  Mic, Square, BookOpen, History, Pencil, Check, File, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';

const STEPS = [
  { id: 1, label: 'Record/Upload' },
  { id: 2, label: 'Transcribing' },
  { id: 3, label: 'Analyzing' },
  { id: 4, label: 'Results' }
];

const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB API limit safety

export default function Meetings() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const { currentUser } = useAuth();

  // Tabs: 'live' or 'upload'
  const [activeTab, setActiveTab] = useState('live');

  // ── NEW: Mobile top-level tab: 'record' | 'summary' | 'history'
  const [activeMobileTab, setActiveMobileTab] = useState('record');

  // Step / UI Flow
  const [step, setStep] = useState(1);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Realtime Lists
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);

  // File Upload state
  const fileInputRef = useRef(null);

  // LIVE Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const allChunksRef = useRef([]); // holds original blobs
  const timerIntervalRef = useRef(null);       // holds original blobs for final audio download const timerIntervalRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const isStartingRef = useRef(false);
  const [liveAudioBlobUrl, setLiveAudioBlobUrl] = useState(null);

  // Ask AI States
  const [askQuery, setAskQuery] = useState('');
  const [askResponses, setAskResponses] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [fullText, setFullText] = useState('');

  // Manual Context Overrides
  const [manualAttendees, setManualAttendees] = useState('');
  const [manualAgenda, setManualAgenda] = useState('');

  // Title Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');

  const [headerNode, setHeaderNode] = useState(null);
  useEffect(() => {
    setHeaderNode(document.getElementById('page-header-content'));
  }, []);

  // --------------------------------------------------------------------------
  // LISTENER FOR FIREBASE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'users', currentUser.uid, 'meetings'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentMeetings(docs);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Cleanup blob urls on unmount
  useEffect(() => {
    return () => {
      if (liveAudioBlobUrl) URL.revokeObjectURL(liveAudioBlobUrl);
    };
  }, [liveAudioBlobUrl]);

  // Cleanup recording intervals on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Keep recordingTimeRef in sync so onstop can read the latest value
  useEffect(() => {
    recordingTimeRef.current = recordingTime;
  }, [recordingTime]);

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDbTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDbDate = (timestamp) => {
    if (!timestamp) return 'Today';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // --------------------------------------------------------------------------
  // CORE: TRANSCRIBE A SINGLE AUDIO CHUNK
  // --------------------------------------------------------------------------
  const transcribeChunk = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-large-v3-turbo");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Whisper API Error:", err);
      throw new Error(err?.error?.message || "Transcription failed");
    }

    const data = await response.json();
    return data.text || "";
  };

  // --------------------------------------------------------------------------
  // CORE: LLAMA ANALYSIS
  // --------------------------------------------------------------------------
  const analyzeTranscript = async (transcriptText) => {
    setStep(3);
    setProcessingStatus('Analyzing transcript with AI...');
    setFullText(transcriptText);

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
            content: `You are an AI assistant for government officials analyzing meeting transcripts.
You MUST respond with ONLY a valid JSON object — no explanation, no markdown, no backticks.
The JSON must have exactly this shape:
{
  "summary": "3-4 sentence paragraph summarizing what the meeting was about",
  "actionItems": [
    "Person or team: specific task assigned with deadline if mentioned"
  ],
  "attendees": [
    "Name or role mentioned in the meeting"
  ],
  "decisions": [
    "A specific decision that was made during the meeting"
  ]
}
If no action items, attendees, or decisions are found, return empty arrays.
Do not include any text before or after the JSON.
${manualAttendees.trim() ? `\nKNOWN ATTENDEES (ensure these are included if relevant): ${manualAttendees}` : ''}
${manualAgenda.trim() ? `\nMEETING AGENDA/CONTEXT (use this to help guide your summary): ${manualAgenda}` : ''}`
          },
          { role: 'user', content: transcriptText.substring(0, 80000) }
        ],
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Analysis Error ${response.status}: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;

    let parsed;
    try {
      const cleaned = rawContent.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { summary: rawContent.trim(), actionItems: [], attendees: [], decisions: [] };
    }

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'No summary generated.',
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      attendees: Array.isArray(parsed.attendees) ? parsed.attendees : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : []
    };
  };

  // --------------------------------------------------------------------------
  // TAB 1: LIVE RECORDING LOGIC — FIXED
  // --------------------------------------------------------------------------
  const startRecording = async () => {
    if (isRecording || isStartingRef.current) return;
    isStartingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      allChunksRef.current = [];
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setStep(1);
      setIsProcessing(false);
      setLiveAudioBlobUrl(null);
      setAskResponses([]);
      setManualAttendees('');
      setManualAgenda('');

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          allChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        processFinalRecording();
      };

      mediaRecorder.start(1000); // record continuously
      setIsRecording(true);
      isStartingRef.current = false;

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      isStartingRef.current = false;
      alert("Microphone access denied.");
      console.error(err);
    }
  };

  // Stop recording safely
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // FIX: requestData before stop ensures the last partial chunk is flushed
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
      }
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(timerIntervalRef.current);
    setIsRecording(false);
  };

  // Cancel recording and discard data
  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Nullify the onstop handler so processFinalRecording is NOT called!
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    allChunksRef.current = [];
    
    // Reset state but don't process
    setStep(1);
    setIsProcessing(false);
    setLiveAudioBlobUrl(null);
  };

  const processFinalRecording = async () => {
    setStep(2);
    setProcessingStatus("Transcribing audio...");

    try {
      const finalAudioBlob = new Blob(allChunksRef.current, { type: "audio/webm" });

      const url = URL.createObjectURL(finalAudioBlob);
      setLiveAudioBlobUrl(url);

      const finalTranscript = await transcribeChunk(finalAudioBlob);

      if (!finalTranscript || finalTranscript.trim() === "") {
        throw new Error("No speech detected.");
      }

      const analysis = await analyzeTranscript(finalTranscript);

      setProcessingStatus("Saving to database...");

      const meetingData = {
        title: `Meeting — ${new Date().toLocaleDateString([], {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })}, ${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}`,
        transcript: finalTranscript,
        textContext: finalTranscript.substring(0, 80000),
        duration: recordingTimeRef.current,
        inputType: "live",
        createdAt: new Date(),
        summary: analysis.summary,
        actionItems: analysis.actionItems,
        attendees: analysis.attendees,
        decisions: analysis.decisions
      };

      const docRef = await addDoc(
        collection(db, "users", currentUser.uid, "meetings"),
        meetingData
      );

      setActiveMeeting({
        id: docRef.id,
        ...meetingData,
        createdAt: new Date()
      });

      setStep(4);
      // ── AUTO-SWITCH to Summary tab on mobile when result is ready
      setActiveMobileTab('summary');

    } catch (err) {
      alert(err.message || "Failed to process meeting recording.");
      setStep(1);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };


  // --------------------------------------------------------------------------
  // TAB 2: FILE UPLOAD LOGIC
  // --------------------------------------------------------------------------
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const processUpload = async (file) => {
    setIsProcessing(true);
    setStep(2);
    setAskResponses([]);
    setLiveAudioBlobUrl(null);
    setManualAttendees('');
    setManualAgenda('');

    try {
      let fullTranscript = '';

      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        setProcessingStatus(`Transcribing chunk ${i + 1} of ${totalChunks}...`);
        const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkBlob = new Blob([chunk], { type: file.type });
        const text = await transcribeChunk(chunkBlob);
        fullTranscript += text + ' ';
      }

      fullTranscript = fullTranscript.trim();
      if (!fullTranscript) {
        throw new Error("No speech detected or format unsupported.");
      }

      const analysis = await analyzeTranscript(fullTranscript);

      setProcessingStatus('Saving to database...');
      const meetingData = {
        title: `Uploaded — ${file.name}`,
        transcript: fullTranscript,
        textContext: fullTranscript.substring(0, 80000),
        duration: null,
        inputType: 'upload',
        createdAt: new Date(),
        summary: analysis.summary,
        actionItems: analysis.actionItems,
        attendees: analysis.attendees,
        decisions: analysis.decisions
      };

      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'meetings'), meetingData);
      setActiveMeeting({ id: docRef.id, ...meetingData, createdAt: new Date() });
      setStep(4);
      // ── AUTO-SWITCH to Summary tab on mobile when result is ready
      setActiveMobileTab('summary');

    } catch (err) {
      alert(err.message || 'An error occurred during file upload processing.');
      setStep(1);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };


  // --------------------------------------------------------------------------
  // COMMON UI HANDLERS
  // --------------------------------------------------------------------------
  const handleSelectMeeting = (d) => {
    setActiveMeeting(d);
    setStep(4);
    setAskResponses([]);
    setFullText(d.textContext || d.transcript || '');
    setLiveAudioBlobUrl(null);
    setIsEditingTitle(false);
    // ── When user taps a past meeting from History, jump to Summary tab
    setActiveMobileTab('summary');
  };

  const handleRename = async () => {
    if (!editTitleValue.trim() || editTitleValue === activeMeeting.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const meetingRef = doc(db, 'users', currentUser.uid, 'meetings', activeMeeting.id);
      await updateDoc(meetingRef, { title: editTitleValue.trim() });
      setActiveMeeting(prev => ({...prev, title: editTitleValue.trim()}));
      setIsEditingTitle(false);
    } catch (err) {
      console.error(err);
      alert("Failed to rename meeting");
    }
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
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant analyzing this meeting transcript context:\n${fullText.substring(0, 80000)}\n\nAnswer the user's question concisely based ONLY on the provided context.`
            },
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
      setAskResponses(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while analyzing the transcript.' }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!activeMeeting || !activeMeeting.transcript) return;
    const blob = new Blob([activeMeeting.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeMeeting.title.replace(/[^a-z0-9]/gi, '_')}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!activeMeeting) return;
    let txt = `${activeMeeting.title}\n\nSummary:\n${activeMeeting.summary}\n`;
    if (activeMeeting.actionItems?.length) {
      txt += `\nAction Items:\n` + activeMeeting.actionItems.map(i => `- ${i}`).join('\n');
    }
    navigator.clipboard.writeText(txt);
    alert('Summary copied to clipboard!');
  };

  // --------------------------------------------------------------------------
  // SHARED UI BLOCKS — extracted so both mobile & desktop can reuse them
  // --------------------------------------------------------------------------

  // The record / upload input card
  const RecordPanel = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Live / Upload sub-tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/50">
        <button
          onClick={() => !isProcessing && setActiveTab('live')}
          className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'live' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isProcessing}
        >
          <Mic className="w-4 h-4 inline-block mr-2 -mt-0.5" /> Live Recording
        </button>
        <button
          onClick={() => !isProcessing && setActiveTab('upload')}
          className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'upload' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isProcessing}
        >
          <FileAudio className="w-4 h-4 inline-block mr-2 -mt-0.5" /> Upload File
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 md:p-5 flex flex-col items-center justify-center min-h-[250px] relative">
        {isProcessing && activeTab === 'live' ? (
          <>
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">{processingStatus}</h3>
            <p className="text-xs text-zinc-400 text-center">Processing transcript against LLaMA...</p>
          </>
        ) : activeTab === 'live' ? (
          <>
            <div className="relative flex items-center justify-center">
              {isRecording && (
                <button
                  onClick={cancelRecording}
                  className="absolute -left-16 sm:-left-20 w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all shadow-md border border-zinc-700 animate-in fade-in zoom-in"
                  title="Cancel Recording"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${isRecording ? 'bg-red-500/10 border-2 border-red-500 text-red-500' : 'bg-zinc-800/80 border border-zinc-700 hover:border-indigo-500/50 hover:bg-zinc-800 text-zinc-300'} z-10`}
              >
                {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-10 h-10" />}
                {isRecording && <span className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-75"></span>}
              </button>
            </div>

            <div className="mt-6 text-center">
              <div className="text-3xl font-mono font-medium text-white mb-1">
                {formatTime(recordingTime)}
              </div>
              <div className="text-sm font-medium text-zinc-400">
                {isRecording ? <span className="text-red-400 animate-pulse flex justify-center items-center gap-2">● Recording...</span> : 'Ready to record'}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className={`w-full rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition-colors ${isProcessing ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-zinc-700 hover:border-indigo-500/50 hover:bg-zinc-900'}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
              ) : (
                <FileAudio className="w-10 h-10 text-zinc-500 mb-3" />
              )}

              <h3 className="text-[15px] font-medium text-white mb-1">
                {isProcessing ? processingStatus : 'Drop audio/video file here'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isProcessing ? 'Analyzing with AI...' : 'Supports MP3, MP4, WEBM, WAV etc.'}
              </p>

              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="audio/*,video/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) processUpload(e.target.files[0]);
                }}
              />

              {!isProcessing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-sm"
                >
                  Browse Files
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Optional Context Inputs */}
      {!isProcessing && (
        <div className="px-6 pb-6 pt-2 bg-zinc-900 flex flex-col gap-4 border-t border-zinc-800/50 mt-2">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
              Expected Attendees (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. John, Sarah, Marketing Team"
              value={manualAttendees}
              onChange={(e) => setManualAttendees(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
              Agenda / Key Context (Optional)
            </label>
            <textarea
              placeholder="What is this meeting about? Any specific decisions to track?"
              value={manualAgenda}
              onChange={(e) => setManualAgenda(e.target.value)}
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );

  // Helper: renders the list of recent meetings (previously HistoryPanel)
  const HistoryList = () => (
    <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Meetings History</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {recentMeetings.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500 flex flex-col items-center justify-center min-h-[50vh] lg:min-h-full">
            <History className="w-10 h-10 text-zinc-700 mb-3" />
            <p>No recent meetings found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentMeetings.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-zinc-950/50 border border-zinc-800/60 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col"
                onClick={() => handleSelectMeeting(doc)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors border border-zinc-700/50">
                    <Mic className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors ${activeMeeting?.id === doc.id ? 'text-indigo-400' : 'text-zinc-200'}`}>
                      {doc.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-medium text-zinc-500">
                      {doc.duration != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(doc.duration)}</span>}
                      <span>{formatDbDate(doc.createdAt)}</span>
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

  // The results / summary panel
  const SummaryPanel = () => (
    activeMeeting ? (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">

        {/* Header */}
        <div className="px-5 py-4 md:p-6 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50">
          <div className="flex items-center gap-4 flex-1 overflow-hidden w-full">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="overflow-hidden flex-1 w-full">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={e => setEditTitleValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    autoFocus
                    className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1 flex-1 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleRename}
                    className="p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 rounded-lg transition-colors border border-indigo-500/30"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer max-w-[200px] sm:max-w-xs md:max-w-sm" onClick={() => {
                  setEditTitleValue(activeMeeting.title);
                  setIsEditingTitle(true);
                }}>
                  <h2 className="text-lg font-semibold text-white truncate" title={activeMeeting.title}>
                    {activeMeeting.title}
                  </h2>
                  <Pencil className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1.5 flex-wrap">
                {activeMeeting.inputType === 'live' && <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase text-zinc-300">Live Recording</span>}
                {activeMeeting.inputType === 'upload' && <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase text-zinc-300">File Upload</span>}
                {activeMeeting.duration != null && <span>· {formatTime(activeMeeting.duration)}</span>}
                <span>· {formatDbTime(activeMeeting.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-zinc-800 h-0.5">
          <div className="bg-emerald-500 h-0.5 w-full rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>

        {/* Scrollable Results Body */}
        <div className="p-4 md:p-5 flex-1 overflow-y-auto bg-zinc-950/20">
          <div className="max-w-none space-y-8">

            {/* Summary */}
            <section>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Executive Summary
              </h3>
              <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-xl">
                <p className="text-zinc-300 leading-relaxed text-[15px]">
                  {activeMeeting.summary}
                </p>
              </div>
            </section>

            {/* Action Items */}
            <section>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Action Items
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeMeeting.actionItems?.length > 0 ? (
                  activeMeeting.actionItems.map((item, idx) => (
                    <li key={idx} className="flex gap-3 p-4 bg-zinc-900 border border-zinc-800/80 rounded-xl hover:border-zinc-700 transition-colors">
                      <div className="w-5 h-5 rounded border border-zinc-600 flex items-center justify-center shrink-0 mt-0.5 bg-zinc-800 text-zinc-500">
                      </div>
                      <span className="text-zinc-300 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="p-4 bg-zinc-900 border border-zinc-800/80 rounded-xl text-zinc-500 text-sm col-span-2">
                    No clear action items identified.
                  </li>
                )}
              </ul>
            </section>

            {/* Decisions & Attendees Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Decisions */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                  Key Decisions
                </h3>
                <ul className="space-y-2">
                  {activeMeeting.decisions?.length > 0 ? (
                    activeMeeting.decisions.map((dec, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <span className="text-indigo-400 font-mono font-bold">{idx + 1}.</span>
                        <span className="text-zinc-300">{dec}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-zinc-500 text-sm">No specific decisions captured.</li>
                  )}
                </ul>
              </section>

              {/* Attendees */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Attendees Mentioned
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeMeeting.attendees?.length > 0 ? (
                    activeMeeting.attendees.map((att, idx) => (
                      <span key={idx} className="bg-zinc-800/80 border border-zinc-700 text-zinc-300 px-3 py-1 rounded-full text-xs font-medium">
                        {att}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-500 text-sm">No specific attendees mentioned by name.</span>
                  )}
                </div>
              </section>
            </div>

          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="p-4 border-t border-zinc-800 flex flex-wrap gap-3 bg-zinc-900">
          {liveAudioBlobUrl && activeMeeting.inputType === 'live' && (
            <a
              href={liveAudioBlobUrl}
              download={`meeting-${activeMeeting.id}.webm`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Audio
            </a>
          )}

          {activeMeeting.transcript && (
            <button
              onClick={handleDownloadTranscript}
              className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-lg hover:bg-zinc-700 hover:text-white transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Transcript
            </button>
          )}

          <button
            onClick={handleCopySummary}
            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 border border-indigo-500/50 text-white text-xs font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-sm ml-auto"
          >
            <Share2 className="w-3.5 h-3.5" />
            Copy Summary
          </button>
        </div>

        {/* Ask AI Section */}
        <div className="border-t border-zinc-800 bg-zinc-950/50">
          <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-[13px] font-medium text-zinc-300 uppercase tracking-widest">Ask AI about this meeting</span>
          </div>

          {askResponses.length > 0 && (
            <div className="px-5 py-4 max-h-60 overflow-y-auto space-y-4">
              {askResponses.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] text-zinc-500 mb-1 ml-1">{msg.role === 'user' ? 'You' : 'Neeti AI'}</span>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm' : 'bg-zinc-800 border border-zinc-700/50 text-zinc-200 rounded-tl-sm shadow-sm'}`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                          li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                          h1: ({ children }) => <h1 className="text-base font-bold text-white mb-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold text-white mb-1">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold text-zinc-200 mb-1">{children}</h3>,
                          code: ({ children }) => <code className="bg-zinc-900 text-indigo-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex flex-col items-start">
                  <span className="text-[11px] text-zinc-500 mb-1 ml-1">Neeti AI</span>
                  <div className="bg-zinc-800 border border-zinc-700/50 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-sm text-zinc-400">Analyzing...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleAskAI} className="p-4 flex gap-3 bg-zinc-900 border-t border-zinc-800/60">
            <div className="relative flex-1">
              <input
                type="text"
                value={askQuery}
                onChange={e => setAskQuery(e.target.value)}
                placeholder={fullText ? "Ask any follow-up question..." : "No transcript context available"}
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
              <Send className="w-4 h-4" />
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
    <div className="flex flex-col min-h-full bg-zinc-950 pb-6 md:pb-10 text-zinc-100 font-sans">

      {/* ── Top Header (Portaled to AppShell on Desktop) */}
      {headerNode && createPortal(
        <div className="flex items-center justify-between w-full h-full animate-in fade-in">
          <div className="flex flex-col justify-center shrink-0">
            <h1 className="text-base font-bold text-white tracking-tight leading-none">Meeting Summarizer</h1>
            <p className="text-zinc-400 text-[10px] leading-none hidden md:block mt-1">Transcribe & analyze meetings instantly with Whisper & LLaMA AI.</p>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap shrink-0 scrollbar-hide ml-auto pl-4 min-w-0">
            {STEPS.map((s, idx) => {
              let statusClass = "text-zinc-500 border-zinc-800 bg-zinc-900";
              let lineClass = "bg-zinc-800";
              if (step > s.id) { statusClass = "text-indigo-400 border-indigo-500/30 bg-indigo-500/10"; lineClass = "bg-indigo-500/50"; }
              else if (step === s.id) { statusClass = "text-indigo-300 border-indigo-500 bg-indigo-500/20 font-medium"; }
              return (
                <div key={s.id} className="flex items-center shrink-0">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full border text-[10px] transition-colors ${statusClass}`}>
                    {step > s.id ? <CheckCircle className="w-3 h-3" /> : s.id}
                  </div>
                  <span className={`ml-1.5 text-[11px] whitespace-nowrap ${step === s.id ? 'text-indigo-300 font-medium block' : 'text-zinc-500 hidden lg:block'}`}>{s.label}</span>
                  {idx < STEPS.length - 1 && <div className={`w-3 lg:w-6 h-px mx-1 lg:mx-2 ${lineClass}`} />}
                </div>
              );
            })}
          </div>
        </div>,
        headerNode
      )}

      {/* ── Mobile Top Header (Visible only on small screens) */}
      <div className="md:hidden px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-white tracking-tight leading-none">Meeting Summarizer</h1>
        <p className="text-zinc-400 text-[11px] mt-1.5">Transcribe & analyze meetings instantly with Whisper & LLaMA AI.</p>
      </div>

      {/* ── Mobile 3-tab bar — only visible below lg breakpoint */}
      <div className="lg:hidden mt-3 mx-4 flex rounded-xl bg-zinc-900 border border-zinc-800 p-1 gap-1">
          {[
            { key: 'record',  label: 'Record',  icon: <Mic      className="w-4 h-4" /> },
            { key: 'summary', label: 'Summary', icon: <BookOpen className="w-4 h-4" /> },
            { key: 'history', label: 'History', icon: <History  className="w-4 h-4" /> },
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
              {/* Green dot on Summary tab when a result exists but user is elsewhere */}
              {tab.key === 'summary' && activeMeeting && activeMobileTab !== 'summary' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
              )}
            </button>
          ))}
        </div>

      {/* ── MOBILE CONTENT — only one tab visible at a time */}
      <div className="lg:hidden px-4 pt-4 pb-6 flex flex-col gap-4">
        {activeMobileTab === 'record'  && <RecordPanel />}
        {activeMobileTab === 'summary' && <SummaryPanel />}
        {activeMobileTab === 'history' && <HistoryList />}
      </div>

      {/* ── DESKTOP CONTENT */}
      <div className="hidden lg:flex w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 lg:gap-8 flex-1 min-h-0">

        {/* LEFT COLUMN: RecordPanel only */}
        <div className="w-[35%] xl:w-1/3 flex flex-col gap-4 overflow-hidden">
          <div className="shrink-0">
            <RecordPanel />
          </div>
        </div>

        {/* RIGHT COLUMN: full height, SummaryPanel or History List */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <SummaryPanel />
        </div>

      </div>
    </div>
  );
}