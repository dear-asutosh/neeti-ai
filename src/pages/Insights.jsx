import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function Insights() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Real-time Insights</h2>
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col items-center justify-center min-h-100">
        <BarChart3 className="w-16 h-16 text-indigo-400 mb-4" />
        <p className="text-gray-600 text-center max-w-md">
          View analytics, public sentiment tracking, and comprehensive statistical insights for your constituency here.
        </p>
      </div>
    </div>
  );
}
