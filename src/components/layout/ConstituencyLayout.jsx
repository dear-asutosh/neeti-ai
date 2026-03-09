import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, Users, Map } from 'lucide-react';

export default function ConstituencyLayout() {
  const location = useLocation();

  const tabs = [
    { name: 'Dashboard', path: '/constituency', icon: LayoutDashboard, exact: true },
    { name: 'Complaints', path: '/constituency/complaints', icon: FileText, exact: false },
    { name: 'Projects & Schemes', path: '/constituency/projects', icon: Briefcase, exact: false },
    { name: 'People Directory', path: '/constituency/people', icon: Users, exact: false },
    { name: 'Ward Overview', path: '/constituency/wards', icon: Map, exact: false },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Sub-navigation Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 pt-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              // Determine active state manually to handle nested routes properly
              const isActive = tab.exact 
                ? location.pathname === tab.path 
                : location.pathname.startsWith(tab.path);
                
              return (
                <NavLink
                  key={tab.name}
                  to={tab.path}
                  className={`
                    flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap text-sm font-medium
                    ${isActive 
                      ? 'border-zinc-100 text-zinc-100' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'}
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full">
        <Outlet />
      </div>
    </div>
  );
}
