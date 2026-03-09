import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getComplaints } from '../../services/complaintsService';
import { Search, Plus, Filter, ChevronLeft } from 'lucide-react';

export default function AllComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getComplaints();
      setComplaints(data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesWard = wardFilter ? c.ward === wardFilter : true;
    const matchesType = typeFilter ? c.issueType === typeFilter : true;
    const matchesPriority = priorityFilter ? c.priority === priorityFilter : true;

    return matchesSearch && matchesStatus && matchesWard && matchesType && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-zinc-400 mb-2">
        <Link to="/constituency" className="hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-zinc-100 text-sm">All Complaints</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-zinc-100">All Complaints</h1>
        <Link 
          to="/constituency/complaints/new" 
          className="bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Complaint
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by Citizen Name or ID..." 
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
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
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
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="">All Issue Types</option>
              {['Road', 'Water', 'Electricity', 'Sanitation', 'Healthcare', 'Education', 'Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border border-zinc-800">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">ID</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Citizen Name</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Ward</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Issue Type</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Priority</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Date Raised</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Assigned To</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredComplaints.map(complaint => (
                <tr key={complaint.id} className="hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/constituency/complaints/${complaint.id}`)}>
                  <td className="px-4 py-3 font-mono text-zinc-500">{complaint.id.substring(0, 6)}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{complaint.citizenName}</td>
                  <td className="px-4 py-3">{complaint.ward}</td>
                  <td className="px-4 py-3">{complaint.issueType}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5
                      ${complaint.priority === 'High' ? 'text-red-400' : 
                        complaint.priority === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}
                    `}>
                      <span className={`w-2 h-2 rounded-full ${complaint.priority === 'High' ? 'bg-red-400' : complaint.priority === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(complaint.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{complaint.assignedTo}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' : 
                        complaint.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}
                    `}>
                      {complaint.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-zinc-500">
                    No complaints match the current filters.
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
