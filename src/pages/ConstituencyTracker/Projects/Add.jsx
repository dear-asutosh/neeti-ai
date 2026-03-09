import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProject } from '../../../services/projectsService';
import { ChevronLeft, Save } from 'lucide-react';

export default function AddProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    ward: 'Ward 1',
    category: 'Road',
    budgetAllocated: 0,
    budgetSpent: 0,
    startDate: new Date().toISOString().split('T')[0], // yyyy-mm-dd format
    deadline: new Date().toISOString().split('T')[0],
    status: 'Planned',
    responsiblePerson: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    // Store as ISO string
    setFormData(prev => ({ ...prev, [name]: new Date(value).toISOString() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProject(formData);
      navigate('/constituency/projects');
    } catch (error) {
      console.error("Error creating project", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract yyyy-mm-dd from ISO for date inputs
  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-zinc-400 mb-2">
        <Link to="/constituency/projects" className="hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Projects & Schemes
        </Link>
        <span>/</span>
        <span className="text-zinc-100 text-sm">New Project</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-100">Add New Project</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Project Name</label>
            <input 
              type="text" 
              name="projectName"
              required
              value={formData.projectName}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              placeholder="e.g. Ward 4 Pothole Repair Drive"
            />
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
              <label className="text-sm font-medium text-zinc-300">Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              >
                {['Road', 'Water Supply', 'Electricity', 'School', 'Hospital', 'Sanitation', 'Public Infrastructure', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Budget Allocated (₹)</label>
              <input 
                type="number" 
                name="budgetAllocated"
                required
                min="0"
                value={formData.budgetAllocated}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="2000000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Budget Spent (₹)</label>
              <input 
                type="number" 
                name="budgetSpent"
                required
                min="0"
                max={formData.budgetAllocated || undefined}
                value={formData.budgetSpent}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="50000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Start Date</label>
              <input 
                type="date" 
                name="startDate"
                required
                value={formatDateForInput(formData.startDate)}
                onChange={handleDateChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 scheme-dark"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Deadline</label>
              <input 
                type="date" 
                name="deadline"
                required
                value={formatDateForInput(formData.deadline)}
                onChange={handleDateChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 scheme-dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Current Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Responsible Person/Contractor</label>
              <input 
                type="text" 
                name="responsiblePerson"
                required
                value={formData.responsiblePerson}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="Name of official or contractor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Implementation Details / Description</label>
            <textarea 
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 resize-none"
              placeholder="Provide a thorough description of the project scope..."
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link 
              to="/constituency/projects"
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
              Save Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
