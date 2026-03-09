import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getComplaints } from '../../../services/complaintsService';
import { getProjects } from '../../../services/projectsService';
import { getPeople } from '../../../services/peopleService';
import { Map, AlertCircle, Briefcase, Users, ChevronRight } from 'lucide-react';

export default function WardsOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wardData, setWardData] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all core datasets
      const [complaints, projects, people] = await Promise.all([
        getComplaints(),
        getProjects(),
        getPeople()
      ]);

      // Array of 10 static wards based on requirements
      const wardsList = Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`);

      // Process and aggregate data for each ward
      const aggregated = wardsList.map(wardName => {
        const wardComplaints = complaints.filter(c => c.ward === wardName);
        const wardProjects = projects.filter(p => p.ward === wardName);
        const wardPeople = people.filter(p => p.ward === wardName || p.ward === 'All Wards');
        
        return {
          name: wardName,
          stats: {
            totalComplaints: wardComplaints.length,
            pendingComplaints: wardComplaints.filter(c => c.status === 'Pending').length,
            activeProjects: wardProjects.filter(p => p.status === 'In Progress').length,
            totalProjects: wardProjects.length,
            assignedPeople: wardPeople.length
          },
          // Find one primary responsible person to show on the card (e.g. Ward Member if exists)
          primaryContact: wardPeople.find(p => p.role === 'Ward Member' && p.ward === wardName) || wardPeople[0] || null
        };
      });

      setWardData(aggregated);
    } catch (error) {
      console.error("Error aggregating ward data:", error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-1 transition-colors">Ward Overview</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 transition-colors">Holistic view of complaints, projects, and stakeholders distributed across all 10 wards.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {wardData.map((ward, idx) => (
          <div 
            key={ward.name}
            onClick={() => navigate(`/constituency/wards/${idx + 1}`)}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/5 group shadow-sm"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <Map className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{ward.name}</h2>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 dark:bg-zinc-950 rounded-xl p-3 text-center border border-gray-100 dark:border-zinc-800 transition-colors">
                <AlertCircle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-200 transition-colors">{ward.stats.pendingComplaints}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-tight">Pending<br/>Issues</p>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-950 rounded-xl p-3 text-center border border-gray-100 dark:border-zinc-800 transition-colors">
                <Briefcase className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-200 transition-colors">{ward.stats.activeProjects}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-tight">Active<br/>Projects</p>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-950 rounded-xl p-3 text-center border border-gray-100 dark:border-zinc-800 transition-colors">
                <Users className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-200 transition-colors">{ward.stats.assignedPeople}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-tight">Key<br/>People</p>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 transition-colors">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-2 transition-colors">Primary Assignment</p>
              {ward.primaryContact ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-900 dark:text-zinc-300 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    {ward.primaryContact.fullName.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 truncate transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{ward.primaryContact.fullName}</span>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-auto transition-colors">{ward.primaryContact.role}</span>
                </div>
              ) : (
                <span className="text-sm text-zinc-400 dark:text-zinc-600 italic transition-colors">No officials assigned directly.</span>
              )}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
