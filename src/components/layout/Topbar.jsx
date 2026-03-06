import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function Topbar({ setMobileOpen }) {
  const location = useLocation();

  // Simple logic to format route path into a page title
  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Dashboard';
    
    // Convert e.g., "ai-assistant" to "Ai Assistant"
    return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger */}
        <button 
          onClick={() => setMobileOpen(true)}
          className="md:hidden text-gray-500 hover:text-gray-900 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <h1 className="text-xl font-semibold text-gray-900">
          {getPageTitle()}
        </h1>
      </div>
    </header>
  );
}
