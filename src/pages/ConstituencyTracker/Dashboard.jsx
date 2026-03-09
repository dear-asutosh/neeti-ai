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
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-zinc-800/80 text-zinc-300 rounded-lg">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400">Recorded Issues</h3>
          </div>
          <p className="text-2xl font-bold text-zinc-100">{complaints.length}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400">Active Projects</h3>
          </div>
          <p className="text-2xl font-bold text-zinc-100">{activeProjects}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400">Pending Complaints</h3>
          </div>
          <p className="text-2xl font-bold text-zinc-100">{complaints.filter(c => c.status === 'Pending').length}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400">Stakeholders</h3>
          </div>
          <p className="text-2xl font-bold text-zinc-100">{people.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ward Health Matrix */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-bold text-zinc-100">Hotspot Wards</h2>
            </div>
            <Link to="/constituency/wards" className="text-xs text-zinc-400 hover:text-white transition-colors">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {wardHealth.map((ward, idx) => (
              <div key={ward.ward} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-md">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 font-mono text-xs w-3">{idx + 1}.</span>
                  <span className="text-zinc-200 font-medium text-sm">{ward.ward}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1.25 text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    {ward.complaintCount} Issue{ward.complaintCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.25 text-blue-400">
                    <Briefcase className="w-3 h-3" />
                    {ward.projectCount} Proj.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints List */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-100">Most Recent Complaints</h2>
            <Link to="/constituency/complaints" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
              View Database
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto p-4">
            <div className="space-y-3">
              {recentComplaints.map(complaint => (
                <div 
                  key={complaint.id} 
                  className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-800 rounded-md hover:border-zinc-700 transition-colors"
                >
                  <div>
                    <Link to={`/constituency/complaints/${complaint.id}`} className="font-medium text-zinc-200 text-sm hover:underline">
                      {complaint.citizenName}
                    </Link>
                    <p className="text-zinc-500 text-xs mt-1">
                      {complaint.ward} • {complaint.issueType}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border
                    ${complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      complaint.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'}
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
