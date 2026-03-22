import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPersonById } from '../../../services/peopleService';
import { getComplaints } from '../../../services/complaintsService';
import { getProjects } from '../../../services/projectsService';
import { ChevronLeft, User, Phone, Mail, Building, MapPin, AlignLeft, Briefcase, FileText } from 'lucide-react';

export default function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  
  // Related Data
  const [relatedComplaints, setRelatedComplaints] = useState([]);
  const [relatedProjects, setRelatedProjects] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      const personData = await getPersonById(id);
      setPerson(personData);

      // Fetch cross-referenced data in parallel
      const [allComplaints, allProjects] = await Promise.all([
        getComplaints(),
        getProjects()
      ]);

      // Simple soft-matching by name. 
      // In a real production app, we would match by Person ID reference rather than name strings.
      // But based on our current mock structures, we'll match assignedTo / responsiblePerson fields exactly.
      const matchedComplaints = allComplaints.filter(
        c => c.assignedTo?.toLowerCase() === personData.fullName.toLowerCase()
      );
      const matchedProjects = allProjects.filter(
        p => p.responsiblePerson?.toLowerCase() === personData.fullName.toLowerCase()
      );

      setRelatedComplaints(matchedComplaints);
      setRelatedProjects(matchedProjects);

    } catch (error) {
      console.error("Error fetching detail data:", error);
      toast.error("Failed to load profile details.");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <User className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
        <h2 className="text-xl font-semibold mb-2">Stakeholder Not Found</h2>
        <Link to="/constituency/people" className="text-zinc-100 underline hover:text-white">Back to Directory</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500 mb-2 transition-colors">
        <Link to="/constituency/people" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm font-bold">
          <ChevronLeft className="w-4 h-4" />
          Stakeholders
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 text-sm font-bold transition-colors">{person.fullName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 relative overflow-hidden shadow-sm transition-all">
            {/* Background design */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-zinc-800/30 rounded-full blur-3xl -mr-10 -mt-10 transition-colors"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-xl flex items-center justify-center transition-all">
                <span className="text-3xl font-black text-zinc-900 dark:text-zinc-300 transition-colors">{person.fullName.charAt(0)}</span>
              </div>
              
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">{person.fullName}</h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium transition-colors">{person.department}</p>
                <div className="mt-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${getRoleBadgeStyle(person.role)}`}>
                    {person.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800/50 transition-colors">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-zinc-400 dark:text-zinc-500 mt-0.5 transition-colors" />
                <div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider transition-colors">Ward Area</p>
                  <p className="text-zinc-800 dark:text-zinc-200 font-medium transition-colors">{person.ward}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-zinc-400 dark:text-zinc-500 mt-0.5 transition-colors" />
                <div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider transition-colors">Phone Number</p>
                  <p className="text-zinc-800 dark:text-zinc-200 font-medium transition-colors">{person.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-zinc-400 dark:text-zinc-500 mt-0.5 transition-colors" />
                <div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider transition-colors">Email Address</p>
                  <p className="text-zinc-800 dark:text-zinc-200 font-medium break-all transition-colors">{person.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {person.notes && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800/50 transition-colors">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-2 transition-colors">Internal Notes</p>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm font-medium whitespace-pre-wrap bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 transition-colors">
                  {person.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Relationships / Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Projects Cross-reference */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800 transition-colors">
              <Briefcase className="w-5 h-5 text-zinc-400 dark:text-zinc-500 transition-colors" />
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Associated Projects ({relatedProjects.length})</h2>
            </div>
            
            {relatedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedProjects.map(project => (
                  <div 
                    key={project.id}
                    onClick={() => navigate(`/constituency/projects/${project.id}`)}
                    className="p-4 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all group shadow-xs"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 transition-colors">{project.projectName}</h4>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mt-4">
                      <span className="text-zinc-400 dark:text-zinc-500 transition-colors">{project.ward}</span>
                      <span className={`px-2 py-0.5 rounded-full transition-colors ${
                        project.status === 'Completed' ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' :
                        project.status === 'In Progress' ? 'text-indigo-500 bg-indigo-500/10 border border-indigo-500/20' :
                        'text-zinc-400 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm text-center py-8">
                No active projects associated with this person.
              </div>
            )}
          </div>

          {/* Assigned Complaints Cross-reference */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800 transition-colors">
              <FileText className="w-5 h-5 text-zinc-400 dark:text-zinc-500 transition-colors" />
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Assigned Complaints ({relatedComplaints.length})</h2>
            </div>
            
            {relatedComplaints.length > 0 ? (
              <div className="space-y-3">
                {relatedComplaints.map(complaint => (
                  <div 
                    key={complaint.id}
                    onClick={() => navigate(`/constituency/complaints/${complaint.id}`)}
                    className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all shadow-xs group"
                  >
                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{complaint.citizenName}</h4>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider mt-1 transition-colors">{complaint.issueType} • {complaint.ward}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      complaint.status === 'Resolved' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                      complaint.status === 'In Progress' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' :
                      'text-amber-500 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm text-center py-4">
                No complaints currently assigned.
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
