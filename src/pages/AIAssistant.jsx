import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Loader2, 
  User, 
  ChevronRight,
  AlertCircle
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
  setDoc, 
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';

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
  const [error, setError] = useState(null);
  
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
  }, [messages]);

  // Fetch context data and chat history
  useEffect(() => {
    if (!currentUser) return;

    const fetchAllData = async () => {
      try {
        setInitialLoading(true);
        setError(null);

        const uid = currentUser.uid;

        // 1. Documents
        const docsQuery = query(
          collection(db, `users/${uid}/documents`),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const docsSnap = await getDocs(docsQuery);
        const docTitles = docsSnap.docs.map(d => d.data().title).join(', ');

        // 2. Meetings
        const meetingsQuery = query(
          collection(db, `users/${uid}/meetings`),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const meetingsSnap = await getDocs(meetingsQuery);
        const meetingTitles = meetingsSnap.docs.map(m => m.data().title).join(', ');

        // 3. Schedule Events
        const now = Timestamp.now();
        const eventsQuery = query(
          collection(db, `users/${uid}/scheduleEvents`),
          where('startTime', '>=', now),
          orderBy('startTime', 'asc'),
          limit(5)
        );
        const eventsSnap = await getDocs(eventsQuery);
        const upcomingEvents = eventsSnap.docs.map(e => {
          const data = e.data();
          const date = data.startTime?.toDate()?.toLocaleDateString() || 'N/A';
          return `${data.title} (${data.category}) on ${date}`;
        }).join(', ');

        // 4. Complaints
        const complaintsSnap = await getDocs(collection(db, `users/${uid}/complaints`));
        const complaints = complaintsSnap.docs.map(d => d.data());
        const totalComplaints = complaints.length;
        const pendingComplaints = complaints.filter(c => c.status === 'pending' || c.status === 'Pending').length;
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved' || c.status === 'Resolved').length;
        const complaintCategories = [...new Set(complaints.map(c => c.category))].slice(0, 5).join(', ');

        // 5. Projects
        const projectsSnap = await getDocs(collection(db, `users/${uid}/projects`));
        const projects = projectsSnap.docs.map(d => d.data());
        const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'Active' || p.status === 'ongoing').length;
        const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'Completed').length;

        const snapshot = `Documents summarized recently: [${docTitles || 'None'}]. Meetings analyzed: [${meetingTitles || 'None'}]. Upcoming events: [${upcomingEvents || 'None'}]. Constituency complaints: ${totalComplaints} total, ${pendingComplaints} pending, ${resolvedComplaints} resolved. Top complaint categories: [${complaintCategories || 'None'}]. Projects: ${activeProjects} active, ${completedProjects} completed.`;
        
        setContextSnapshot(snapshot);

        // Load Chat History
        const historyDocRef = doc(db, `users/${uid}/assistantChat/history`);
        const unsubscribe = onSnapshot(historyDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const hData = docSnap.data();
            setMessages(hData.messages || []);
          } else {
            // First time user - add proactive message
            const welcomeMsg = {
              role: 'assistant',
              content: "Welcome to Neeti AI Assistant. I have access to your workspace — your documents, meetings, schedule, constituency complaints, and projects. How can I help you today? You can ask me to summarize your week, draft a speech, or tell you what needs your attention.",
              timestamp: Date.now()
            };
            setMessages([welcomeMsg]);
            setDoc(historyDocRef, { messages: [welcomeMsg] });
          }
          setInitialLoading(false);
        }, (err) => {
          console.error("History fetch error:", err);
          setInitialLoading(false);
        });

        return unsubscribe;

      } catch (err) {
        console.error("Context fetch error:", err);
        setError("Subtle warning: Context data could not be fully loaded. Performance may be degraded.");
        setInitialLoading(false);
      }
    };

    fetchAllData();
  }, [currentUser]);

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
      const systemPrompt = `You are Neeti AI Assistant, an intelligent governance copilot built for public officials and administrators in India. You are professional, concise, helpful, and empathetic. You never make up data — if something is not in the provided context, say so honestly. Always end your responses with a suggested next action when relevant.

Here is the current workspace context for the official you are assisting:
${contextSnapshot}

You can help with: answering questions about their data, drafting speeches and official content, suggesting actions based on pending work, and answering general governance and policy questions.`;

      // Only send last 10 messages + user message
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
      const historyDocRef = doc(db, `users/${currentUser.uid}/assistantChat/history`);
      await setDoc(historyDocRef, { messages: finalMessages }, { merge: true });

    } catch (err) {
      console.error("Send error:", err);
      const errorMsg = {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!currentUser) return;
    try {
      const historyDocRef = doc(db, `users/${currentUser.uid}/assistantChat/history`);
      await deleteDoc(historyDocRef);
      // setMessages will be updated via onSnapshot
    } catch (err) {
      console.error("Clear chat error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-sans relative">
      {/* Absolute Clear Chat Button */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={clearChat}
          title="Clear Chat History"
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-all border border-zinc-900 hover:border-red-900/30 bg-zinc-950/50 backdrop-blur-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 scrollbar-hide">
        {error && (
          <div className="mx-auto max-w-2xl bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg flex items-center gap-3 text-amber-500 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 overflow-hidden ${
                msg.role === 'user' ? 'bg-zinc-700 border border-zinc-600' : 'bg-blue-900/20 border border-blue-800/30'
              }`}>
                {msg.role === 'user' ? (
                  displayPhoto ? (
                    <img src={displayPhoto} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-zinc-300" />
                  )
                ) : (
                  <Sparkles className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-zinc-700 text-zinc-100' 
                  : 'bg-zinc-800/60 text-zinc-200 border border-zinc-800/50'
              }`}>
                <div className="markdown-style">
                  <ReactMarkdown
                    components={{
                      p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                      ol: ({...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                      li: ({...props}) => <li className="mb-1" {...props} />,
                      h1: ({...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                      h2: ({...props}) => <h2 className="text-md font-bold mb-2" {...props} />,
                      code: ({inline, ...props}) => (
                        inline 
                          ? <code className="bg-zinc-900 px-1 rounded text-blue-300" {...props} />
                          : <code className="block bg-zinc-900 p-2 rounded text-blue-300 overflow-x-auto my-2" {...props} />
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
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-blue-800/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div className="bg-zinc-800/60 border border-zinc-800/50 px-4 py-3 rounded-2xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
      <footer className="shrink-0 pb-6 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Quick Prompts */}
          {messages.length <= 1 && !isLoading && (
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-full transition-all flex items-center gap-2 group"
                >
                  {prompt}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="relative group">
            <div className={`absolute -inset-0.5 bg-linear-to-r from-blue-900/50 to-purple-900/50 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500`}></div>
            <div className="relative flex items-end gap-2 bg-zinc-900 border border-zinc-800 focus-within:border-zinc-700/50 p-2 rounded-2xl transition-all shadow-xl">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Neeti AI Assistant anything..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-zinc-100 text-[15px] py-1 px-3 resize-none max-h-32 min-h-11 scrollbar-hide placeholder:text-zinc-600"
                style={{ height: 'auto' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`p-2 rounded-xl transition-all ${
                  input.trim() && !isLoading 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95' 
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 text-center uppercase tracking-widest font-medium">Neeti AI can provide context-aware insights from your workspace.</p>
        </div>
      </footer>
    </div>
  );
}
