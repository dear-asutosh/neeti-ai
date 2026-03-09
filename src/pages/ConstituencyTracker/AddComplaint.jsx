import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createComplaint } from '../../services/complaintsService';
import { ChevronLeft, Save } from 'lucide-react';

export default function AddComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    citizenName: '',
    phoneNumber: '',
    ward: 'Ward 1',
    issueType: 'Road',
    description: '',
    priority: 'Medium',
    assignedTo: '',
    status: 'Pending'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createComplaint(formData);
      navigate('/constituency/complaints');
    } catch (error) {
      console.error("Error creating complaint", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 mb-2 transition-colors">
        <Link to="/constituency/complaints" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm font-bold">
          <ChevronLeft className="w-4 h-4" />
          All Complaints
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-zinc-900 dark:text-zinc-100 text-sm font-black transition-colors">New Complaint</span>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xl transition-all">
        <div className="px-8 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 transition-colors">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Record New Complaint</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 transition-colors">Citizen Name</label>
              <input 
                type="text" 
                name="citizenName"
                required
                value={formData.citizenName}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 transition-colors">Phone Number</label>
              <input 
                type="tel" 
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 transition-colors">Ward</label>
              <select 
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none shadow-xs"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i} value={`Ward ${i + 1}`}>Ward {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 transition-colors">Issue Type</label>
              <select 
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none shadow-xs"
              >
                {['Road', 'Water', 'Electricity', 'Sanitation', 'Healthcare', 'Education', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 transition-colors">Issue Description</label>
            <textarea 
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none shadow-xs"
              placeholder="Describe the complaint in detail..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 transition-colors">Priority</label>
              <div className="flex gap-6 items-center h-12">
                {['Low', 'Medium', 'High'].map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="priority" 
                      value={p}
                      checked={formData.priority === p}
                      onChange={handleChange}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 transition-colors">Assigned To (Internal)</label>
              <input 
                type="text" 
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                placeholder="Official Name / Department"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 transition-colors">
            <Link 
              to="/constituency/complaints"
              className="px-6 py-2.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-900/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
