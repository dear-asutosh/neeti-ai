import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Camera, Loader2, User, ShieldCheck } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { currentUser, dbUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // States for profile editing
  const [fullName, setFullName] = useState(dbUser?.displayName || currentUser?.displayName || '');
  const [designation, setDesignation] = useState(dbUser?.designation || dbUser?.department || '');
  
  // UI states
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Update Firebase Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: fullName
      });

      // Update Firestore DB
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { 
        displayName: fullName,
        designation: designation 
      }, { merge: true });

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size cannot exceed 5MB.");
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Cloudinary upload failed');

      const data = await response.json();
      const downloadURL = data.secure_url;

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { photoURL: downloadURL }, { merge: true });

      setSuccess("Profile picture updated successfully.");
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError("Failed to upload profile picture.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentPhotoURL = dbUser?.photoURL || currentUser?.photoURL;
  const currentDisplayName = dbUser?.displayName || currentUser?.displayName || '';
  const currentDesignation = dbUser?.designation || dbUser?.department || '';
  const hasChanged = fullName !== currentDisplayName || designation !== currentDesignation;

  return (
    <div className="p-6 md:p-10 font-sans min-h-screen bg-transparent transition-colors duration-300 animate-in fade-in duration-700">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-zinc-800 transition-all duration-300">
            <SettingsIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Account Settings</h2>
            <p className="text-sm text-zinc-400 mt-1">Refine your administrative profile and platform preferences.</p>
          </div>
        </div>
        
        {/* Alerts */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-2xl text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="font-medium">{success}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Detail Form */}
            <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-zinc-900/40 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800/50 backdrop-blur-xl overflow-hidden transition-all duration-300">
              <div className="p-6 border-b border-gray-100 dark:border-zinc-800/60 bg-gray-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Profile Details</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 tracking-wide">Update your administrative credentials and designation.</p>
                </div>
                <button 
                  type="submit"
                  disabled={saving || !hasChanged}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale-[0.5] disabled:cursor-not-allowed flex items-center gap-2 group"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
              
              <div className="p-8 md:p-10 flex flex-col sm:flex-row gap-10 items-start">
                {/* Avatar Uploader */}
                <div className="flex flex-col items-center space-y-5 shrink-0">
                  <div className="relative group rounded-[2.5rem] overflow-hidden w-40 h-40 border-8 border-gray-50 dark:border-zinc-800/30 shadow-2xl flex items-center justify-center bg-gray-100 dark:bg-zinc-950 transition-all duration-500 hover:shadow-indigo-500/10">
                    {currentPhotoURL ? (
                      <img src={currentPhotoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-16 h-16 text-zinc-600" />
                    )}
                    
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-10 h-10 text-white mb-2 drop-shadow-xl" />
                          <span className="text-white text-[10px] font-black tracking-widest uppercase">Update Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors uppercase tracking-[0.2em] disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload Avatar'}
                    </button>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="flex-1 w-full space-y-6">
                  <div className="space-y-2">
                     <label className="block text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] pl-1">Full Name</label>
                     <input 
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       placeholder="Hon. Rahul Sharma"
                       className="w-full px-5 py-4 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="block text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] pl-1">Official Designation</label>
                     <input 
                       value={designation}
                       onChange={(e) => setDesignation(e.target.value)}
                       placeholder="e.g. District Magistrate, MLA"
                       className="w-full px-5 py-4 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                     />
                  </div>

                  <div className="space-y-2 opacity-60">
                     <label className="block text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] pl-1">Email Address (Locked)</label>
                     <input 
                       disabled 
                       value={currentUser?.email || ''} 
                       className="w-full px-5 py-4 bg-gray-100/50 dark:bg-zinc-950/20 border border-gray-200 dark:border-zinc-800/50 rounded-2xl text-zinc-500 dark:text-zinc-400 font-medium cursor-not-allowed focus:outline-none" 
                     />
                  </div>
                  
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2 pt-2">
                     <ShieldCheck className="w-4 h-4 text-emerald-500" />
                     Encrypted Administrative Core
                  </p>
                </div>
              </div>
            </form>
            
            {/* Security Section */}
            <div className="bg-white dark:bg-zinc-900/40 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800/50 backdrop-blur-xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:border-gray-200 dark:hover:border-zinc-700">
               <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Password & Security
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">Manage your access credentials and robust security preferences.</p>
               </div>
               <button disabled className="shrink-0 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-transparent rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed transition-all opacity-50">
                 Update Password
               </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* System Preferences */}
            <div className="bg-white dark:bg-zinc-900/40 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800/50 backdrop-blur-xl p-8 flex flex-col h-[280px]">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                Notifications
              </h3>
              <p className="text-sm text-zinc-400 mb-6">Receive alerts for summaries and schedule updates.</p>
              
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-gray-50/50 dark:bg-zinc-950/30">
                 <span className="text-zinc-400 dark:text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Deployment Pending</span>
              </div>
            </div>

            {/* Appearance Preferences */}
            <div className="bg-white dark:bg-zinc-900/40 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800/50 backdrop-blur-xl p-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                Appearance
              </h3>
              <p className="text-sm text-zinc-400 mb-6">Select your UI personality.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => toggleTheme('dark')}
                  className={`px-5 py-4 rounded-2xl text-left relative overflow-hidden transition-all duration-300 border-2 ${
                    theme === 'dark' ? 'bg-zinc-950 border-indigo-500/50' : 'bg-zinc-800/50 border-transparent'
                  }`}
                >
                   <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-zinc-500'}`}>Command (Dark)</span>
                   {theme === 'dark' && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                </button>
                <button 
                  onClick={() => toggleTheme('light')}
                  className={`px-5 py-4 rounded-2xl text-left relative overflow-hidden transition-all duration-300 border-2 ${
                    theme === 'light' ? 'bg-white border-indigo-500/50 shadow-xl shadow-indigo-500/5' : 'bg-gray-50 border-transparent'
                  }`}
                >
                   <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-500'}`}>Official (Light)</span>
                   {theme === 'light' && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
