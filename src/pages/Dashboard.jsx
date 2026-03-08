import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  FileText, 
  Mic, 
  ImageIcon, 
  Map, 
  TrendingUp, 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronRight,
  Activity,
  CheckCircle2,
  Users
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser, userRole, dbUser } = useAuth();
  const navigate = useNavigate();

  const [docCount, setDocCount] = useState(0);
  const [meetingCount, setMeetingCount] = useState(0);
  const [constituentCount, setConstituentCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Listen to Documents
    const qDocs = query(collection(db, 'users', currentUser.uid, 'documents'), orderBy('createdAt', 'desc'), limit(5));
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      setDocCount(snap.size); // Basic count of recent/all if we don't use Server count, but for simplicity we rely on snap size for now, or just get full count.
    });

    // Listen to Meetings
    const qMeetings = query(collection(db, 'users', currentUser.uid, 'meetings'), orderBy('createdAt', 'desc'), limit(5));
    const unsubMeetings = onSnapshot(qMeetings, (snap) => {
      setMeetingCount(snap.size);
    });
    
    // Listen to Constituents (Assuming this collection might exist later)
    const qConst = query(collection(db, 'users', currentUser.uid, 'constituents'), limit(5));
    const unsubConst = onSnapshot(qConst, (snap) => {
      setConstituentCount(snap.size);
    });

    return () => {
      unsubDocs();
      unsubMeetings();
      unsubConst();
    };
  }, [currentUser]);

  // Combine recent activity
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    let docsData = [];
    let meetingsData = [];

    const formatTimeAgo = (date) => {
      if (!date) return 'Just now';
      const seconds = Math.floor((new Date() - date) / 1000);
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return interval + " years ago";
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return interval + " months ago";
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return interval + " days ago";
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return interval + " hours ago";
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return interval + " minutes ago";
      return Math.floor(seconds) + " seconds ago";
    };

    const qDocs = query(collection(db, 'users', currentUser.uid, 'documents'), orderBy('createdAt', 'desc'), limit(3));
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      docsData = snap.docs.map(doc => {
        const data = doc.data();
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        return {
          id: doc.id,
          title: `Summarized "${data.filename || 'Document'}"`,
          time: formatTimeAgo(date),
          timestamp: date.getTime(),
          icon: FileText,
          status: 'completed'
        };
      });
      updateActivity();
    });

    const qMeetings = query(collection(db, 'users', currentUser.uid, 'meetings'), orderBy('createdAt', 'desc'), limit(3));
    const unsubMeetings = onSnapshot(qMeetings, (snap) => {
      meetingsData = snap.docs.map(doc => {
        const data = doc.data();
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        return {
          id: doc.id,
          title: `Analyzed "${data.title || 'Meeting'}"`,
          time: formatTimeAgo(date),
          timestamp: date.getTime(),
          icon: Mic,
          status: 'completed'
        };
      });
      updateActivity();
    });

    const updateActivity = () => {
      const combined = [...docsData, ...meetingsData];
      combined.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(combined.slice(0, 4));
    };

    return () => {
      unsubDocs();
      unsubMeetings();
    };
  }, [currentUser]);

  // Real Data mapping
  const stats = [
    { label: 'Documents Summarized', value: docCount.toString(), change: 'Live', icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Meetings Analyzed', value: meetingCount.toString(), change: 'Live', icon: Mic, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Active Constituents', value: constituentCount.toString(), change: 'Live', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const quickActions = [
    { name: 'Document Summarizer', desc: 'Extract insights from PDFs & Docs', icon: FileText, path: '/documents', color: 'group-hover:text-indigo-400' },
    { name: 'Meeting Summarizer', desc: 'Transcribe & analyze audio', icon: Mic, path: '/meetings', color: 'group-hover:text-emerald-400' },
    { name: 'Speech & Drafts', desc: 'Generate speeches with AI', icon: ImageIcon, path: '/speeches', color: 'group-hover:text-amber-400' },
    { name: 'Constituency Tracker', desc: 'Monitor regional insights', icon: Map, path: '/constituency', color: 'group-hover:text-rose-400' },
  ];

  const displayName = dbUser?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Leader';
  const roleDisplay = dbUser?.department || userRole || 'Administrator';

  // Format current date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100 p-4 md:p-2 lg:p-4 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        {/* 1. Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-zinc-900/5 to-zinc-900/80 z-0"></div>
          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs font-medium tracking-wide text-zinc-300 uppercase shadow-sm">
                  {today}
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium tracking-wide text-indigo-400 capitalize shadow-sm">
                  {roleDisplay}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">
                Good morning, {displayName}.
              </h1>
              <p className="text-zinc-400 text-base md:text-lg max-w-xl leading-relaxed">
                Your AI-powered public service command center is ready. Here is a brief overview of your operations today.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Main Left Column (Stats + Quick Actions) */}
          <div className="md:col-span-8 space-y-6 lg:space-y-8">
            
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 shadow-sm hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                      <TrendingUp className="w-3 h-3" /> {stat.change}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</h3>
                  <p className="text-sm text-zinc-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-zinc-800/80 transition-colors shadow-sm">
                      <action.icon className={`w-6 h-6 text-zinc-400 transition-colors ${action.color}`} />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-100 mb-1 tracking-tight">{action.name}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Recent Activity + Mini Schedule) */}
          <div className="md:col-span-4 space-y-6 lg:space-y-8">
            
            {/* Recent Activity List */}
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-sm h-full max-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  Recent Activity
                </h2>
                <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">View All</button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, i) => (
                    <div key={activity.id} className="flex gap-4 relative group cursor-default">
                      {/* Timeline line */}
                      {i !== recentActivity.length - 1 && (
                        <div className="absolute top-8 left-[19px] w-px h-[calc(100%-12px)] bg-zinc-800 group-hover:bg-zinc-700 transition-colors"></div>
                      )}
                      <div className="relative shrink-0 w-10 h-10 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center z-10 group-hover:border-zinc-700 transition-colors">
                        <activity.icon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      </div>
                      <div className="flex flex-col pt-1">
                        <p className="text-[14px] font-medium text-zinc-200 leading-snug mb-1">{activity.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-zinc-500">{activity.time}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/80 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500 text-center py-6">
                    No recent activity found. Start uploading documents or recordings!
                  </div>
                )}
              </div>
            </div>

            {/* Mini Schedule / Status Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-zinc-900 border border-indigo-500/20 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] group-hover:bg-indigo-500/20 transition-colors"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-indigo-400" />
                    Coming Up Next
                  </h2>
                </div>
                <div className="bg-zinc-950/50 backdrop-blur-md rounded-xl p-4 border border-zinc-800/80">
                  <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Today, 2:00 PM</p>
                  <p className="text-sm font-semibold text-zinc-100 leading-snug mb-1">City Council Briefing</p>
                  <p className="text-xs text-zinc-400">Review the zoning proposal summary before attending.</p>
                </div>
                <button 
                  onClick={() => navigate('/schedule')}
                  className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-900/20"
                >
                  View Full Schedule
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
