import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex flex-col flex-1 w-0 min-w-0 overflow-hidden">
        {/* Mobile Header for Sidebar Toggle */}
        <div className="md:hidden flex items-center justify-between bg-zinc-950 px-4 py-3 border-b border-zinc-800 shrink-0">
          <span className="text-[15px] font-semibold tracking-tight text-white">Neeti AI</span>
          <button 
            onClick={() => setMobileOpen(true)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
