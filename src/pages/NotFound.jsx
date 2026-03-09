import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Sparkles, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6 font-sans overflow-hidden transition-colors duration-500 relative">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/10 dark:bg-gold/5 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Animated Icon Container */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150"></div>
          <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-2xl flex items-center justify-center group transform hover:rotate-6 transition-transform duration-500 backdrop-blur-xl">
             <FileQuestion className="w-16 h-16 md:w-20 md:h-20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
             <div className="absolute -top-2 -right-2 bg-gold p-2 rounded-xl shadow-lg border-2 border-white dark:border-zinc-900 animate-bounce">
                <Sparkles className="w-5 h-5 text-white" />
             </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-4">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
            Lost in Governance?
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed font-medium">
            The page you are looking for has either been moved, deleted, or never existed in the legislative archives.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-900 transition-all font-bold text-zinc-900 dark:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] group"
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Footer Info */}
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600 pt-8">
           Official Information Management System
        </p>
      </div>
    </div>
  );
}
