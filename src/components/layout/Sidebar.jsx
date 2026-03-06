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
  Landmark,
  X,
  User
} from 'lucide-react';
import { auth } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
        { name: 'Meeting Summarizer', path: '/meetings', icon: MessageSquare },
        { name: 'Speech & Drafts', path: '/speeches', icon: Mic },
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Schedule Manager', path: '/schedule', icon: Calendar },
        { name: 'Constituency Tracker', path: '/constituency', icon: Map },
        { name: 'Real-time Insights', path: '/insights', icon: BarChart3 },
      ]
    }
  ];

  const sidebarClasses = `bg-gray-900 text-white flex flex-col h-full transition-all duration-300 z-20
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
        <div className={`flex items-center justify-between h-16 px-4 border-b border-gray-800 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <Landmark className="shrink-0 text-indigo-400 w-8 h-8" />
            {!isCollapsed && <span className="text-xl font-bold whitespace-nowrap">Neeti AI</span>}
          </div>
          {/* Mobile Close Button */}
          {mobileOpen && (
            <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <nav className="space-y-4 px-2">
            {navSections.map((section, idx) => (
              <div key={section.title} className="flex flex-col space-y-1">
                {!isCollapsed && (
                  <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-2">
                    {section.title}
                  </div>
                )}
                {isCollapsed && idx !== 0 && (
                  <div className="w-full flex justify-center mb-1 mt-2">
                    <div className="w-6 border-b border-gray-700"></div>
                  </div>
                )}
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors
                      ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex items-center gap-3 w-full px-3 py-2 rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
          
          {/* Profile Section */}
          <div className="relative group">
            {/* Hover Menu */}
            <div className={`absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden transition-all duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible flex flex-col z-50
              ${isCollapsed ? 'left-full ml-2 w-48' : 'w-full'}
            `}>
              <NavLink 
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left transition-colors"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings & Security</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 w-full text-left transition-colors border-t border-gray-700"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Profile Button */}
            <button
              className={`flex items-center gap-3 w-full px-2 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mt-2 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 overflow-hidden">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-medium text-white truncate w-full text-left">{currentUser?.displayName || 'Leader'}</span>
                  <span className="text-xs text-gray-400 truncate w-full text-left">{currentUser?.email || 'No email provided'}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
