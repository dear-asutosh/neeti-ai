import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Camera, Loader2, User } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { currentUser, dbUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size cannot exceed 5MB.");
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      // Upload file to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const data = await response.json();
      const downloadURL = data.secure_url;

      // Update Firebase Auth Profile
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });

      // Update Firestore DB
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { photoURL: downloadURL }, { merge: true });

      setSuccess("Profile picture updated successfully.");
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError("Failed to upload profile picture.");
    } finally {
      setUploading(false);
      // Reset input so they can upload again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentPhotoURL = dbUser?.photoURL || currentUser?.photoURL;

  return (
    <div className="p-6 md:p-10 font-sans min-h-screen bg-transparent">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <div className="bg-zinc-900 rounded-xl p-3 shadow-inner border border-zinc-800">
            <SettingsIcon className="w-8 h-8 text-zinc-100" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-50">Settings & Security</h2>
            <p className="text-sm text-zinc-400 mt-1">Manage your account credentials, preferences, and profile appearance.</p>
          </div>
        </div>
        
        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl text-sm flex items-center gap-2">
            <span className="font-semibold">Success:</span> {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Profile Config Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Configuration Card */}
            <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-zinc-700">
              <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/50">
                <h3 className="text-lg font-semibold text-zinc-50">Profile Details</h3>
                <p className="text-xs text-zinc-400 mt-1">This information will be displayed publicly across your dashboard.</p>
              </div>
              
              <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-8 items-start">
                {/* Avatar Uploader */}
                <div className="flex flex-col items-center space-y-4 shrink-0">
                  <div className="relative group rounded-full overflow-hidden w-36 h-36 border-4 border-zinc-800 shadow-xl flex items-center justify-center bg-zinc-950 transition-transform duration-300 hover:scale-[1.02]">
                    {currentPhotoURL ? (
                      <img src={currentPhotoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-14 h-14 text-zinc-600" />
                    )}
                    
                    {/* Upload Overlay */}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-white mb-2 drop-shadow-md" />
                          <span className="text-white text-xs font-semibold tracking-wide uppercase">Change Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors uppercase tracking-widest disabled:opacity-50"
                  >
                    {uploading ? 'Processing...' : 'Upload New'}
                  </button>
                </div>

                {/* Input Fields */}
                <div className="flex-1 w-full space-y-5">
                  <div className="space-y-1.5">
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">Display Name</label>
                     <input 
                       disabled 
                       value={dbUser?.displayName || currentUser?.displayName || ''} 
                       className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-300 font-medium cursor-not-allowed focus:outline-none transition-colors" 
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">Email Address</label>
                     <input 
                       disabled 
                       value={currentUser?.email || ''} 
                       className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-300 font-medium cursor-not-allowed focus:outline-none transition-colors" 
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">Designation / Role</label>
                     <input 
                       disabled 
                       value={dbUser?.department || dbUser?.role || ''} 
                       className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-300 font-medium capitalize cursor-not-allowed focus:outline-none transition-colors" 
                     />
                  </div>
                  <p className="text-[11px] text-zinc-500 pt-2 flex items-center gap-1.5">
                     <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                     Core credentials are managed securely by the administrative system.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Security Section */}
            <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-zinc-700 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div>
                  <h3 className="text-lg font-semibold text-zinc-50 flex items-center gap-2">
                    <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Password & Security
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">Manage your password, 2FA, and robust security preferences.</p>
               </div>
               <button disabled className="shrink-0 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-semibold text-zinc-200 transition-colors opacity-50 cursor-not-allowed shadow-sm uppercase tracking-wide">
                 Reset Password
               </button>
            </div>
          </div>

          {/* Right Column: Sidebar Settings */}
          <div className="space-y-8">
            
            {/* System Preferences */}
            <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 transition-all duration-300 hover:shadow-md hover:border-zinc-700 p-6 flex flex-col h-[280px]">
              <h3 className="text-lg font-semibold text-zinc-50 flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                System Notifications
              </h3>
              <p className="text-sm text-zinc-400 mb-6">Receive alerts for document summarization, new insights, or schedule updates.</p>
              
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                 <span className="text-zinc-500 text-sm font-medium">Coming Soon</span>
              </div>
              
              <button disabled className="mt-6 w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-semibold text-zinc-200 transition-colors opacity-50 cursor-not-allowed shadow-sm">
                Configure Alerts
              </button>
            </div>

            {/* Appearance Preferences */}
            <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 transition-all duration-300 hover:shadow-md hover:border-zinc-700 p-6">
              <h3 className="text-lg font-semibold text-zinc-50 flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                Appearance
              </h3>
              <p className="text-sm text-zinc-400 mb-4">Select your preferred theme.</p>
              
              <div className="flex gap-3">
                <div className="flex-1 py-3 bg-zinc-950 border-2 border-zinc-700 rounded-xl text-center cursor-pointer shadow-sm relative overflow-hidden">
                   <div className="absolute inset-0 bg-blue-500/10"></div>
                   <span className="relative text-sm font-medium text-white">Dark Mode</span>
                </div>
                <div className="flex-1 py-3 bg-zinc-800 border-2 border-transparent hover:border-zinc-600 rounded-xl text-center cursor-not-allowed opacity-50">
                   <span className="text-sm font-medium text-zinc-300">Light Mode</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
