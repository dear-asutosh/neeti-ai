import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Trash2,
  Loader2,
  User,
  ChevronRight,
  AlertCircle,
  Plus,
  MessageSquare,
  History,
  Menu,
  X,
  Clock,
  Edit2,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  onSnapshot,
  addDoc,
  deleteDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { createPortal } from 'react-dom';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { StyledSwal } from '../utils/sweetalert';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export default function AIAssistant() {
  const { currentUser, dbUser } = useAuth();
  const displayPhoto = dbUser?.photoURL || currentUser?.photoURL;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [contextSnapshot, setContextSnapshot] = useState('');

  // History State
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const quickPrompts = [
    "What needs my attention today?",
    "Summarize my recent activity",
    "Draft a speech on infrastructure"
  ];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch context data
  useEffect(() => {
    if (!currentUser) return;

    const fetchContext = async () => {
      try {
        const uid = currentUser.uid;

        // 1. Documents & Meetings
        const docsQuery = query(collection(db, `users/${uid}/documents`), orderBy('createdAt', 'desc'), limit(10));
        const meetingsQuery = query(collection(db, `users/${uid}/meetings`), orderBy('createdAt', 'desc'), limit(10));

        // 2. Schedule Events (Upcoming)
        const now = Timestamp.now();
        const eventsQuery = query(
          collection(db, `users/${uid}/scheduleEvents`),
          where('startTime', '>=', now),
          orderBy('startTime', 'asc'),
          limit(5)
        );

        // 3. Fetch all in parallel
        const [docsSnap, meetingsSnap, eventsSnap] = await Promise.all([
          getDocs(docsQuery),
          getDocs(meetingsQuery),
          getDocs(eventsQuery)
        ]);

        const docTitles = docsSnap.docs.map(d => d.data().title).join(', ');
        const meetingTitles = meetingsSnap.docs.map(m => m.data().title).join(', ');
        const upcomingEvents = eventsSnap.docs.map(e => {
          const data = e.data();
          const date = data.startTime?.toDate()?.toLocaleDateString() || 'N/A';
          return `${data.title} (${data.category}) on ${date}`;
        }).join('; ');

        // 4. Complaints & Projects (Totals and Status)
        const [complaintsSnap, projectsSnap] = await Promise.all([
          getDocs(collection(db, `users/${uid}/complaints`)),
          getDocs(collection(db, `users/${uid}/projects`))
        ]);

        const totalComplaints = complaintsSnap.size;
        const pendingComplaints = complaintsSnap.docs.filter(d => ['pending', 'Pending'].includes(d.data().status)).length;

        const totalProjects = projectsSnap.size;
        const activeProjects = projectsSnap.docs.filter(d => ['active', 'Active', 'ongoing'].includes(d.data().status)).length;

        const snapshot = `
          **Recent Documents**: ${docTitles || 'None'}.
          **Recent Meetings**: ${meetingTitles || 'None'}.
          **Upcoming Schedule**: ${upcomingEvents || 'No upcoming events'}.
          **Constituency Complaints**: ${totalComplaints} total (${pendingComplaints} pending).
          **Active Projects**: ${activeProjects} out of ${totalProjects} total.
        `.trim();

        setContextSnapshot(snapshot);
      } catch (err) {
        console.error("Context fetch error:", err);
      }
    };

    fetchContext();
  }, [currentUser]);

  // Fetch Chat Threads List
  useEffect(() => {
    if (!currentUser) return;

    const threadsQuery = query(
      collection(db, `users/${currentUser.uid}/assistantChat`),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(threadsQuery, (snapshot) => {
      const threadsList = snapshot.docs
        .filter(doc => doc.id !== 'history') // Ignore legacy single-doc history
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      setThreads(threadsList);

      // Auto-select latest if none active
      if (threadsList.length > 0 && !activeThreadId && initialLoading) {
        // setActiveThreadId(threadsList[0].id); // Optional: auto-load latest
      }
      setInitialLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, activeThreadId, initialLoading]);

  useEffect(() => {
    if (!currentUser) return;

    if (!activeThreadId) {
      // Show welcome message for a new, empty chat
      setMessages([{
        role: 'assistant',
        content: "Welcome to Neeti AI Assistant. I have access to your workspace — your documents, meetings, schedule, constituency complaints, and projects. How can I help you today?",
        timestamp: Date.now()
      }]);
      return;
    }

    const threadDocRef = doc(db, `users/${currentUser.uid}/assistantChat`, activeThreadId);
    const unsubscribe = onSnapshot(threadDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setMessages(docSnap.data().messages || []);
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeThreadId]);

  const handleNewChat = () => {
    setActiveThreadId(null);
    setInput('');
    setIsSidebarOpen(false);
    setEditingThreadId(null);
  };

  const handleSend = async (content = input) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are Neeti AI Assistant, an advanced governance copilot built for public officials and administrators in India. You are professional, concise, helpful, and empathetic. 

CRITICAL: You have DIRECT access to the user's workspace data provided in the context below. If the user asks about their schedule, meetings, documents, complaints, or projects, use THIS specific data to answer. Do not guess or hallucinate.

WORKSPACE CONTEXT (Current Time: ${new Date().toLocaleString()}):
${contextSnapshot}

If the user asks for their upcoming schedule, refer to the "**Upcoming Schedule**" section in the context. If it says "No upcoming events", inform them accordingly.
Always prioritize providing actionable insights based on this context.`;

      const historyToSend = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const body = {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...historyToSend,
          { role: 'user', content: content.trim() }
        ],
        max_tokens: 1024
      };

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Groq API failure');

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: Date.now()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Save to Firestore
      let currentId = activeThreadId;
      if (!currentId) {
        // Create new thread
        const newThreadRef = await addDoc(collection(db, `users/${currentUser.uid}/assistantChat`), {
          title: content.trim().substring(0, 40) + (content.length > 40 ? '...' : ''),
          messages: finalMessages,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastMessage: assistantMessage.content.substring(0, 100)
        });
        setActiveThreadId(newThreadRef.id);
      } else {
        // Update existing
        const threadDocRef = doc(db, `users/${currentUser.uid}/assistantChat`, currentId);
        await updateDoc(threadDocRef, {
          messages: finalMessages,
          updatedAt: Timestamp.now(),
          lastMessage: assistantMessage.content.substring(0, 100)
        });
      }

    } catch (err) {
      console.error("Send error:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteThread = async (e, threadId) => {
    e.stopPropagation();
    if (!currentUser) return;

    const result = await StyledSwal.fire({
      title: 'Delete Chat?',
      text: "Are you sure you want to delete this conversation? This action cannot be undone.",
      icon: 'warning',
      iconColor: '#ef4444',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/assistantChat`, threadId));
      if (activeThreadId === threadId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Delete thread error:", err);
    }
  };

  const startRenaming = (e, thread) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title || 'Conversation');
  };

  const submitRename = async (e) => {
    if (e) e.stopPropagation();
    if (!currentUser || !editingThreadId || !editingTitle.trim()) {
      setEditingThreadId(null);
      return;
    }

    try {
      const threadDocRef = doc(db, `users/${currentUser.uid}/assistantChat`, editingThreadId);
      await updateDoc(threadDocRef, {
        title: editingTitle.trim(),
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error("Rename error:", err);
    } finally {
      setEditingThreadId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (initialLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 overflow-hidden relative transition-colors duration-300">

      {/* ── Sidebar (Desktop) / Drawer (Mobile) ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-900 transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-zinc-900">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">History</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-xl text-sm font-semibold transition-all active:scale-95 text-zinc-900 dark:text-white"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide pb-20">
            {threads.map(thread => (
              <div
                key={thread.id}
                onClick={() => { setActiveThreadId(thread.id); setIsSidebarOpen(false); }}
                className={`w-full text-left p-3 rounded-xl transition-all group relative flex gap-3 cursor-pointer ${activeThreadId === thread.id ? 'bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800' : 'hover:bg-gray-100/50 dark:hover:bg-zinc-900/50'
                  }`}
              >
                <div className="mt-1 shrink-0">
                  <MessageSquare className={`w-4 h-4 ${activeThreadId === thread.id ? 'text-blue-500' : 'text-zinc-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  {editingThreadId === thread.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        type="text"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onBlur={() => submitRename()}
                        onKeyDown={e => {
                          if (e.key === 'Enter') submitRename();
                          if (e.key === 'Escape') setEditingThreadId(null);
                        }}
                        className="flex-1 bg-zinc-800 border-none focus:ring-1 focus:ring-blue-500 rounded text-xs px-2 py-1 text-white"
                      />
                      <button onClick={submitRename} className="p-1 text-blue-500 hover:text-blue-400">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm font-medium truncate ${activeThreadId === thread.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {thread.title || 'Conversation'}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" /> {formatDate(thread.updatedAt)}
                      </p>
                    </>
                  )}
                </div>

                {editingThreadId !== thread.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startRenaming(e, thread)}
                      className="p-1 text-zinc-600 hover:text-blue-400"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => deleteThread(e, thread.id)}
                      className="p-1 text-zinc-600 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Main Chat Area ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-zinc-950">

        {/* Header (Title + Mobile Menu) */}
        <header className="h-14 border-b border-gray-200 dark:border-zinc-900 flex items-center justify-between px-4 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h1 className="text-sm font-bold tracking-tight">AI Assistant</h1>
              {activeThreadId && (
                <span className="hidden sm:inline text-[10px] bg-gray-100 dark:bg-zinc-900 text-zinc-500 border border-gray-200 dark:border-zinc-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-2">Active session</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-8 pb-10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 overflow-hidden shadow-lg ${msg.role === 'user' ? 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700' : 'bg-blue-900/20 border border-blue-800/30'
                  }`}>
                  {msg.role === 'user' ? (
                    displayPhoto ? <img src={displayPhoto} alt="U" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed transition-all duration-300 ${msg.role === 'user'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-200 border border-gray-200 dark:border-zinc-800/50 shadow-sm'
                  }`}>
                  <div className="markdown-style overflow-hidden">
                    <ReactMarkdown
                      components={{
                        p: ({ ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                        li: ({ ...props }) => <li {...props} />,
                        h1: ({ ...props }) => <h1 className="text-xl font-black mb-3 text-white" {...props} />,
                        h2: ({ ...props }) => <h2 className="text-lg font-black mb-3 text-white" {...props} />,
                        code: ({ inline, ...props }) => (
                          inline
                            ? <code className="bg-gray-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold" {...props} />
                            : <code className="block bg-gray-100 dark:bg-zinc-950 p-4 rounded-xl text-blue-600 dark:text-blue-400 overflow-x-auto my-4 text-sm font-mono border border-gray-200 dark:border-zinc-800/50" {...props} />
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-blue-800/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                </div>
                <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800/50 px-5 py-3.5 rounded-2xl flex items-center gap-2 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <footer className="shrink-0 p-4 md:p-6 bg-linear-to-t from-gray-50 dark:from-zinc-950 via-gray-50 dark:via-zinc-950 to-transparent">
          <div className="max-w-3xl mx-auto space-y-4">
            {!activeThreadId && messages.length <= 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 justify-center animate-in slide-in-from-bottom-2 duration-500">
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-4 py-2 bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-gray-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold rounded-full transition-all flex items-center gap-2 group shadow-sm"
                  >
                    {prompt}
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-transform" />
                  </button>
                ))}
              </div>
            )}

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
              <div className="relative flex items-end gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus-within:border-blue-500/50 dark:focus-within:border-zinc-700/50 p-2.5 rounded-2xl transition-all shadow-2xl">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Neeti AI Assistant anything..."
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-zinc-900 dark:text-zinc-100 text-[15px] py-2 px-3 resize-none max-h-48 min-h-12 scrollbar-hide placeholder:text-zinc-400 dark:placeholder:text-zinc-600 leading-relaxed"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={`p-3 rounded-xl transition-all duration-300 ${input.trim() && !isLoading
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95'
                      : 'bg-gray-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                    }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-600 text-center uppercase tracking-[0.2em] font-black">Neeti AI • Governance Copilot</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
