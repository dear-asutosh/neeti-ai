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
      <div className="flex items-center gap-4 text-zinc-400 mb-2">
        <Link to="/constituency/wards" className="hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Ward Overview
        </Link>
        <span>/</span>
        <span className="text-zinc-100 text-sm">{wardName}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-4 bg-zinc-800 rounded-xl text-zinc-200 shadow-lg">
          <Map className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">{wardName} Detailed Overview</h1>
          <p className="text-zinc-400">Showing all records filtered exclusively for this region.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WARD STATS SUMMARY */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{complaints.length}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Complaints</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{projects.length}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Active Projects</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-100">{formatCurrency(totalBudget).replace('₹', '')}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Allocated Fund</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{people.length}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Stakeholders</p>
            </div>
          </div>
        </div>

        {/* SECTION: Complaints In This Ward */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Complaints ({complaints.length})
              </h2>
              <Link to="/constituency/complaints" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                View All <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>
            
            <div className="p-4 space-y-3 flex-1">
              {complaints.length > 0 ? complaints.map(complaint => (
                <div 
                  key={complaint.id}
                  onClick={() => navigate(`/constituency/complaints/${complaint.id}`)}
                  className="flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800 rounded-md cursor-pointer hover:border-zinc-700 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-zinc-200">{complaint.issueType}</h4>
                    <p className="text-zinc-500 text-xs mt-1">Reported by {complaint.citizenName} • {new Date(complaint.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    complaint.status === 'Resolved' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' :
                    complaint.status === 'In Progress' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' :
                    'text-amber-500 border-amber-500/20 bg-amber-500/10'
                  }`}>
                    {complaint.status}
                  </span>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm p-8">No recorded complaints for this ward.</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: People Responsible */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Key Personnel
              </h2>
            </div>
            
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-100">
              {people.length > 0 ? people.map(person => (
                <div 
                  key={person.id}
                  onClick={() => navigate(`/constituency/people/${person.id}`)}
                  className="p-3 bg-zinc-950 border border-zinc-800 rounded-md cursor-pointer hover:border-zinc-700 transition-colors flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <span className="text-zinc-300 font-bold">{person.fullName.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-zinc-200 text-sm truncate">{person.fullName}</h4>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getRoleBadgeStyle(person.role)}`}>
                      {person.role}
                    </span>
                    {person.phone && (
                      <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5"><Phone className="w-3 h-3"/> {person.phone}</p>
                    )}
                  </div>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm p-8">No officials assigned directly.</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: Projects In This Ward */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
             <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" />
                Development Projects
              </h2>
            </div>

            <div className="p-4 overflow-x-auto">
              {projects.length > 0 ? (
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Project Name</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Financials</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {projects.map(project => (
                      <tr key={project.id} className="hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/constituency/projects/${project.id}`)}>
                        <td className="px-4 py-4 text-zinc-200 font-medium">{project.projectName}</td>
                        <td className="px-4 py-4">{project.category}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-zinc-300 font-mono">₹{formatCurrency(project.budgetAllocated).replace('₹', '')}</span>
                            <span className="text-xs text-zinc-500">{Math.round((project.budgetSpent / project.budgetAllocated) * 100) || 0}% Utilized</span>
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
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm p-8">No development schemas documented for this ward.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
