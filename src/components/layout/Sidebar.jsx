import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  Mic,
  MessageSquare,
  Calendar,
  BarChart3,
  Map,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { auth, clearAuthToken } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { StyledSwal } from '../../utils/sweetalert';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();

  const handleLogout = async () => {
    const result = await StyledSwal.fire({
      title: 'Sign Out?',
      text: "Are you sure you want to log out of your account?",
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

  const navSections = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
      ]
    },
    {
      title: 'AI Tools',
      items: [
        { name: 'Document Summarizer', path: '/documents', icon: FileText },
        { name: 'Meeting Summarizer', path: '/meetings', icon: Mic },
        { name: 'Speech & Drafts', path: '/speeches', icon: ImageIcon },
        { name: 'AI Assistant', path: '/assistant', icon: Sparkles },
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Schedule Manager', path: '/schedule', icon: Calendar },
        { name: 'Constituency Tracker', path: '/constituency', icon: Map },
      ]
    }
  ];

  const sidebarClasses = `bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 flex flex-col h-full transition-all duration-300 z-20 border-r border-gray-200 dark:border-zinc-800
    ${isCollapsed ? 'w-20' : 'w-64'} 
    ${mobileOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'fixed inset-y-0 left-0 -translate-x-full md:relative md:translate-x-0'}`;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={sidebarClasses}>
        {/* Header */}
        <div className={`flex items-center justify-between h-14 px-4 border-b border-gray-100 dark:border-zinc-800 ${isCollapsed ? 'justify-center' : ''}`}>
          <NavLink to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/icon.png" alt="Neeti AI" className="shrink-0 w-8 h-8 rounded-md" />
            {!isCollapsed && <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap">Neeti AI</span>}
          </NavLink>
          {/* Mobile Close Button */}
          {mobileOpen && (
            <button onClick={() => setMobileOpen(false)} className="md:hidden text-zinc-400 hover:text-zinc-100">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <nav className="space-y-6 px-3">
            {navSections.map((section, idx) => (
              <div key={section.title} className="flex flex-col space-y-1">
                {!isCollapsed && (
                  <div className="px-2 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wider mb-1 mt-1 font-sans">
                    {section.title}
                  </div>
                )}
                {isCollapsed && idx !== 0 && (
                  <div className="w-full flex justify-center mb-1 mt-3">
                    <div className="w-6 border-b border-zinc-800/60"></div>
                  </div>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-2.5 py-2 rounded-md transition-all text-sm font-medium
                        ${isActive ? 'bg-gray-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`shrink-0 ${isCollapsed ? 'w-5.5 h-5.5' : 'w-4 h-4'}`} strokeWidth={isActive ? 2.5 : 2} />
                          {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-100 dark:border-zinc-800 space-y-1">
          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex items-center gap-3 w-full px-2.5 py-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-sm font-medium ${isCollapsed ? 'justify-center' : ''}`}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span>Collapse</span>}
          </button>

          {/* Profile Section */}
          <div className="relative group">
            {/* Hover Menu */}
            <div className={`absolute bottom-full left-0 mb-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md shadow-lg overflow-hidden transition-all duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible flex flex-col z-50
              ${isCollapsed ? 'left-full ml-2 w-48' : 'w-full'}
            `}>
              <NavLink
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 w-full text-left transition-colors font-medium"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings & Security</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-red-400 w-full text-left transition-colors border-t border-gray-100 dark:border-zinc-800 font-medium"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Profile Button */}
            <button
              className={`flex items-center gap-3 w-full px-2 py-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors mt-1 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {displayPhoto ? (
                  <img src={displayPhoto} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4 text-zinc-400" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate w-full text-left">{dbUser?.displayName || currentUser?.displayName || 'Leader'}</span>
                  <span className="text-xs text-zinc-500 truncate w-full text-left">{currentUser?.email || 'No email provided'}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
