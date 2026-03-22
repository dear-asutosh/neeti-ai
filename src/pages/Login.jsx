import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronRight, AlertCircle, User, Mail, Lock, Loader2, CheckCircle2, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { auth, db } from '../services/firebase';
import { generateOTP, sendOTPEmail } from '../services/emailService';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');

  // OTP Verification States
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate();
  // Redirect only on newly successful registrations
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        // Only redirect if we haven't manually navigated away
        if (window.location.pathname === '/login') {
          navigate('/');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successMsg, navigate]);

  // Resend Timer Effect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Removed getRedirectResult useEffect as we will use signInWithPopup now

  const handleGoogleSignIn = async () => {
    if (loading) return;
    try {
      setError('');
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          role: 'leader',
          displayName: user.displayName,
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp()
        });
      } else {
        // Update photoURL if they log in and it's missing or changed in db
        await setDoc(userRef, {
          photoURL: user.photoURL || null
        }, { merge: true });
      }
      setSuccessMsg(isLogin ? 'Login successful! Redirecting to dashboard...' : 'Registration successful! Redirecting to dashboard...');
      setLoading(false);
      
      // Success will natively trigger navigation in the dependency array useEffect
    } catch (err) {
      console.error("Google sign in error:", err);
      // Ignore popup closed errors without displaying a scary message
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google.');
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Login successful! Redirecting to dashboard...');
        setLoading(false);
      } else {
        // Step 1: Initiating Signup with OTP
        const newOTP = generateOTP();
        setGeneratedOTP(newOTP);
        
        const sent = await sendOTPEmail(email, newOTP, fullName);
        if (sent) {
          setShowOTP(true);
          setResendTimer(60); // 60 seconds cooldown
          setLoading(false);
        } else {
          throw new Error("Failed to send verification email. Please try again.");
        }
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. If you don't have an account, please switch to Sign Up.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("That email is already registered. Please sign in instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || `Failed to ${isLogin ? 'sign in' : 'register'}. Please try again.`);
      }
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (otp !== generatedOTP) {
      setError("Invalid verification code. Please check and try again.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      await updateProfile(user, { displayName: fullName });
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        role: 'leader',
        designation: designation,
        displayName: fullName,
        createdAt: serverTimestamp()
      });
      
      setSuccessMsg('Registration successful! Redirecting to dashboard...');
      setLoading(false);
    } catch (err) {
      console.error("OTP Verification Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please go back and sign in, or use a different email.");
      } else if (err.code === 'auth/weak-password') {
        setError("The password is too weak. Please use at least 6 characters.");
      } else {
        setError(err.message || "Failed to finalize registration.");
      }
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const newOTP = generateOTP();
      setGeneratedOTP(newOTP);
      const sent = await sendOTPEmail(email, newOTP, fullName);
      if (sent) {
        setResendTimer(60);
        setSuccessMsg("A new verification code has been sent.");
      } else {
        setError("Failed to resend code.");
      }
    } catch (err) {
      setError("An error occurred while resending.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowOTP(false);
    setError('');
    setSuccessMsg('');
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-0 sm:p-4 font-sans overflow-hidden transition-colors duration-500 relative">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/10 dark:bg-gold/5 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Main Card Container */}
      <div className="relative w-full max-w-5xl h-screen sm:h-[700px] bg-white dark:bg-zinc-900/40 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border-0 sm:border border-gray-100 dark:border-zinc-800/50 backdrop-blur-xl transition-all duration-500">
        
        {/* Decorative Side Panel (Desktop Only) */}
        <div 
          className={`hidden md:flex absolute top-0 w-1/2 h-full bg-navy dark:bg-zinc-900 transition-transform duration-[800ms] cubic-bezier(0.4, 0, 0.2, 1) z-20 ${
            isLogin ? 'translate-x-full' : 'translate-x-0'
          }`}
        >
          {/* Enhanced Background with Mesh Gradient Effect */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-gold/20"></div>
          </div>
          
          <div className="relative z-10 w-full h-full p-12 lg:p-16 flex flex-col justify-between text-white">
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="Neeti AI" className="w-10 h-10 rounded-xl" />
              <span className="text-xl font-black tracking-tighter">NEETI AI</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">
                {isLogin ? "Lead with \nIntelligence." : "Empower your \nGovernance."}
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
                {isLogin 
                  ? "Access India's premier AI Co-Pilot designed for administrative excellence and public leadership." 
                  : "Join the next generation of digital governance. Draft, track, and analyze with unprecedented precision."}
              </p>
              
              <div className="pt-4">
                <button 
                  onClick={toggleMode}
                  className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl transition-all duration-300 backdrop-blur-md"
                >
                  <span className="text-sm font-bold tracking-widest uppercase text-white group-hover:text-gold transition-colors">
                    {isLogin ? "Create Account" : "Back to Sign In"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 tracking-widest uppercase">
              <span>Trusted by 500+ Officials</span>
              <div className="w-1 h-1 bg-zinc-800 rounded-full"></div>
              <span>Secured by Firebase</span>
            </div>
          </div>
        </div>

        {/* Forms Container */}
        <div className="flex-1 relative overflow-y-auto sm:overflow-hidden bg-white dark:bg-transparent">
          
          {/* Sign Up Form */}
          <div 
            className={`absolute inset-0 p-8 lg:p-16 flex flex-col justify-center transition-all duration-[800ms] ${
              isLogin ? 'opacity-0 scale-95 pointer-events-none translate-x-[-10%]' : 'opacity-100 scale-100 md:ml-[50%] z-10'
            }`}
          >
            <div className="max-w-md mx-auto w-full space-y-8">
              {!showOTP ? (
                <>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Official Registration</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Join the platform for administrative public service.</p>
                  </div>

                  {error && !isLogin && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Full Name</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                            placeholder="Hon. Rahul Sharma"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Official Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="official@nic.in"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Designation</label>
                          <input 
                            type="text" value={designation} onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. District Magistrate, MLA"
                            className="w-full px-4 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Password</label>
                          <input 
                            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit" disabled={loading}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Securely'}
                    </button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-zinc-800"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-white dark:bg-zinc-900 px-4 text-zinc-400">Or Continue With</span></div>
                  </div>

                  <button
                    onClick={handleGoogleSignIn} disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all font-bold text-zinc-900 dark:text-white group"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Google Services
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowOTP(false)}
                      className="flex items-center gap-2 text-zinc-500 hover:text-indigo-500 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Change Email
                    </button>
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Verify Identity</h2>
                       <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                         We've sent a 6-digit verification code to <span className="text-indigo-500 font-bold">{email}</span>.
                       </p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 text-sm animate-in fade-in slide-in-from-top-1">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      {successMsg}
                    </div>
                  )}

                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Verification Code</label>
                      <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type="text" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white text-2xl tracking-[0.5em] font-black text-center"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" disabled={loading || otp.length !== 6}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <p className="text-sm text-zinc-500">
                      Didn't receive the code?{' '}
                      <button 
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0 || loading}
                        className={`font-bold transition-colors ${resendTimer > 0 ? 'text-zinc-400 cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-400'}`}
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Login Form */}
          <div 
            className={`absolute inset-0 p-8 lg:p-16 flex flex-col justify-center transition-all duration-[800ms] ${
              !isLogin ? 'opacity-0 scale-95 pointer-events-none translate-x-[10%]' : 'opacity-100 scale-100 md:mr-[50%] z-10'
            }`}
          >
            <div className="max-w-md mx-auto w-full space-y-10">
              <div className="space-y-4">
                <div className="md:hidden flex flex-col items-center gap-4 mb-2">
                   <img src="/icon.png" alt="Neeti AI" className="w-14 h-14 rounded-2xl shadow-xl shadow-indigo-600/20" />
                   <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">NEETI AI</h1>
                </div>
                <div className="space-y-1">
                  <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Official Access</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium">Please authenticate to access your command center.</p>
                </div>
              </div>

              {error && isLogin && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {successMsg && isLogin && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 text-sm animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Official Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="official@nic.in"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center pr-1">
                       <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Secure Password</label>
                       <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gold hover:text-gold/80 transition-colors">Recover</a>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" disabled={loading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <span>Secure Sign In</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-zinc-800"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-white dark:bg-zinc-900 px-4 text-zinc-400">Authentication Gateway</span></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGoogleSignIn} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-4 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all font-bold text-zinc-900 dark:text-white group"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Google</span>
                </button>
                <button 
                  onClick={toggleMode}
                  className="md:hidden flex-1 px-4 py-4 bg-zinc-900 dark:bg-zinc-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="absolute bottom-6 w-full text-center hidden sm:block">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600">
           Protected by Advanced Public Safety Infrastructure
        </p>
      </footer>
    </div>
  );
}
