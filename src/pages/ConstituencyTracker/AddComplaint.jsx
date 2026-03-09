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
      <div className="flex items-center gap-4 text-zinc-400 mb-2">
        <Link to="/constituency/complaints" className="hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" />
          All Complaints
        </Link>
        <span>/</span>
        <span className="text-zinc-100 text-sm">New Complaint</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-100">Add New Complaint</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Citizen Name</label>
              <input 
                type="text" 
                name="citizenName"
                required
                value={formData.citizenName}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Phone Number</label>
              <input 
                type="tel" 
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Ward</label>
              <select 
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i} value={`Ward ${i + 1}`}>Ward {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Issue Type</label>
              <select 
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              >
                {['Road', 'Water', 'Electricity', 'Sanitation', 'Healthcare', 'Education', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Issue Description</label>
            <textarea 
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 resize-none"
              placeholder="Describe the complaint in detail..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Priority</label>
              <div className="flex gap-4 items-center h-10">
                {['Low', 'Medium', 'High'].map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="priority" 
                      value={p}
                      checked={formData.priority === p}
                      onChange={handleChange}
                      className="accent-zinc-500"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Assigned To (Internal)</label>
              <input 
                type="text" 
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="Official Name / Department"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link 
              to="/constituency/complaints"
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="bg-zinc-100 hover:bg-white text-zinc-900 px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
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
