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
import { auth, db } from '../services/firebase';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');

  const navigate = useNavigate();
  // Redirect only on newly successful registrations
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successMsg, navigate]);

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
      
      setLoading(false);
      navigate('/');
      
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
        setLoading(false);
        navigate('/');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        await updateProfile(user, { displayName: fullName });
        
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          email: user.email,
          role: 'leader',
          department: department,
          displayName: fullName,
          createdAt: serverTimestamp()
        });
        setSuccessMsg('Registration successful! Redirecting to dashboard...');
        setLoading(false);
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

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen bg-offwhite flex items-center justify-center p-4 font-body overflow-hidden">
      
      {/* Main Container */}
      <div className="relative w-full max-w-5xl h-[650px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Navy Overlay Panel that slides */}
        <div 
          className={`hidden md:flex absolute top-0 w-1/2 h-full bg-navy text-white flex-col justify-center items-center p-12 transition-transform duration-700 ease-in-out z-20 ${
            isLogin ? 'translate-x-full' : 'translate-x-0'
          }`}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.05]" 
               style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>
          
          <div className="relative z-10 text-center flex flex-col items-center">
            <h1 className="text-4xl font-heading font-medium mb-6">
              {isLogin ? "Join Neeti AI." : "Welcome Back."}
            </h1>
            <p className="text-white/80 mb-10 text-lg leading-relaxed max-w-sm">
              {isLogin 
                ? "Experience India's first AI Co-Pilot built exclusively for tracking, drafting, and leading in public administration." 
                : "Log in to access your intelligent dashboard, review key documents, and continue your governance efforts."}
            </p>
            
            <button 
              onClick={toggleMode}
              className="px-8 py-3 border-2 border-white/30 hover:border-gold hover:text-gold rounded-sm uppercase tracking-widest text-sm font-semibold transition-colors duration-300"
            >
              {isLogin ? "Create Official Account" : "Sign In to Dashboard"}
            </button>
          </div>
        </div>

        {/* Forms Container */}
        <div className="w-full h-full relative flex md:w-full z-10">

          {/* S I G N   U P   F O R M (Left Side structurally, positioned relative) */}
          <div 
            className={`w-full md:w-1/2 h-full p-8 md:p-12 flex flex-col justify-center absolute top-0 left-0 transition-all duration-700 ease-in-out ${
              isLogin ? 'opacity-0 -translate-x-1/5 pointer-events-none' : 'opacity-100 translate-x-0 md:translate-x-full'
            }`}
          >
            <div className="max-w-sm mx-auto w-full">
              {/* Mobile toggler */}
              <div className="md:hidden text-center mb-8">
                <h2 className="text-2xl font-heading text-navy">Join Neeti AI</h2>
                <button onClick={toggleMode} className="text-gold text-sm font-semibold mt-2">
                  Already have an account? Sign In
                </button>
              </div>

              <h2 className="hidden md:block text-3xl font-heading font-bold text-navy mb-8">Official Registration</h2>
              
              {error && !isLogin && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
              )}
              {successMsg && !isLogin && (
                <div className="mb-4 bg-green-50 text-green-600 p-3 rounded text-sm">{successMsg}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1 uppercase tracking-wider">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1 uppercase tracking-wider">Official Email *</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1 uppercase tracking-wider">Department / Role</label>
                  <input 
                    type="text" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                    placeholder="e.g. District Magistrate, MLA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1 uppercase tracking-wider">Password *</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-navy hover:bg-navy/90 text-white font-semibold py-3 rounded-sm shadow-md transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Register Securely'}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex items-center justify-between">
                <hr className="w-full border-gray-200" />
                <span className="p-2 text-xs text-gray-400 uppercase tracking-widest bg-white">OR</span>
                <hr className="w-full border-gray-200" />
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors font-semibold text-navy disabled:opacity-50"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </button>
              </div>
            </div>
          </div>


          {/* L O G I N   F O R M (Right Side structurally, positioned relative) */}
          <div 
            className={`w-full md:w-1/2 h-full p-8 md:p-12 flex flex-col justify-center absolute top-0 left-0 md:left-1/2 transition-all duration-700 ease-in-out ${
              !isLogin ? 'opacity-0 translate-x-1/5 pointer-events-none' : 'opacity-100 translate-x-0 md:-translate-x-full'
            }`}
          >
             <div className="max-w-sm mx-auto w-full">
              {/* Mobile toggler */}
              <div className="md:hidden text-center mb-8">
                <h2 className="text-2xl font-heading text-navy">Welcome Back</h2>
                <button onClick={toggleMode} className="text-gold text-sm font-semibold mt-2">
                  Need an account? Sign Up
                </button>
              </div>

              <h2 className="hidden md:block text-3xl font-heading font-bold text-navy mb-8">Official Access</h2>
              
              {error && isLogin && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1 uppercase tracking-wider">Official Email *</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-navy uppercase tracking-wider">Password *</label>
                    <a href="#" className="text-xs text-gold hover:underline">Forgot?</a>
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-navy hover:bg-navy/90 text-white font-semibold py-3 rounded-sm shadow-md transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Authenticating...' : 'Secure Sign In'}
                  </button>
                </div>
              </form>

              <div className="mt-8 flex items-center justify-between">
                <hr className="w-full border-gray-200" />
                <span className="p-2 text-xs text-gray-400 uppercase tracking-widest bg-white">OR</span>
                <hr className="w-full border-gray-200" />
              </div>

              <div className="mt-8">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors font-semibold text-navy disabled:opacity-50"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  Sign In with Google
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
