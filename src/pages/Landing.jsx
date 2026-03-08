import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, FileText, Mic, PenTool, Map, Calendar, Zap, Quote, User, ChevronDown } from 'lucide-react';
import FadeInSection from '../components/FadeInSection';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileFeaturesExpanded, setMobileFeaturesExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const { currentUser, dbUser } = useAuth();
  const navigate = useNavigate();

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
    { route: '/insights', label: 'Real-Time Insights', icon: Zap },
  ];

  const handleLogout = async () => {
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
    <div className="min-h-screen bg-offwhite text-navy font-body overflow-x-hidden">
      
      {/* --- [1] NAVBAR --- */}
      <nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-navy/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo & Tagline */}
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-heading text-white tracking-wide">
              Neeti AI
            </span>
            <span className={`text-xs opacity-70 ${isScrolled ? 'text-white' : 'text-gray-300'} hidden sm:block`}>
              Empowering Governance. Powered by Intelligence.
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" onClick={(e) => handleSmoothScroll(e, 'home')} className="text-gray-200 hover:text-white transition-colors text-sm font-medium">Home</a>
            
            {/* Desktop Features Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                className="flex items-center gap-1 text-gray-200 hover:text-white transition-colors text-sm font-medium focus:outline-none"
                onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
                onMouseEnter={() => setFeaturesDropdownOpen(true)}
              >
                Features <ChevronDown size={14} className={`transition-transform duration-200 ${featuresDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-4 w-150 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-top ${
                  featuresDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                }`}
                onMouseLeave={() => setFeaturesDropdownOpen(false)}
              >
                <div className="p-6">
                  <h3 className="text-navy font-heading font-bold text-lg mb-4 pb-2 border-b border-gray-100">Neeti AI Capabilities</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {featureLinks.map((feature) => (
                      <button 
                        key={feature.route}
                        onClick={(e) => handleFeatureClick(e, feature.route)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-offwhite transition-colors group cursor-pointer text-left w-full focus:outline-none"
                      >
                        <div className="bg-navy/5 text-gold p-2 rounded-md group-hover:bg-gold group-hover:text-navy transition-colors shrink-0">
                          <feature.icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy mb-0.5 group-hover:text-gold transition-colors">{feature.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-offwhite px-6 py-4 flex justify-between items-center border-t border-gray-100">
                   <p className="text-xs text-gray-500 font-medium tracking-wide">Explore all governance tools.</p>
                   <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="text-xs font-bold text-navy hover:text-gold transition-colors">View All &rarr;</a>
                </div>
              </div>
            </div>

            <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className="text-gray-200 hover:text-white transition-colors text-sm font-medium">How It Works</a>
            <a href="#testimonials" onClick={(e) => handleSmoothScroll(e, 'testimonials')} className="text-gray-200 hover:text-white transition-colors text-sm font-medium">Testimonials</a>
            
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
                      <span className="text-white text-sm font-semibold truncate max-w-[120px]">
                        {displayName.split(' ')[0]}
                      </span>
                      <ChevronDown size={14} className={`text-white/70 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  <div 
                    className={`absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-top-right ${
                      profileDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                    }`}
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-bold text-navy truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link 
                        to="/dashboard" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center px-3 py-2 text-sm text-navy hover:bg-offwhite rounded-md transition-colors font-medium"
                      >
                        Go to Dashboard
                      </Link>
                      <Link 
                        to="/settings" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center px-3 py-2 text-sm text-navy hover:bg-offwhite rounded-md transition-colors font-medium"
                      >
                        Profile Configuration
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium border-t border-gray-100 mt-1 pt-2"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
                
                <Link to="/dashboard" className="hidden sm:flex bg-gold hover:bg-gold/90 text-navy px-5 py-2.5 rounded-sm font-semibold transition-colors text-sm items-center shadow-lg shadow-gold/20">
                  Dashboard
                </Link>
              </div>
            ) : (
              <Link to="/login" className="bg-gold hover:bg-gold/90 text-navy px-6 py-2 rounded-sm font-semibold transition-colors text-sm">
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
          <div className="md:hidden absolute top-full left-0 w-full bg-navy border-t border-gray-800 shadow-xl max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="flex flex-col px-4 py-6 space-y-4">
              <a href="#home" onClick={(e) => handleSmoothScroll(e, 'home')} className="text-white text-lg">Home</a>
              
              {/* Mobile Features Accordion */}
              <div className="flex flex-col border-b border-navy-light/20 pb-2">
                <button 
                  onClick={() => setMobileFeaturesExpanded(!mobileFeaturesExpanded)}
                  className="flex items-center justify-between text-white text-lg w-full text-left"
                >
                  Features 
                  <ChevronDown className={`transition-transform duration-200 ${mobileFeaturesExpanded ? 'rotate-180' : ''}`} size={20} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${mobileFeaturesExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-col space-y-3 pl-4 border-l-2 border-white/10 ml-2">
                    {featureLinks.map((feature) => (
                      <button 
                        key={feature.route}
                        onClick={(e) => handleFeatureClick(e, feature.route)}
                        className="flex items-center gap-3 text-white/80 hover:text-white py-1 w-full text-left"
                      >
                       <feature.icon size={16} className="text-gold shrink-0" />
                       <span className="text-base">{feature.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className="text-white text-lg">How It Works</a>
              <a href="#testimonials" onClick={(e) => handleSmoothScroll(e, 'testimonials')} className="text-white text-lg">Testimonials</a>
              
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10 mt-4">
                    <div className="w-10 h-10 rounded-full bg-navy border border-gold flex items-center justify-center overflow-hidden shrink-0">
                      {displayPhoto ? (
                        <img src={displayPhoto} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-white font-semibold truncate">{displayName}</p>
                      <p className="text-white/60 text-xs truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <Link to="/dashboard" onClick={toggleMobileMenu} className="bg-gold text-navy px-4 py-3 text-center rounded-sm font-semibold">
                      Go to Dashboard &rarr;
                    </Link>
                    <Link to="/settings" onClick={toggleMobileMenu} className="bg-white/10 text-white px-4 py-3 text-center rounded-sm font-semibold">
                      Profile Configuration
                    </Link>
                    <button onClick={handleLogout} className="text-red-400 py-3 text-center border border-red-500/30 rounded-sm font-semibold mt-2">
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login" onClick={toggleMobileMenu} className="bg-gold text-navy px-4 py-3 text-center rounded-sm font-semibold mt-4">
                  Sign Up &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* --- [2] HERO SECTION --- */}
      <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-navy min-h-[90vh] flex items-center overflow-hidden">
        {/* Subtle geometric pattern background via CSS gradients */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
        {/* Central Radial Gradient for depth */}
        <div className="absolute inset-0 bg-radial from-transparent to-navy/80"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeInSection>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-medium text-white mb-6 leading-tight max-w-5xl mx-auto">
              India's First AI Co-Pilot<br />
              Built for Public Leaders.
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-10 max-w-3xl mx-auto leading-relaxed">
              Neeti AI assists government officials, administrators, and public representatives in making faster, informed, and impactful decisions — securely and intelligently.
            </p>
            
            <div className="flex flex-col items-center gap-4 mt-10">
              {currentUser ? (
                <Link to="/dashboard" className="bg-gold hover:bg-gold/90 text-navy px-8 py-4 rounded-sm text-lg font-bold transition-colors shadow-lg shadow-gold/20 inline-flex items-center">
                  Continue to Dashboard &rarr;
                </Link>
              ) : (
                <>
                  <Link to="/login" className="bg-gold hover:bg-gold/90 text-navy px-8 py-4 rounded-sm text-lg font-bold transition-colors shadow-lg shadow-gold/20 inline-flex items-center">
                    Register for Early Access &rarr;
                  </Link>
                  <Link to="/login" className="text-white/80 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white/50 pb-1">
                    Already a registered official? Sign In here
                  </Link>
                </>
              )}
            </div>
            
            <p className="mt-16 text-xs text-gold uppercase tracking-widest font-semibold opacity-90">
              Designed exclusively for verified Government Officials & Public Administrators.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* --- [3] STATS BAR --- */}
      <section className="bg-white py-12 border-b border-gray-100 relative z-20 shadow-sm -mt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gold/20 text-center">
              <div className="p-4">
                <div className="text-4xl lg:text-5xl font-bold text-navy mb-2">500+</div>
                <div className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Officials Onboarded</div>
              </div>
              <div className="p-4">
                <div className="text-4xl lg:text-5xl font-bold text-navy mb-2">10,000+</div>
                <div className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Documents Processed</div>
              </div>
              <div className="p-4">
                <div className="text-4xl lg:text-5xl font-bold text-navy mb-2">40+</div>
                <div className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Districts Covered</div>
              </div>
              <div className="p-4">
                <div className="text-4xl lg:text-5xl font-bold text-navy mb-2">99.9%</div>
                <div className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Uptime Guaranteed</div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- [4] KEY FEATURES SECTION --- */}
      <section id="features" className="py-24 bg-offwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <span className="text-gold text-sm font-bold uppercase tracking-[0.2em] block mb-4">Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-heading text-navy mb-6">
              Everything a Public Leader Needs.<br />
              In One Secure Platform.
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
              From drafting official communications to tracking constituency data in real time — Neeti AI is purpose-built for the demands of public administration.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              id="feature-summarization"
              icon={<FileText className="text-gold" size={32} />}
              title="Intelligent Document Summarization"
              description="Process hundreds of pages of reports, circulars, and policy documents in seconds. Neeti AI extracts key decisions, action points, and critical information — so you focus on governance, not paperwork."
            />
            <FeatureCard 
              id="feature-transcription"
              icon={<Mic className="text-gold" size={32} />}
              title="Meeting Transcription & Briefing"
              description="Automatically transcribe, summarize, and generate action items from official meetings and conferences. Every word captured. Nothing missed."
            />
            <FeatureCard 
              id="feature-drafting"
              icon={<PenTool className="text-gold" size={32} />}
              title="Speech & Official Response Drafting"
              description="Generate contextually accurate speeches, press statements, and official correspondence in your voice — reviewed, refined, and ready to deliver."
            />
            <FeatureCard 
              id="feature-tracking"
              icon={<Map className="text-gold" size={32} />}
              title="Constituency & Community Data Tracking"
              description="Monitor development indices, grievance statuses, and demographic data across your jurisdiction — all on a single, real-time intelligence dashboard."
            />
            <FeatureCard 
              id="feature-calendar"
              icon={<Calendar className="text-gold" size={32} />}
              title="Schedule & Priority Management"
              description="Intelligently organise your calendar, flag urgent matters, and ensure no critical appointment, deadline, or follow-up ever goes unattended."
            />
            <FeatureCard 
              id="feature-insights"
              icon={<Zap className="text-gold" size={32} />}
              title="Real-Time Policy & Regulatory Insights"
              description="Stay ahead with instant access to relevant government orders, policy updates, and regulatory changes — summarised and delivered contextually."
            />
          </div>
        </div>
      </section>

      {/* --- [5] HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-20">
            <span className="text-gold text-sm font-bold uppercase tracking-[0.2em] block mb-4">Process</span>
            <h2 className="text-4xl md:text-5xl font-heading text-navy mb-6">
              Simple to Use.<br />
              Serious in Purpose.
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
              Neeti AI is designed so that any government official — regardless of technical background — can be fully operational within minutes.
            </p>
          </FadeInSection>

          <FadeInSection>
            <div className="relative">
              {/* Connecting Line between steps (desktop only) */}
              <div className="hidden lg:block absolute top-6 left-[10%] right-[10%] h-[1px] bg-gold/50 z-0"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-6 relative z-10">
                <StepCard 
                  number="1"
                  title="Register & Verify"
                  description="Sign up using your official government credentials. Your identity is verified through a secure, multi-layer authentication process."
                />
                <StepCard 
                  number="2"
                  title="Set Up Your Profile"
                  description="Define your department, jurisdiction, and areas of priority. Neeti AI personalises your dashboard based on your role and responsibilities."
                />
                <StepCard 
                  number="3"
                  title="Upload, Interact & Decide"
                  description="Upload documents, ask questions in plain language, schedule meetings, and receive intelligent recommendations — all within a single interface."
                />
                <StepCard 
                  number="4"
                  title="Act with Confidence"
                  description="With accurate summaries, reliable data, and AI-drafted communications at hand, take decisions faster and govern with greater impact."
                />
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- [6] TESTIMONIALS SECTION --- */}
      <section id="testimonials" className="py-24 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <span className="text-gold text-sm font-bold uppercase tracking-[0.2em] block mb-4">Trusted By Leaders</span>
            <h2 className="text-4xl md:text-5xl font-heading text-white">
              What Public Officials Are Saying.
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeInSection>
              <TestimonialCard 
                quote="Neeti AI has fundamentally changed how I prepare for district reviews. What used to take my team three days now takes three hours."
                author="District Collector, Rajasthan"
              />
            </FadeInSection>
            <FadeInSection>
              <TestimonialCard 
                quote="The document summarisation feature alone has saved countless hours of administrative effort. Every official should have access to this."
                author="Additional Secretary, Ministry of Rural Development"
              />
            </FadeInSection>
            <FadeInSection>
              <TestimonialCard 
                quote="For the first time, I have a real-time view of grievance redressal across my entire constituency. Neeti AI delivers what governance demands."
                author="Member of Legislative Assembly, Maharashtra"
              />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* --- [7] FINAL CTA SECTION --- */}
      <section className="py-24 bg-offwhite">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="bg-navy p-12 md:p-16 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gold"></div>
              
              <h2 className="text-3xl md:text-5xl font-heading text-white mb-6">
                Governance Deserves Better Tools.<br />
                Start Today.
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
                Join hundreds of officials already using Neeti AI to serve their citizens faster, smarter, and with greater accountability.
              </p>
              
              <Link to="/login" className="bg-gold hover:bg-gold/90 text-navy px-8 py-4 rounded-sm text-lg font-bold transition-colors inline-block mb-8 shadow-lg">
                Create Your Official Account &rarr;
              </Link>
              
              <div className="text-white/60 text-sm space-y-1">
                <p>Access is restricted to verified government officials and public administrators only.</p>
                <p>Your data is protected under the highest standards of government-grade security.</p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- [8] FOOTER --- */}
      <footer className="bg-navy border-t border-white/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-12">
            
            <div className="mb-8 md:mb-0 text-center md:text-left">
              <span className="text-2xl font-bold font-heading text-white tracking-wide block mb-2">
                Neeti AI
              </span>
              <span className="text-sm text-white/70">
                Intelligence in Service of the Nation.
              </span>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm text-white/80">
              <a href="#" className="hover:text-white hover:text-gold transition-colors">About Us</a>
              <a href="#features" className="hover:text-white hover:text-gold transition-colors">Features</a>
              <a href="#" className="hover:text-white hover:text-gold transition-colors">Security & Privacy</a>
              <a href="#" className="hover:text-white hover:text-gold transition-colors">Contact Us</a>
              <a href="#" className="hover:text-white hover:text-gold transition-colors">Terms of Use</a>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-xs text-white/50">
            &copy; 2025 Neeti AI. All Rights Reserved. | Built for Bharat's Public Leaders.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-components for repeatable sections

function FeatureCard({ id, icon, title, description }) {
  return (
    <div id={id} className="scroll-mt-24 h-full">
      <FadeInSection>
        <div className="bg-white p-8 border-l-4 border-navy shadow-sm hover:shadow-md transition-shadow h-full flex flex-col group">
          <div className="mb-6 bg-offwhite w-16 h-16 flex items-center justify-center rounded-sm transition-colors group-hover:bg-navy/5">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-navy mb-4 font-heading">{title}</h3>
          <p className="text-gray-600 leading-relaxed flex-grow">{description}</p>
        </div>
      </FadeInSection>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
      <div className="w-12 h-12 rounded-full border-2 border-gold bg-white text-navy font-bold text-xl flex items-center justify-center mb-6 z-10 mx-auto lg:mx-0 shadow-sm relative">
        {number}
      </div>
      <h3 className="text-xl font-bold text-navy mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed lg:pr-4">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, author }) {
  return (
    <div className="bg-[#0f213a] p-8 border-t-2 border-gold rounded-sm h-full flex flex-col relative">
      <Quote className="text-gold/20 absolute top-6 right-6" size={48} />
      <p className="text-white text-lg italic leading-relaxed mb-8 flex-grow relative z-10">"{quote}"</p>
      <p className="text-white/50 text-sm font-semibold tracking-wider uppercase">{author}</p>
    </div>
  );
}
