import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../services/firebase';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex flex-col flex-1 w-0 min-w-0 overflow-hidden">
        {/* Header - shown on all screen sizes but layout changes */}
        <header className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 shrink-0 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-zinc-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="md:hidden text-[15px] font-semibold tracking-tight text-white">Neeti AI</span>
            
            {/* Desktop Page Context (optional, could be dynamic depending on route) */}
            <div className="hidden md:block">
               {/* <span className="text-zinc-400 font-medium">Dashboard</span> */}
            </div>
          </div>

          {/* User Profile Area (Top Right) */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-zinc-900 transition-colors border border-transparent focus:outline-none"
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-zinc-100">{currentUser?.displayName || 'Official'}</span>
                <span className="text-xs text-zinc-500 capitalize">{currentUser?.role || 'Leader'}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-gold/30 flex items-center justify-center overflow-hidden">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
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
                    <p className="text-sm text-white font-medium truncate">{currentUser?.displayName}</p>
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
