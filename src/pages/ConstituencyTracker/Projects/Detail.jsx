import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectById, updateProjectStatus } from '../../../services/projectsService';
import { ChevronLeft, Calendar, User, AlignLeft, AlertCircle, TrendingUp, IndianRupee } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProject = async () => {
    try {
      const data = await getProjectById(id);
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === project.status) return;
    
    setUpdating(true);
    try {
      await updateProjectStatus(id, newStatus, statusNote);
      setStatusNote('');
      await fetchProject(); // refresh data
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
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

  if (!project) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
        <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
        <Link to="/constituency/projects" className="text-zinc-100 underline hover:text-white">Back to Projects</Link>
      </div>
    );
  }

  const budgetPercentage = project.budgetAllocated > 0 
    ? Math.min(100, Math.round((project.budgetSpent / project.budgetAllocated) * 100))
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500 mb-2 transition-colors">
          <Link to="/constituency/projects" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm font-bold">
            <ChevronLeft className="w-4 h-4" />
            All Projects
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100 text-sm font-mono font-bold transition-colors">{project.id.substring(0, 8)}...</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
          ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
            project.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
            project.status === 'Cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
            project.status === 'On Hold' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
            'bg-zinc-800 text-zinc-300 border border-zinc-700'}
        `}>
          {project.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm transition-all">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2 transition-colors">{project.projectName}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm flex items-center gap-2 transition-colors">
                <AlignLeft className="w-4 h-4" />
                {project.category} in {project.ward}
              </p>
            </div>

            {/* Budget Progress Meter */}
            <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 transition-all shadow-xs">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-1 transition-colors">Budget Utilization</p>
                  <p className="text-zinc-900 dark:text-zinc-100 font-black text-lg flex items-center gap-1 transition-colors">
                    <IndianRupee className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    {formatCurrency(project.budgetSpent).replace('₹', '')} <span className="text-zinc-500 text-sm font-normal">spent of</span> {formatCurrency(project.budgetAllocated).replace('₹', '')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-zinc-700 dark:text-zinc-300 transition-colors">{budgetPercentage}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden transition-colors">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${budgetPercentage > 90 ? 'bg-rose-500' : budgetPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${budgetPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-gray-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800/50 transition-all">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 transition-colors"><Calendar className="w-3.5 h-3.5" /> Start Date</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200 transition-colors">{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 transition-colors"><TrendingUp className="w-3.5 h-3.5" /> Deadline</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200 transition-colors">{new Date(project.deadline).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 transition-colors"><User className="w-3.5 h-3.5" /> Responsible Official / Contractor</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200 transition-colors">{project.responsiblePerson}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider transition-colors">Project Description</h3>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 transition-colors">
                {project.description}
              </p>
            </div>
          </div>

          {/* Update Status Actions */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm transition-all">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Update Phase Status</h3>
            <div className="space-y-3">
              <textarea 
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none shadow-xs"
                placeholder="Add an internal note about this project phase update (optional)..."
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              ></textarea>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Planned', 'In Progress', 'On Hold', 'Completed'].map((status) => (
                  <button 
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={updating || project.status === status}
                    className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border
                      ${project.status === status 
                        ? 'bg-gray-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-gray-200 dark:border-zinc-700 cursor-default' 
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'}
                    `}
                  >
                    Set {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 sticky top-6 shadow-sm transition-all">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-6 tracking-tight transition-colors">Activity Timeline</h3>
            <div className="relative pl-4 space-y-6">
              {/* Vertical line */}
              <div className="absolute top-2 bottom-0 left-6 w-0.5 bg-gray-100 dark:bg-zinc-800 -ml-0.5 transition-colors"></div>
              
              {project.timeline && project.timeline.map((event, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className={`absolute top-1.5 left-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 z-10 transition-colors
                    ${event.status === 'Completed' ? 'bg-emerald-500' : 
                      event.status === 'In Progress' ? 'bg-blue-500' : 
                      event.status === 'On Hold' ? 'bg-orange-500' :
                      event.status === 'Cancelled' ? 'bg-rose-500' :
                      'bg-zinc-400'}
                  `}></div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200 transition-colors">
                      Phase: {event.status}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 transition-colors">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.note && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-lg mt-2 border border-gray-100 dark:border-zinc-800/60 transition-colors shadow-xs">
                        {event.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!project.timeline || project.timeline.length === 0) && (
                <p className="text-sm text-zinc-500">No activity recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
