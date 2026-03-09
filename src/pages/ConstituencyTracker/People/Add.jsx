import React, { useState } from 'react';
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
      navigate('/constituency/people');
    } catch (error) {
      console.error("Error creating person", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-zinc-400 mb-2">
        <Link to="/constituency/people" className="hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Stakeholders
        </Link>
        <span>/</span>
        <span className="text-zinc-100 text-sm">New Profile</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-100">Add New Stakeholder</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Role / Designation</label>
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
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
              <label className="text-sm font-medium text-zinc-300">Department</label>
              <input 
                type="text" 
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="e.g. PWD, Education, Political"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Ward Responsibility</label>
              <select 
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
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
              <label className="text-sm font-medium text-zinc-300">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="10-digit mobile number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="Optional email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Notes / Context</label>
            <textarea 
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 resize-none"
              placeholder="Any additional background, affiliations, or context about this person..."
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link 
              to="/constituency/people"
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
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
