import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getComplaints } from '../../services/complaintsService';
import { getProjects } from '../../services/projectsService';
import { getPeople } from '../../services/peopleService';
import { AlertCircle, Clock, CheckCircle2, Inbox, Briefcase, Users, ChevronRight, Activity } from 'lucide-react';

export default function ConstituencyDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [complaintsData, projectsData, peopleData] = await Promise.all([
        getComplaints(),
        getProjects(),
        getPeople()
      ]);
      setComplaints(complaintsData);
      setProjects(projectsData);
      setPeople(peopleData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const recentComplaints = complaints.slice(0, 5);

  // Compute Ward Health Matrix
  const wardsList = Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`);
  const wardHealth = wardsList.map(ward => ({
    ward,
    complaintCount: complaints.filter(c => c.ward === ward && c.status !== 'Resolved').length,
    projectCount: projects.filter(p => p.ward === ward && p.status === 'In Progress').length,
  })).sort((a, b) => b.complaintCount - a.complaintCount).slice(0, 5); // top 5 worst wards

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm p-5 rounded-2xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-300 rounded-xl transition-colors">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors">Recorded Issues</h3>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 transition-colors">{complaints.length}</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm p-5 rounded-2xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors">Active Projects</h3>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 transition-colors">{activeProjects}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm p-5 rounded-2xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl transition-colors">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors">Pending Complaints</h3>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 transition-colors">{complaints.filter(c => c.status === 'Pending').length}</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm p-5 rounded-2xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors">Stakeholders</h3>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 transition-colors">{people.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ward Health Matrix */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Hotspot Wards</h2>
            </div>
            <Link to="/constituency/wards" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {wardHealth.map((ward, idx) => (
              <div key={ward.ward} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 dark:text-zinc-600 font-mono text-xs w-4 font-bold">{idx + 1}.</span>
                  <span className="text-zinc-900 dark:text-zinc-200 font-bold text-sm transition-colors">{ward.ward}</span>
                </div>
                <div className="flex gap-4 text-[11px] font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1.25 text-red-600 dark:text-red-400 transition-colors">
                    <AlertCircle className="w-3 h-3" />
                    {ward.complaintCount} Issue{ward.complaintCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.25 text-indigo-600 dark:text-indigo-400 transition-colors">
                    <Briefcase className="w-3 h-3" />
                    {ward.projectCount} Proj.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints List */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50 transition-colors">
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Most Recent Complaints</h2>
            <Link to="/constituency/complaints" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-colors">
              View Database
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto p-4">
            <div className="space-y-3">
              {recentComplaints.map(complaint => (
                <div 
                  key={complaint.id} 
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl hover:border-indigo-500/30 transition-all group"
                >
                  <div>
                    <Link to={`/constituency/complaints/${complaint.id}`} className="font-bold text-zinc-900 dark:text-zinc-200 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {complaint.citizenName}
                    </Link>
                    <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-1 font-medium transition-colors">
                      {complaint.ward} • {complaint.issueType}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all
                    ${complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' : 
                      complaint.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-500/20' : 
                      'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20'}
                  `}>
                    {complaint.status}
                  </span>
                </div>
              ))}
              {recentComplaints.length === 0 && (
                <div className="text-center text-zinc-500 text-sm py-8">No recent complaints.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
