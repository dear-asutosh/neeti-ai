import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, FileText, Mic, PenTool, Map, Calendar, Zap, Quote, User, ChevronDown, Sparkles, Sun, Moon } from 'lucide-react';
import FadeInSection from '../components/FadeInSection';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { StyledSwal } from '../utils/sweetalert';

function AshokaChakra({ size = 100, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
      <circle cx="100" cy="100" r="90" fill="none" 
        stroke="currentColor" strokeWidth="4"/>
      <circle cx="100" cy="100" r="14" fill="currentColor"/>
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        const rad = (angle * Math.PI) / 180;
        const x1 = 100 + 14 * Math.cos(rad);
        const y1 = 100 + 14 * Math.sin(rad);
        const x2 = 100 + 85 * Math.cos(rad);
        const y2 = 100 + 85 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} 
          stroke="currentColor" strokeWidth="2.5"/>;
      })}
    </svg>
  );
}

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileFeaturesExpanded, setMobileFeaturesExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const { currentUser, dbUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle scroll for sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle outside click for desktop dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFeaturesDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleSmoothScroll = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Calculate position with offset for sticky navbar
      const headerOffset = 100; // Adjust based on your actual navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      setFeaturesDropdownOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleFeatureClick = (e, route) => {
    e.preventDefault();
    setFeaturesDropdownOpen(false);
    setMobileMenuOpen(false);
    if (currentUser) {
      navigate(route);
    } else {
      // Pass the intended route so they can be redirected after login (optional),
      // or just send to login. The PrivateRoute handles post-login redirect usually if state is set,
      // but here we can just go to login for simplicity.
      navigate('/login');
    }
  };

  const featureLinks = [
    { route: '/documents', label: 'Document Summarization', icon: FileText },
    { route: '/meetings', label: 'Meeting Transcription', icon: Mic },
    { route: '/speeches', label: 'Speech & Response Drafting', icon: PenTool },
    { route: '/constituency', label: 'Constituency Tracking', icon: Map },
    { route: '/schedule', label: 'Schedule Management', icon: Calendar },
    { route: '/assistant', label: 'AI Assistant', icon: Sparkles },
  ];

  const handleLogout = async () => {
    const result = await StyledSwal.fire({
      title: 'Sign Out?',
      text: "Are you sure you want to log out of Neeti AI?",
      icon: 'question',
      iconColor: '#6366f1',
      showCancelButton: true,
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setProfileDropdownOpen(false);
      setMobileMenuOpen(false);
      // Let AppShell or Firebase handle global logout
      const { auth } = await import('../services/firebase');
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const displayName = dbUser?.displayName || currentUser?.displayName || 'Official';
  const displayPhoto = dbUser?.photoURL || currentUser?.photoURL;

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#F8F4ED] font-sans overflow-x-hidden relative">
      {/* Global Grid Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(#FF9933 1px, transparent 1px), linear-gradient(90deg, #FF9933 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      ></div>
      
      {/* --- [1] NAVBAR --- */}
      <nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-[#0D1B2A]/95 backdrop-blur-md shadow-lg py-3 border-b border-[#1E3A5F]' : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AshokaChakra size={36} className="text-[#FF9933]" />
            <div className="flex flex-col">
              <span className="text-2xl font-heading text-white tracking-normal leading-none font-bold">
                NEETI AI
              </span>
              <span className="text-xs font-hindi italic text-[#FF9933] mt-1">
                नीति AI
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" onClick={(e) => handleSmoothScroll(e, 'home')} className="text-[#8BA3BC] hover:text-white transition-colors text-sm font-medium uppercase tracking-wider font-heading">Home</a>
            
            {/* Desktop Features Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                className="flex items-center gap-1 text-[#8BA3BC] hover:text-white transition-colors text-sm font-medium focus:outline-none uppercase tracking-wider font-heading"
                onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
                onMouseEnter={() => setFeaturesDropdownOpen(true)}
              >
                Features <ChevronDown size={14} className={`transition-transform duration-200 ${featuresDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-4 w-150 bg-[#112236] rounded-none shadow-2xl border border-[#1E3A5F] overflow-hidden transition-all duration-300 origin-top ${
                  featuresDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                }`}
                onMouseLeave={() => setFeaturesDropdownOpen(false)}
              >
                <div className="p-6">
                  <h3 className="text-[#F8F4ED] font-heading font-extrabold text-lg mb-4 pb-2 border-b border-[#1E3A5F] uppercase tracking-tight">Neeti AI Capabilities</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {featureLinks.map((feature) => (
                      <button 
                        key={feature.route}
                        onClick={(e) => handleFeatureClick(e, feature.route)}
                        className="flex items-start gap-3 p-3 rounded-none hover:bg-[#1E3A5F] transition-colors group cursor-pointer text-left w-full focus:outline-none"
                      >
                        <div className="bg-[#1E3A5F] text-[#FF9933] p-2 rounded-none group-hover:bg-[#FF9933] group-hover:text-[#0D1B2A] transition-colors shrink-0">
                          <feature.icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#F8F4ED] mb-0.5 group-hover:text-[#FF9933] transition-colors font-heading uppercase tracking-wide">{feature.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0A1628] px-6 py-4 flex justify-between items-center border-t border-[#1E3A5F]">
                   <p className="text-xs text-[#8BA3BC] font-medium tracking-wide">Explore all governance tools.</p>
                   <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="text-xs font-extrabold text-[#FF9933] hover:text-white transition-colors uppercase tracking-tight font-heading">View All &rarr;</a>
                </div>
              </div>
            </div>

            <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className="text-[#8BA3BC] hover:text-white transition-colors text-sm font-medium uppercase tracking-wider font-heading">How It Works</a>
            <a href="#testimonials" onClick={(e) => handleSmoothScroll(e, 'testimonials')} className="text-[#8BA3BC] hover:text-white transition-colors text-sm font-medium uppercase tracking-wider font-heading">Testimonials</a>
            
            {/* Theme Toggle Desktop */}
            <button
              onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center p-2 text-[#8BA3BC] hover:text-[#FF9933] transition-colors rounded-full hover:bg-white/5"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {currentUser ? (
              <div className="flex items-center gap-4 pl-4 border-l border-white/20">
                <div className="relative" ref={profileDropdownRef}>
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    onMouseEnter={() => setProfileDropdownOpen(true)}
                    className="flex items-center gap-2 focus:outline-none group"
                  >
                    <div className="w-9 h-9 rounded-full bg-navy border-2 border-transparent group-hover:border-gold/50 flex items-center justify-center overflow-hidden transition-colors shadow-sm">
                      {displayPhoto ? (
                        <img src={displayPhoto} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="hidden lg:flex items-center gap-1">
                      <span className="text-white text-sm font-semibold truncate max-w-30">
                        {displayName.split(' ')[0]}
                      </span>
                      <ChevronDown size={14} className={`text-white/70 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  <div 
                    className={`absolute right-0 top-full mt-3 w-56 bg-[#112236] rounded-none shadow-2xl border border-[#1E3A5F] overflow-hidden transition-all duration-300 origin-top-right ${
                      profileDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                    }`}
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-[#1E3A5F] bg-[#0A1628]">
                      <p className="text-sm font-bold text-[#F8F4ED] truncate uppercase tracking-wide font-heading">{displayName}</p>
                      <p className="text-xs text-[#8BA3BC] truncate">{currentUser.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link 
                        to="/dashboard" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center px-3 py-2 text-sm text-[#F8F4ED] hover:bg-[#1E3A5F] rounded-none transition-colors font-medium"
                      >
                        Go to Dashboard
                      </Link>
                      <Link 
                        to="/settings" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center px-3 py-2 text-sm text-[#F8F4ED] hover:bg-[#1E3A5F] rounded-none transition-colors font-medium"
                      >
                        Profile Configuration
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-none transition-colors font-medium border-t border-[#1E3A5F] mt-1 pt-2"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
                
                <Link to="/dashboard" className="hidden sm:flex bg-[#FF9933] hover:bg-[#FF9933]/90 text-[#0D1B2A] px-5 py-2.5 rounded-none font-bold transition-colors text-sm items-center shadow-lg shadow-[#FF9933]/20 uppercase tracking-tight font-heading" style={{ borderRadius: '2px' }}>
                  Dashboard
                </Link>
              </div>
            ) : (
              <Link to="/login" className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-[#0D1B2A] px-4 sm:px-6 py-2 rounded-none font-bold transition-colors text-sm uppercase tracking-tight font-heading" style={{ borderRadius: '2px' }}>
                Sign Up &rarr;
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="text-white">
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#0D1B2A] border-t border-[#1E3A5F] shadow-xl max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="flex flex-col px-4 py-6 space-y-4">
              <a href="#home" onClick={(e) => handleSmoothScroll(e, 'home')} className="text-[#F8F4ED] text-lg font-heading uppercase tracking-tight">Home</a>
              
              {/* Mobile Features Accordion */}
              <div className="flex flex-col border-b border-[#1E3A5F] pb-2">
                <button 
                  onClick={() => setMobileFeaturesExpanded(!mobileFeaturesExpanded)}
                  className="flex items-center justify-between text-[#F8F4ED] text-lg w-full text-left font-heading uppercase tracking-tight"
                >
                  Features 
                  <ChevronDown className={`transition-transform duration-200 ${mobileFeaturesExpanded ? 'rotate-180' : ''}`} size={20} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${mobileFeaturesExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-col space-y-3 pl-4 border-l-2 border-[#FF9933]/30 ml-2">
                    {featureLinks.map((feature) => (
                      <button 
                        key={feature.route}
                        onClick={(e) => handleFeatureClick(e, feature.route)}
                        className="flex items-center gap-3 text-[#8BA3BC] hover:text-[#FF9933] py-1 w-full text-left transition-colors"
                      >
                       <feature.icon size={16} className="text-[#FF9933] shrink-0" />
                       <span className="text-base font-heading uppercase tracking-wide">{feature.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className="text-[#F8F4ED] text-lg font-heading uppercase tracking-tight">How It Works</a>
              <a href="#testimonials" onClick={(e) => handleSmoothScroll(e, 'testimonials')} className="text-[#F8F4ED] text-lg font-heading uppercase tracking-tight">Testimonials</a>
              
              <button 
                onClick={() => {
                  toggleTheme(theme === 'dark' ? 'light' : 'dark');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 text-[#F8F4ED] text-lg font-heading uppercase tracking-tight text-left"
              >
                {theme === 'dark' ? (
                  <><Sun size={20} className="text-[#FF9933]" /> <span className="mt-1">Switch to Light Mode</span></>
                ) : (
                  <><Moon size={20} className="text-[#FF9933]" /> <span className="mt-1">Switch to Dark Mode</span></>
                )}
              </button>
              
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#1E3A5F] mt-4">
                    <div className="w-10 h-10 rounded-full bg-[#112236] border border-[#FF9933] flex items-center justify-center overflow-hidden shrink-0">
                      {displayPhoto ? (
                        <img src={displayPhoto} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[#F8F4ED] font-bold truncate font-heading uppercase">{displayName}</p>
                      <p className="text-[#8BA3BC] text-xs truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <Link to="/dashboard" onClick={toggleMobileMenu} className="bg-[#FF9933] text-[#0D1B2A] px-4 py-3 text-center rounded-none font-bold uppercase tracking-tight font-heading" style={{ borderRadius: '2px' }}>
                      Go to Dashboard &rarr;
                    </Link>
                    <Link to="/settings" onClick={toggleMobileMenu} className="bg-white/5 text-[#F8F4ED] px-4 py-3 text-center rounded-none font-bold uppercase tracking-tight font-heading border border-[#1E3A5F]" style={{ borderRadius: '2px' }}>
                      Profile Configuration
                    </Link>
                    <button onClick={handleLogout} className="text-red-400 py-3 text-center border border-red-500/30 rounded-none font-bold uppercase tracking-tight font-heading mt-2" style={{ borderRadius: '2px' }}>
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login" onClick={toggleMobileMenu} className="bg-[#FF9933] text-[#0D1B2A] px-4 py-3 text-center rounded-none font-bold uppercase tracking-tight font-heading mt-4" style={{ borderRadius: '2px' }}>
                  Sign Up &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <section id="home" className="relative pt-24 pb-16 lg:pt-48 lg:pb-32 bg-[#0D1B2A] min-h-[85vh] flex items-center overflow-hidden">
        {/* Ashoka Chakra Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0 overflow-hidden">
          <AshokaChakra className="text-[#FF9933] transform rotate-12 w-[300px] h-[300px] md:w-[600px] md:h-[600px] lg:w-[800px] lg:h-[800px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeInSection>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-[#F8F4ED] mb-6 leading-tight max-w-4xl mx-auto tracking-tight px-2">
             Powering the People <br /> Who Power <span className="text-[#FF9933] italic">In</span><span className='text-[#F8F4ED] italic'>d</span><span className='text-[#138808] italic'>ia</span>.
            </h1>

            <div className="mb-8 px-4">
              <p className="font-hindi italic text-lg sm:text-xl md:text-2xl text-[#FF9933] mb-1">"जनसेवा ही ईश्वर सेवा है"</p>
              <p className="text-[#8BA3BC] text-[10px] sm:text-xs uppercase tracking-[0.2em] font-heading font-medium">Service to people is service to God</p>
            </div>

            <p className="text-lg md:text-xl text-[#8BA3BC] mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
              Neeti AI assists government officials, administrators, and public representatives in making faster, informed, and impactful decisions — securely and intelligently.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
              {currentUser ? (
                <Link to="/dashboard" className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-[#0D1B2A] px-10 py-4 rounded-none text-lg font-bold transition-all shadow-xl shadow-[#FF9933]/20 inline-flex items-center uppercase tracking-tight font-heading hover:-translate-y-1" style={{ borderRadius: '2px' }}>
                  Continue to Dashboard &rarr;
                </Link>
              ) : (
                <>
                  <Link to="/login" className="group bg-[#FF9933] hover:bg-[#FF9933]/90 text-[#0D1B2A] px-8 sm:px-10 py-4 sm:py-4 rounded-none text-base sm:text-lg font-bold transition-all shadow-xl shadow-[#FF9933]/20 inline-flex items-center uppercase tracking-tight font-heading hover:-translate-y-1" style={{ borderRadius: '2px' }}>
                    Register for Early Access 
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </Link>
                  <Link to="/login" className="bg-transparent border-2 border-[#1E3A5F] text-white hover:border-[#FF9933] hover:text-[#FF9933] px-8 sm:px-10 py-4 sm:py-4 rounded-none text-base sm:text-lg font-bold transition-all inline-flex items-center uppercase tracking-tight font-heading hover:-translate-y-1" style={{ borderRadius: '2px' }}>
                    Sign In
                  </Link>
                </>
              )}
            </div>
            
          </FadeInSection>
        </div>

        {/* Tricolor Bar at Bottom */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] flex">
          <div className="flex-1 bg-[#FF9933]"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-[#138808]"></div>
        </div>
      </section>

      {/* --- [3] STATS BAR --- */}
      <section className="bg-[#112236] py-12 border-b border-[#1E3A5F] relative z-20 shadow-2xl overflow-hidden">
        {/* Subtle Horizontal Glow */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF9933]/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#1E3A5F] text-center">
              <div className="p-4">
                <div className="text-3xl lg:text-4xl font-bold text-[#F8F4ED] mb-2 font-heading tracking-tight">500+</div>
                <p className="font-hindi italic text-base text-[#FF9933]/70 mb-1">अधिकारी</p>
                <div className="text-[#8BA3BC] text-[10px] uppercase tracking-normal font-normal font-heading">Officials Onboarded</div>
              </div>
              <div className="p-4">
                <div className="text-3xl lg:text-4xl font-bold text-[#F8F4ED] mb-2 font-heading tracking-tight">10,000+</div>
                <p className="font-hindi italic text-base text-[#FF9933]/70 mb-1">दस्तावेज़</p>
                <div className="text-[#8BA3BC] text-[10px] uppercase tracking-normal font-normal font-heading">Documents Processed</div>
              </div>
              <div className="p-4">
                <div className="text-3xl lg:text-4xl font-bold text-[#F8F4ED] mb-2 font-heading tracking-tight">40+</div>
                <p className="font-hindi italic text-base text-[#FF9933]/70 mb-1">जिले</p>
                <div className="text-[#8BA3BC] text-[10px] uppercase tracking-normal font-normal font-heading">Districts Covered</div>
              </div>
              <div className="p-4">
                <div className="text-3xl lg:text-4xl font-bold text-[#F8F4ED] mb-2 font-heading tracking-tight">99.9%</div>
                <p className="font-hindi italic text-base text-[#FF9933]/70 mb-1">विश्वसनीयता</p>
                <div className="text-[#8BA3BC] text-[10px] uppercase tracking-normal font-normal font-heading">Uptime Guaranteed</div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- [4] KEY FEATURES SECTION --- */}
      <section id="features" className="py-24 bg-[#0A1628] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <span className="text-[#FF9933] text-sm font-bold uppercase tracking-[0.3em] block mb-4 font-heading">CAPABILITIES · क्षमताएं</span>
             <h2 className="text-3xl md:text-4xl font-heading font-normal text-[#F8F4ED] mb-6 uppercase tracking-normal">
              Everything a Public Leader Needs.<br />
              In One Secure Platform.
            </h2>
            <p className="text-[#8BA3BC] max-w-3xl mx-auto text-lg leading-relaxed">
              From drafting official communications to tracking constituency data in real time — Neeti AI is purpose-built for the demands of public administration.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              id="feature-summarization"
              index={0}
              icon={<FileText size={32} />}
              title="Intelligent Document Summarization"
              description="Process hundreds of pages of reports, circulars, and policy documents in seconds. Neeti AI extracts key decisions, action points, and critical information — so you focus on governance, not paperwork."
            />
            <FeatureCard 
              id="feature-transcription"
              index={1}
              icon={<Mic size={32} />}
              title="Meeting Transcription & Briefing"
              description="Automatically transcribe, summarize, and generate action items from official meetings and conferences. Every word captured. Nothing missed."
            />
            <FeatureCard 
              id="feature-drafting"
              index={2}
              icon={<PenTool size={32} />}
              title="Speech & Official Response Drafting"
              description="Generate contextually accurate speeches, press statements, and official correspondence in your voice — reviewed, refined, and ready to deliver."
            />
            <FeatureCard 
              id="feature-tracking"
              index={3}
              icon={<Map size={32} />}
              title="Constituency & Community Data Tracking"
              description="Monitor development indices, grievance statuses, and demographic data across your jurisdiction — all on a single, real-time intelligence dashboard."
            />
            <FeatureCard 
              id="feature-calendar"
              index={4}
              icon={<Calendar size={32} />}
              title="Schedule & Priority Management"
              description="Intelligently organise your calendar, flag urgent matters, and ensure no critical appointment, deadline, or follow-up ever goes unattended."
            />
            <FeatureCard 
              id="feature-assistant"
              index={5}
              icon={<Sparkles size={32} />}
              title="Workplace AI Assistant & Copilot"
              description="Interact with your documents, transcriptions, and constituency data using natural language. Draft responses, ask questions, and get intelligent insights across your entire workspace."
            />
          </div>
        </div>
      </section>

      {/* --- [5] HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="py-24 bg-[#0D1B2A] relative">
        {/* Local Grid Texture */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
             style={{ backgroundImage: 'linear-gradient(#FF9933 1px, transparent 1px), linear-gradient(90deg, #FF9933 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInSection className="text-center mb-20">
            <span className="text-[#FF9933] text-sm font-bold uppercase tracking-[0.3em] block mb-4 font-heading">PROCESS · प्रक्रिया</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#F8F4ED] mb-6 uppercase tracking-tight">
              Simple to Use.<br />
              Serious in Purpose.
            </h2>
            <p className="text-[#8BA3BC] max-w-2xl mx-auto text-lg leading-relaxed">
              Neeti AI is designed so that any government official — regardless of technical background — can be fully operational within minutes.
            </p>
          </FadeInSection>

          <FadeInSection>
            <div className="relative">
              {/* Connecting Line between steps (desktop only) */}
              <div className="hidden lg:block absolute top-6 left-[12%] right-[12%] h-px bg-[#FF9933]/40 z-0"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-6 relative z-10">
                <StepCard 
                  number="1"
                  hindiTag="पंजीकरण"
                  title="Register & Verify"
                  description="Sign up using your official government credentials. Your identity is verified through a secure, multi-layer authentication process."
                />
                <StepCard 
                  number="2"
                  hindiTag="स्थापना"
                  title="Set Up Your Profile"
                  description="Define your department, jurisdiction, and areas of priority. Neeti AI personalises your dashboard based on your role and responsibilities."
                />
                <StepCard 
                  number="3"
                  hindiTag="अपलोड"
                  title="Upload, Interact & Decide"
                  description="Upload documents, ask questions in plain language, schedule meetings, and receive intelligent recommendations — all within a single interface."
                />
                <StepCard 
                  number="4"
                  hindiTag="निर्णय"
                  title="Act with Confidence"
                  description="With accurate summaries, reliable data, and AI-drafted communications at hand, take decisions faster and govern with greater impact."
                />
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- [6] TESTIMONIALS SECTION --- */}
      <section id="testimonials" className="py-24 bg-[#112236] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <span className="text-[#FF9933] text-sm font-bold uppercase tracking-[0.3em] block mb-4 font-heading">TRUSTED BY LEADERS</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#F8F4ED] uppercase tracking-tight">
              What Public Officials Are Saying.
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeInSection className="h-full">
              <TestimonialCard 
                index={0}
                quote="Neeti AI has fundamentally changed how I prepare for district reviews. What used to take my team three days now takes three hours."
                author="District Collector, Rajasthan"
              />
            </FadeInSection>
            <FadeInSection className="h-full">
              <TestimonialCard 
                index={1}
                quote="The document summarisation feature alone has saved countless hours of administrative effort. Every official should have access to this."
                author="Additional Secretary, Ministry of Rural Development"
              />
            </FadeInSection>
            <FadeInSection className="h-full">
              <TestimonialCard 
                index={2}
                quote="For the first time, I have a real-time view of grievance redressal across my entire constituency. Neeti AI delivers what governance demands."
                author="Member of Legislative Assembly, Maharashtra"
              />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* --- [7] FINAL CTA SECTION --- */}
      <section className="py-24 bg-[#0D1B2A] relative">
        {/* Grid Texture */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
             style={{ backgroundImage: 'linear-gradient(#FF9933 1px, transparent 1px), linear-gradient(90deg, #FF9933 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInSection>
            <div className="bg-[#112236] p-12 md:p-16 text-center shadow-2xl relative overflow-hidden border border-[#1E3A5F]">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FF9933]"></div>
              
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#F8F4ED] mb-6 uppercase tracking-tight">
                Governance Deserves Better Tools.<br />
                Start Today.
              </h2>
              <p className="font-hindi italic text-xl text-[#FF9933] mb-10 max-w-2xl mx-auto">
                Join hundreds of officials already using Neeti AI to serve their citizens faster, smarter, and with greater accountability.
              </p>
              
              <div className="flex flex-col items-center">
                <Link to="/login" className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-[#0D1B2A] px-8 sm:px-12 py-4 sm:py-5 rounded-none text-lg sm:text-xl font-bold transition-all inline-block mb-1 shadow-2xl shadow-[#FF9933]/25 uppercase tracking-tight font-heading w-full max-w-md hover:-translate-y-1" style={{ borderRadius: '2px' }}>
                  Create Your Official Account &rarr;
                </Link>
                {/* Tricolor bar below button */}
                <div className="w-full max-w-md h-1 flex mb-8">
                  <div className="flex-1 bg-[#FF9933]"></div>
                  <div className="flex-1 bg-white"></div>
                  <div className="flex-1 bg-[#138808]"></div>
                </div>
              </div>
              
              <div className="text-[#8BA3BC] text-xs space-y-1 uppercase tracking-normal font-normal opacity-80 mt-4">
                <p>Access is restricted to verified government officials and public administrators only.</p>
                <p>Your data is protected under the highest standards of government-grade security.</p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- [8] FOOTER --- */}
      <footer className="bg-black relative pt-3 overflow-hidden">
        {/* Tricolor Line at very top */}
        <div className="absolute top-0 left-0 w-full h-[3px] flex">
          <div className="flex-1 bg-[#FF9933]"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-[#138808]"></div>
        </div>

        {/* Backdrop Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Branding Column */}
            <div className="lg:col-span-2 space-y-6 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 group cursor-default">
                <div className="relative">
                  <AshokaChakra size={36} className="text-[#FF9933] transition-transform duration-700 group-hover:rotate-[360deg]" />
                  <div className="absolute inset-0 bg-[#FF9933]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-heading text-white tracking-widest uppercase font-black transition-colors duration-500 group-hover:text-gold">
                    NEETI AI
                  </span>
                  <span className="text-lg font-hindi italic text-[#FF9933] opacity-80 group-hover:opacity-100 transition-opacity">
                    नीति AI
                  </span>
                </div>
              </div>
              <p className="text-sm text-[#8BA3BC] max-w-sm leading-relaxed mx-auto md:mx-0">
                The premier AI command center for India's public leadership. Empowering governance with state-of-the-art intelligence and domestic focus.
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-4">
                 <a 
                   href="mailto:neeti.organisation@gmail.com" 
                   className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-[#8BA3BC] hover:text-[#FF9933] hover:border-[#FF9933]/30 transition-all duration-300 group"
                 >
                   <Mail size={14} className="group-hover:scale-110 transition-transform" />
                   neeti.organisation@gmail.com
                 </a>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="space-y-6 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF9933]">Platform</h4>
              <nav className="flex flex-col gap-4 text-xs font-bold text-[#8BA3BC] uppercase tracking-widest">
                <a href="#" className="hover:text-white transition-all transform hover:translate-x-1 inline-block">About Us</a>
                <a href="#features" className="hover:text-white transition-all transform hover:translate-x-1 inline-block">Features</a>
                <a href="#" className="hover:text-white transition-all transform hover:translate-x-1 inline-block">Security Core</a>
                <a href="#" className="hover:text-white transition-all transform hover:translate-x-1 inline-block">Privacy Trust</a>
              </nav>
            </div>

            {/* Support Column */}
            <div className="space-y-6 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF9933]">System Status</h4>
              <div className="flex flex-col gap-6">
                <div className="inline-flex items-center justify-center md:justify-start gap-2 bg-[#138808]/10 border border-[#138808]/20 px-4 py-2 rounded-full w-fit mx-auto md:mx-0">
                  <div className="w-2 h-2 rounded-full bg-[#138808] animate-pulse"></div>
                  <span className="text-[10px] font-bold text-[#138808] uppercase tracking-widest text-center">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[13px] text-[#8BA3BC] font-heading font-medium tracking-tight">
            <div className="text-center md:text-left space-y-2">
              <p>&copy; 2026 Neeti AI. Built for Bharat's Public Leaders.</p>
              <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase tracking-widest text-[#8BA3BC]/40">
                <a href="#" className="hover:text-[#FF9933] transition-colors">Terms of Service</a>
                <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                <a href="#" className="hover:text-[#FF9933] transition-colors">Data Ethics</a>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-6">
              <div className="flex items-center gap-4 group cursor-default">
                  <span className="text-[#FF9933] font-hindi italic text-lg opacity-80 group-hover:opacity-100 transition-all group-hover:scale-110">सत्यमेव जयते</span>
                  <div className="h-8 w-px bg-white/10 mx-2"></div>
                  <p className="font-hindi italic text-lg text-[#FF9933] opacity-80 group-hover:opacity-100 transition-all group-hover:scale-110">जय हिन्द 🇮🇳</p>
              </div>
              
              <button 
                onClick={scrollToTop}
                className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-[#FF9933] border border-white/10 hover:border-transparent rounded-2xl transition-all duration-500 shadow-xl"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-white transition-colors">Return to Top</span>
                <ArrowUp size={14} className="text-[#FF9933] group-hover:text-white group-hover:-translate-y-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-components for repeatable sections

function FeatureCard({ id, icon, title, description, index }) {
  const borderColors = ['border-[#FF9933]', 'border-white', 'border-[#138808]'];
  const borderColor = borderColors[index % 3];

  return (
    <div id={id} className="scroll-mt-24 h-full">
      <FadeInSection className="h-full">
        <div className={`bg-[#112236] p-6 sm:p-8 border-l-4 ${borderColor} border border-[#1E3A5F] shadow-sm hover:shadow-2xl hover:shadow-[#FF9933]/5 transition-all duration-500 h-full flex flex-col group hover:-translate-y-2 relative overflow-hidden`}>
          {/* Subtle Glow Overlay */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-white/10 to-transparent pointer-events-none`}></div>
          
          <div className="mb-6 bg-[#1E3A5F] w-16 h-16 flex items-center justify-center rounded-none transition-all duration-500 group-hover:bg-[#FF9933] group-hover:text-[#0D1B2A] text-[#FF9933] shadow-inner">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-[#F8F4ED] mb-4 font-heading uppercase tracking-tight">{title}</h3>
          <p className="font-sans leading-relaxed text-[#8BA3BC] font-normal">{description}</p>
        </div>
      </FadeInSection>
    </div>
  );
}

function StepCard({ number, title, description, hindiTag }) {
  return (
    <div className="flex flex-col items-center text-center lg:items-start lg:text-left group">
      <div className="flex flex-col items-center lg:items-start mb-6">
        <div className="w-12 h-12 rounded-none bg-[#FF9933] text-[#0D1B2A] font-bold text-xl flex items-center justify-center z-10 shadow-lg font-heading transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ borderRadius: '2px' }}>
          {number}
        </div>
        <span className="font-hindi italic text-xs text-[#FF9933]/60 mt-2 transition-opacity duration-500 group-hover:opacity-100">{hindiTag}</span>
      </div>
      <h3 className="text-xl font-bold text-[#F8F4ED] mb-3 font-heading uppercase tracking-tight">{title}</h3>
      <p className="text-[#8BA3BC] leading-relaxed lg:pr-4">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, index }) {
  const borderColors = ['border-[#FF9933]', 'border-white', 'border-[#138808]'];
  const borderColor = borderColors[index % 3];

  return (
    <div className={`bg-[#0D1B2A] p-6 sm:p-8 rounded-none h-full flex flex-col relative shadow-xl group hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FF9933]/5 transition-all duration-500`}>
      <span className="text-6xl text-[#FF9933]/20 font-hindi leading-none absolute top-4 left-4 pointer-events-none select-none transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1">“</span>
      <p className="text-[#8BA3BC] text-lg italic font-hindi leading-relaxed mb-8 grow relative z-10 pt-4 group-hover:text-[#F8F4ED] transition-colors duration-500">"{quote}"</p>
      <p className="text-[#FF9933]/60 text-[10px] font-bold tracking-[0.2em] font-heading uppercase group-hover:text-[#FF9933] transition-colors duration-500">{author}</p>
    </div>
  );
}
