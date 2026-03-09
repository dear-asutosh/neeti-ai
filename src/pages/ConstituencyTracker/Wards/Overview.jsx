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
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Ward Overview</h1>
          <p className="text-sm text-zinc-400">Holistic view of complaints, projects, and stakeholders distributed across all 10 wards.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {wardData.map((ward, idx) => (
          <div 
            key={ward.name}
            onClick={() => navigate(`/constituency/wards/${idx + 1}`)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 cursor-pointer hover:border-zinc-700 transition-all hover:-translate-y-1 hover:shadow-lg group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-800 rounded-lg text-zinc-300">
                  <Map className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-zinc-100">{ward.name}</h2>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-zinc-950 rounded-md p-3 text-center border border-zinc-800">
                <AlertCircle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-zinc-200">{ward.stats.pendingComplaints}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Pending<br/>Issues</p>
              </div>
              <div className="bg-zinc-950 rounded-md p-3 text-center border border-zinc-800">
                <Briefcase className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-zinc-200">{ward.stats.activeProjects}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Active<br/>Projects</p>
              </div>
              <div className="bg-zinc-950 rounded-md p-3 text-center border border-zinc-800">
                <Users className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-zinc-200">{ward.stats.assignedPeople}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Key<br/>People</p>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs text-zinc-500 mb-1">Primary Assignment</p>
              {ward.primaryContact ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                    {ward.primaryContact.fullName.charAt(0)}
                  </div>
                  <span className="text-sm text-zinc-300 truncate">{ward.primaryContact.fullName}</span>
                  <span className="text-xs text-zinc-500 ml-auto">{ward.primaryContact.role}</span>
                </div>
              ) : (
                <span className="text-sm text-zinc-600 italic">No officials assigned directly.</span>
              )}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
