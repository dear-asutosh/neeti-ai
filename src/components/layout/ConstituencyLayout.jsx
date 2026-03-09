import React, { useRef, useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, Users, Map, ChevronLeft, ChevronRight } from 'lucide-react';

const tabs = [
  { name: 'Dashboard', path: '/constituency', icon: LayoutDashboard, exact: true },
  { name: 'Complaints', path: '/constituency/complaints', icon: FileText, exact: false },
  { name: 'Projects & Schemes', path: '/constituency/projects', icon: Briefcase, exact: false },
  { name: 'People Directory', path: '/constituency/people', icon: Users, exact: false },
  { name: 'Ward Overview', path: '/constituency/wards', icon: Map, exact: false },
];

export default function ConstituencyLayout() {
  const location = useLocation();
  const navRef = useRef(null);
  const tabRefs = useRef({});
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleNavScroll = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    handleNavScroll();
    window.addEventListener('resize', handleNavScroll);
    return () => window.removeEventListener('resize', handleNavScroll);
  }, []);

  useEffect(() => {
    // Scroll active tab into view
    const activeTab = tabs.find(tab => 
      tab.exact ? location.pathname === tab.path : location.pathname.startsWith(tab.path)
    );
    if (activeTab && tabRefs.current[activeTab.path]) {
      tabRefs.current[activeTab.path].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [location.pathname]);

  const scrollLeft = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: -120, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: 120, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 md:px-6 pt-4 sticky top-0 z-10 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-4 w-8 z-20 bg-linear-to-r from-zinc-900 to-transparent md:hidden">
              <button onClick={scrollLeft} className="h-full flex items-center pl-1 text-zinc-400 hover:text-zinc-100">
                <ChevronLeft className="w-5 h-5 -ml-1 drop-shadow-[2px_0_4px_rgba(0,0,0,0.8)]" />
              </button>
            </div>
          )}

          <nav 
            ref={navRef}
            onScroll={handleNavScroll}
            className="flex space-x-4 md:space-x-6 overflow-x-auto hide-scrollbar scroll-smooth snap-x pb-1"
          >
            {tabs.map((tab) => {
              const isActive = tab.exact 
                ? location.pathname === tab.path 
                : location.pathname.startsWith(tab.path);
                
              return (
                <NavLink
                  key={tab.name}
                  to={tab.path}
                  ref={(el) => (tabRefs.current[tab.path] = el)}
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

          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-4 w-8 z-20 bg-linear-to-l from-zinc-900 to-transparent md:hidden flex justify-end">
              <button onClick={scrollRight} className="h-full flex items-center pr-1 text-zinc-400 hover:text-zinc-100">
                <ChevronRight className="w-5 h-5 -mr-1 drop-shadow-[-2px_0_4px_rgba(0,0,0,0.8)]" />
              </button>
            </div>
          )}
          
        </div>
      </div>
      <div className="flex-1 overflow-y-auto w-full">
        <Outlet />
      </div>
    </div>
  );
}
