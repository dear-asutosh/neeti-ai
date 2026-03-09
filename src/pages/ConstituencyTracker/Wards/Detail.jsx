import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getComplaints } from '../../../services/complaintsService';
import { getProjects } from '../../../services/projectsService';
import { getPeople } from '../../../services/peopleService';
import { ChevronLeft, Map, AlertCircle, Briefcase, Users, Phone, ArrowRight, IndianRupee } from 'lucide-react';

export default function WardDetail() {
  const { wardNumber } = useParams();
  const wardName = `Ward ${wardNumber}`;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  
  // Data State
  const [complaints, setComplaints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    fetchWardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardNumber]);

  const fetchWardData = async () => {
    try {
      const [allComplaints, allProjects, allPeople] = await Promise.all([
        getComplaints(),
        getProjects(),
        getPeople()
      ]);

      // Filter exactly for this ward
      setComplaints(allComplaints.filter(c => c.ward === wardName));
      setProjects(allProjects.filter(p => p.ward === wardName));
      // People either directly belong to this ward or watch all wards
      setPeople(allPeople.filter(p => p.ward === wardName || p.ward === 'All Wards'));

    } catch (error) {
      console.error(`Error fetching data for ${wardName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch(role) {
      case 'Government Official': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'Ward Member': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Contractor': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Party Worker': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'Community Leader': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

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

  const totalBudget = projects.reduce((sum, p) => sum + (p.budgetAllocated || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500 mb-2 transition-colors">
        <Link to="/constituency/wards" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm font-bold">
          <ChevronLeft className="w-4 h-4" />
          Ward Overview
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 text-sm font-bold transition-colors">{wardName}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl text-indigo-600 dark:text-zinc-200 shadow-xl shadow-indigo-500/10 transition-all border border-gray-100 dark:border-zinc-700">
          <Map className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">{wardName} Profile</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium transition-colors">Comprehensive data dashboard for this administrative region.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WARD STATS SUMMARY */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-xl flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
            <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-xl transition-colors">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 transition-colors">{complaints.length}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider transition-colors">Total Complaints</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-xl flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 rounded-xl transition-colors">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 transition-colors">{projects.length}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider transition-colors">Active Projects</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-xl flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl transition-colors">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 transition-colors">{formatCurrency(totalBudget).replace('₹', '')}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider transition-colors">Allocated Fund</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-xl flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500 rounded-xl transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 transition-colors">{people.length}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider transition-colors">Stakeholders</p>
            </div>
          </div>
        </div>

        {/* SECTION: Complaints In This Ward */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-sm transition-all">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50 transition-colors">
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight transition-colors">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Complaints ({complaints.length})
              </h2>
              <Link to="/constituency/complaints" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-all">
                View All <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>
            
            <div className="p-4 space-y-3 flex-1">
              {complaints.length > 0 ? complaints.map(complaint => (
                <div 
                  key={complaint.id}
                  onClick={() => navigate(`/constituency/complaints/${complaint.id}`)}
                  className="flex justify-between items-center p-4 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all shadow-xs group"
                >
                  <div>
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{complaint.issueType}</h4>
                    <p className="text-zinc-500 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-1 transition-colors">Reported by {complaint.citizenName} • {new Date(complaint.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                    complaint.status === 'Resolved' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' :
                    complaint.status === 'In Progress' ? 'text-indigo-500 border-indigo-500/20 bg-indigo-500/10' :
                    'text-amber-500 border-amber-500/20 bg-amber-500/10'
                  }`}>
                    {complaint.status}
                  </span>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-medium text-sm p-8 transition-colors">No recorded complaints for this ward.</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: People Responsible */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-sm transition-all">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 transition-colors">
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight transition-colors">
                <Users className="w-5 h-5 text-purple-500" />
                Key Personnel
              </h2>
            </div>
            
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-100 pb-8">
              {people.length > 0 ? people.map(person => (
                <div 
                  key={person.id}
                  onClick={() => navigate(`/constituency/people/${person.id}`)}
                  className="p-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all flex items-start gap-3 group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shrink-0 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                    <span className="text-zinc-900 dark:text-zinc-300 font-black transition-colors group-hover:text-white">{person.fullName.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm truncate transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{person.fullName}</h4>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${getRoleBadgeStyle(person.role)}`}>
                      {person.role}
                    </span>
                    {person.phone && (
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-2 flex items-center gap-1.5 transition-colors"><Phone className="w-3 h-3"/> {person.phone}</p>
                    )}
                  </div>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-medium text-sm p-8 transition-colors">No officials assigned directly.</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: Projects In This Ward */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-all">
             <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50 transition-colors">
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight transition-colors">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                Development Projects
              </h2>
            </div>

            <div className="p-4 overflow-x-auto">
              {projects.length > 0 ? (
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 transition-colors">
                  <thead className="text-[10px] font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-zinc-950/50 text-zinc-400 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800 transition-colors">
                    <tr>
                      <th className="px-4 py-3">Project Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Financials</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 transition-colors">
                    {projects.map(project => (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group" onClick={() => navigate(`/constituency/projects/${project.id}`)}>
                        <td className="px-4 py-4 text-zinc-900 dark:text-zinc-200 font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{project.projectName}</td>
                        <td className="px-4 py-4 transition-colors">{project.category}</td>
                        <td className="px-4 py-4 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-zinc-700 dark:text-zinc-300 font-black font-mono transition-colors">₹{formatCurrency(project.budgetAllocated).replace('₹', '')}</span>
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight transition-colors">{Math.round((project.budgetSpent / project.budgetAllocated) * 100) || 0}% Utilized</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
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
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-medium text-sm p-8 transition-colors">No development schemas documented for this ward.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
