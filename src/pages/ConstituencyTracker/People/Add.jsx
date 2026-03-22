import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { createPerson } from '../../../services/peopleService';
import { ChevronLeft, Save } from 'lucide-react';

export default function AddPerson() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'Ward Member',
    department: '',
    ward: 'All Wards',
    phone: '',
    email: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPerson(formData);
      toast.success("Profile created successfully!");
      navigate('/constituency/people');
    } catch (error) {
      console.error("Error creating person", error);
      toast.error("Failed to create profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500 mb-2 transition-colors">
        <Link to="/constituency/people" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm font-bold">
          <ChevronLeft className="w-4 h-4" />
          Stakeholders
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 text-sm font-bold transition-colors">New Profile</span>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-all">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 transition-colors">
          <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Add New Stakeholder</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors">Role / Designation</label>
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="Ward Member">Ward Member</option>
                <option value="Government Official">Government Official</option>
                <option value="Contractor">Contractor</option>
                <option value="Party Worker">Party Worker</option>
                <option value="Community Leader">Community Leader</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors">Department</label>
              <input 
                type="text" 
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                placeholder="e.g. PWD, Education, Political"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors">Ward Responsibility</label>
              <select 
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="All Wards">All Wards / District Level</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i} value={`Ward ${i + 1}`}>Ward {i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                placeholder="10-digit mobile number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                placeholder="Optional email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors">Notes / Context</label>
            <textarea 
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none shadow-xs"
              placeholder="Any additional background, affiliations, or context about this person..."
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 transition-colors">
            <Link 
              to="/constituency/people"
              className="px-4 py-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
