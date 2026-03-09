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
      <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 mb-2 transition-colors">
        <Link to="/constituency" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm font-bold">
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-zinc-900 dark:text-zinc-100 text-sm font-black transition-colors">All Complaints</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">All Complaints</h1>
        <Link 
          to="/constituency/complaints/new" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
        >
          <Plus className="w-4 h-4" />
          Add New Complaint
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5 shadow-sm transition-all">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by Citizen Name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: statusFilter, setter: setStatusFilter, placeholder: 'All Statuses', options: ['Pending', 'In Progress', 'Resolved'] },
              { value: wardFilter, setter: setWardFilter, placeholder: 'All Wards', options: [...Array(10)].map((_, i) => `Ward ${i + 1}`) },
              { value: typeFilter, setter: setTypeFilter, placeholder: 'All Issue Types', options: ['Road', 'Water', 'Electricity', 'Sanitation', 'Healthcare', 'Education', 'Other'] },
              { value: priorityFilter, setter: setPriorityFilter, placeholder: 'All Priorities', options: ['High', 'Medium', 'Low'] },
            ].map((f, idx) => (
              <select 
                key={idx}
                value={f.value} 
                onChange={(e) => f.setter(e.target.value)}
                className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm font-bold text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="">{f.placeholder}</option>
                {f.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-zinc-800 transition-colors">
          <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
            <thead className="text-[10px] uppercase font-black tracking-widest bg-gray-50 dark:bg-zinc-950/50 text-zinc-400 dark:text-zinc-600 border-b border-gray-100 dark:border-zinc-800 transition-colors">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap">ID</th>
                <th className="px-5 py-4 whitespace-nowrap">Citizen Name</th>
                <th className="px-5 py-4 whitespace-nowrap">Ward</th>
                <th className="px-5 py-4 whitespace-nowrap">Issue Type</th>
                <th className="px-5 py-4 whitespace-nowrap">Priority</th>
                <th className="px-5 py-4 whitespace-nowrap">Date Raised</th>
                <th className="px-5 py-4 whitespace-nowrap">Assigned To</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 transition-colors">
              {filteredComplaints.map(complaint => (
                <tr key={complaint.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group" onClick={() => navigate(`/constituency/complaints/${complaint.id}`)}>
                  <td className="px-5 py-4 font-mono text-zinc-400 dark:text-zinc-600 text-xs transition-colors">{complaint.id.substring(0, 6).toUpperCase()}</td>
                  <td className="px-5 py-4 text-zinc-900 dark:text-zinc-200 font-bold transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{complaint.citizenName}</td>
                  <td className="px-5 py-4 font-medium">{complaint.ward}</td>
                  <td className="px-5 py-4">{complaint.issueType}</td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1.5 font-bold text-xs uppercase transition-colors
                      ${complaint.priority === 'High' ? 'text-red-600 dark:text-red-400' : 
                        complaint.priority === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full transition-colors ${complaint.priority === 'High' ? 'bg-red-500' : complaint.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium">{new Date(complaint.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4 font-medium">{complaint.assignedTo}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all
                      ${complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' : 
                        complaint.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-500/20' : 
                        'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20'}
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
