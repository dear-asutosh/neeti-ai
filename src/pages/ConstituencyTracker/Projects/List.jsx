import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects } from '../../../services/projectsService';
import { Search, Plus, Filter, Calendar, IndianRupee } from 'lucide-react';

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    const matchesWard = wardFilter ? p.ward === wardFilter : true;
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;

    return matchesSearch && matchesStatus && matchesWard && matchesCategory;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Projects & Schemes</h1>
          <p className="text-sm text-zinc-400">Track all development projects and fund allocations across wards.</p>
        </div>
        <Link 
          to="/constituency/projects/new" 
          className="bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Project
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by Project Name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select 
              value={wardFilter} 
              onChange={(e) => setWardFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="">All Wards</option>
              {[...Array(10)].map((_, i) => (
                <option key={i} value={`Ward ${i + 1}`}>Ward {i + 1}</option>
              ))}
            </select>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="">All Categories</option>
              {['Road', 'Water Supply', 'Electricity', 'School', 'Hospital', 'Sanitation', 'Public Infrastructure', 'Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border border-zinc-800">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">ID</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Project Name</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Ward & Category</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Budget</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Deadline</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Responsible</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProjects.map(project => (
                <tr key={project.id} className="hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/constituency/projects/${project.id}`)}>
                  <td className="px-4 py-4 font-mono text-zinc-500 align-top">{project.id.substring(0, 6)}</td>
                  <td className="px-4 py-4 text-zinc-200 font-medium align-top max-w-50 truncate" title={project.projectName}>
                    {project.projectName}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col space-y-1">
                      <span className="text-zinc-300">{project.ward}</span>
                      <span className="text-xs text-zinc-500">{project.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col space-y-1">
                      <span className="text-zinc-300 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3 text-zinc-500" />
                        {formatCurrency(project.budgetAllocated).replace('₹', '')}
                      </span>
                      {project.budgetSpent > 0 && (
                        <span className="text-xs text-zinc-500">
                          {Math.round((project.budgetSpent / project.budgetAllocated) * 100)}% Spent
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {new Date(project.deadline).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">{project.responsiblePerson}</td>
                  <td className="px-4 py-4 align-top">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                      ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                        project.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                        project.status === 'Cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        project.status === 'On Hold' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        'bg-zinc-800 text-zinc-300 border border-zinc-700'}
                    `}>
                      {project.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-zinc-500">
                    No projects match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
