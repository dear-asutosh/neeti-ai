import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-6 border-t border-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Settings & Security</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Profile Configuration</h3>
            <p className="text-sm text-gray-500">Update your account detail preferences.</p>
          </div>
          
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Security</h3>
            <p className="text-sm text-gray-500">Manage passwords and two-factor authentication.</p>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">System Preferences</h3>
            <p className="text-sm text-gray-500">Adjust notifications and global tools settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
