import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, ChevronDown, Map, Sparkles, FileText, Calendar, BarChart3, Sun, Moon } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { auth, clearAuthToken } from '../../services/firebase';
import { useNotifications } from '../../hooks/useNotifications';
import { StyledSwal } from '../../utils/sweetalert';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { currentUser, dbUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize background notification polling
  useNotifications();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    const result = await StyledSwal.fire({
      title: 'Sign Out?',
      text: "Are you sure you want to log out?",
      icon: 'question',
      iconColor: '#6366f1',
      showCancelButton: true,
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      clearAuthToken();
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
        <div className="bg-gray-100 dark:bg-zinc-800/80 p-1.5 rounded-md hidden sm:block">
          <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </div>
        <div>
          <h1 className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{context.title}</h1>
          <p className="text-[10px] md:text-xs text-zinc-400 leading-none mt-0.5 hidden sm:block">{context.subtitle}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden font-sans">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex flex-col flex-1 w-0 min-w-0 overflow-hidden">
        {/* Header - shown on all screen sizes but layout changes */}
        <header className="bg-white dark:bg-zinc-950 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 shrink-0 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-4 flex-1 overflow-hidden pr-4">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="md:hidden text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white shrink-0 ml-2">Neeti AI</span>

            {/* Context Title Target */}
            <div className="flex-1 flex items-center pr-4 ml-2 min-w-0">
              {renderHeaderContext()}
            </div>
          </div>

          {/* Live Time and Date Display */}
          <div className="hidden md:flex flex-col items-end text-right mr-4">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </div>
            <div className="text-xs text-zinc-500">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>

          {/* User Profile & Theme Area (Top Right) */}
          <div className="relative shrink-0 flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent focus:outline-none"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors border border-transparent focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-gold/30 flex items-center justify-center overflow-hidden">
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
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md shadow-xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 mb-1">
                    <p className="text-sm text-zinc-900 dark:text-white font-medium truncate">{dbUser?.displayName || currentUser?.displayName}</p>
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider truncate mb-0.5">
                      {dbUser?.designation || dbUser?.department || 'Official'}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      // Navigate to settings or profile page here if implemented
                      navigate('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-red-400 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-gray-50 dark:bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
