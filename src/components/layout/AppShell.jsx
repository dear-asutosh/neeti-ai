import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, ChevronDown, Map, Sparkles, FileText, Calendar, BarChart3 } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../services/firebase';
import { useNotifications } from '../../hooks/useNotifications';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { currentUser, dbUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize background notification polling
  useNotifications();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const displayPhoto = dbUser?.photoURL || currentUser?.photoURL;

  // Render context-aware titles based on the route path
  const renderHeaderContext = () => {
    let context = {
      icon: null,
      title: "",
      subtitle: ""
    };

    if (location.pathname === '/') {
      context = { icon: BarChart3, title: "Overview Dashboard", subtitle: "Constituency snapshot and key metrics." };
    } else if (location.pathname.startsWith('/constituency')) {
      context = { icon: Map, title: "Constituency Tracker", subtitle: "Manage complaints, projects, and stakeholders." };
    } else if (location.pathname.startsWith('/documents')) {
      context = { icon: FileText, title: "Document Summarizer", subtitle: "AI-assisted document analysis and briefs." };
    } else if (location.pathname.startsWith('/meetings')) {
      context = { icon: Calendar, title: "Meeting Summarizer", subtitle: "Transcribe and extract key action items." };
    } else if (location.pathname.startsWith('/speeches')) {
      context = { icon: FileText, title: "Speech & Drafts", subtitle: "Draft and archive public addresses." };
    } else if (location.pathname.startsWith('/schedule')) {
      context = { icon: Calendar, title: "Schedule Manager", subtitle: "Manage appointments and events." };
    } else if (location.pathname.startsWith('/insights')) {
      context = { icon: Sparkles, title: "Real-time Insights", subtitle: "Live sentiment and trend analysis." };
    } else if (location.pathname.startsWith('/assistant')) {
      context = { icon: Sparkles, title: "Neeti AI Assistant", subtitle: "Your legislative and administrative copilot." };
    } else if (location.pathname.startsWith('/settings')) {
      context = { icon: User, title: "Account Settings", subtitle: "Manage your profile and preferences." };
    } else {
      return null;
    }

    const Icon = context.icon;

    return (
      <div className="flex items-center gap-3 ml-4">
        <div className="bg-zinc-800/80 p-1.5 rounded-md hidden sm:block">
          <Icon className="w-4 h-4 text-zinc-300" />
        </div>
        <div>
          <h1 className="text-sm md:text-base font-bold text-zinc-100 leading-tight">{context.title}</h1>
          <p className="text-[10px] md:text-xs text-zinc-400 leading-none mt-0.5 hidden sm:block">{context.subtitle}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex flex-col flex-1 w-0 min-w-0 overflow-hidden">
        {/* Header - shown on all screen sizes but layout changes */}
        <header className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 shrink-0 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-4 flex-1 overflow-hidden pr-4">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="md:hidden text-[15px] font-semibold tracking-tight text-white shrink-0 ml-2">Neeti AI</span>
            
            {/* Context Title Target */}
            <div className="flex-1 flex items-center pr-4 ml-2 min-w-0">
               {renderHeaderContext()}
            </div>
          </div>

          {/* User Profile Area (Top Right) */}
          <div className="relative shrink-0">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-zinc-900 transition-colors border border-transparent focus:outline-none"
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-zinc-100">{dbUser?.displayName || currentUser?.displayName || 'Official'}</span>
                <span className="text-xs text-zinc-500 capitalize">{dbUser?.department || dbUser?.role || 'Leader'}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-gold/30 flex items-center justify-center overflow-hidden">
                {displayPhoto ? (
                  <img src={displayPhoto} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4 text-zinc-300" />
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-500 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-zinc-800 mb-1">
                    <p className="text-sm text-white font-medium truncate">{dbUser?.displayName || currentUser?.displayName}</p>
                    <p className="text-xs text-zinc-400 truncate">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      // Navigate to settings or profile page here if implemented
                      navigate('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-zinc-800 hover:text-red-400 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
