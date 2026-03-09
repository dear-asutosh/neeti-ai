import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplaintById, updateComplaintStatus } from '../../services/complaintsService';
import { ChevronLeft, Clock, MapPin, Phone, User, Tag, AlertCircle } from 'lucide-react';

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    fetchComplaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const data = await getComplaintById(id);
      setComplaint(data);
    } catch (error) {
      console.error("Error fetching complaint:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === complaint.status) return;
    
    setUpdating(true);
    try {
      await updateComplaintStatus(id, newStatus, statusNote);
      setStatusNote('');
      await fetchComplaint(); // refresh data
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="p-12 text-center text-zinc-500 transition-colors">
        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-zinc-300 dark:text-zinc-700 transition-colors" />
        <h2 className="text-2xl font-black mb-4 text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Complaint Not Found</h2>
        <Link to="/constituency/complaints" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-colors uppercase tracking-widest text-xs">Back to Complaints Database</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 mb-2 transition-colors">
          <Link to="/constituency/complaints" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm font-bold">
            <ChevronLeft className="w-4 h-4" />
            All Complaints
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-zinc-900 dark:text-zinc-100 text-sm font-black transition-colors">{complaint.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
          ${complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' : 
            complaint.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-500/20' : 
            'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20'}
        `}>
          {complaint.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 space-y-8 shadow-sm transition-all">
            <div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight transition-colors">{complaint.issueType} Issue in {complaint.ward}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium flex items-center gap-2 transition-colors">
                <Clock className="w-4 h-4" />
                Reported on {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 bg-gray-50 dark:bg-zinc-950/50 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800/50 transition-colors">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 flex items-center gap-1.5 transition-colors"><User className="w-3.5 h-3.5" /> Citizen Name</p>
                <p className="font-bold text-zinc-900 dark:text-zinc-100 transition-colors">{complaint.citizenName}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 flex items-center gap-1.5 transition-colors"><Phone className="w-3.5 h-3.5" /> Contact Number</p>
                <p className="font-bold text-zinc-900 dark:text-zinc-100 transition-colors">{complaint.phoneNumber}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 flex items-center gap-1.5 transition-colors"><MapPin className="w-3.5 h-3.5" /> Location / Ward</p>
                <p className="font-bold text-zinc-900 dark:text-zinc-100 transition-colors">{complaint.ward}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 flex items-center gap-1.5 transition-colors"><Tag className="w-3.5 h-3.5" /> Priority</p>
                <p className={`font-black uppercase text-xs tracking-wider transition-colors
                  ${complaint.priority === 'High' ? 'text-red-600 dark:text-red-400' : 
                    complaint.priority === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
                `}>{complaint.priority}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest transition-colors">Description</h3>
              <p className="text-zinc-700 dark:text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-zinc-950 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 transition-all">
                {complaint.description}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest transition-colors">Internal Assignment</h3>
              <div className="text-zinc-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 max-w-sm font-bold transition-all shadow-xs">
                Assigned to: <span className="text-zinc-900 dark:text-zinc-100 ml-2 transition-colors">{complaint.assignedTo || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* Update Status Actions */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 space-y-6 shadow-sm transition-all">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Update Status</h3>
            <div className="space-y-5">
              <textarea 
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none shadow-xs"
                placeholder="Add an internal note about this status update (optional)..."
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              ></textarea>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => handleUpdateStatus('Pending')}
                  disabled={updating || complaint.status === 'Pending'}
                  className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                    ${complaint.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20 cursor-default shadow-xs' : 'bg-gray-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700'}
                  `}
                >
                  Set Pending
                </button>
                <button 
                  onClick={() => handleUpdateStatus('In Progress')}
                  disabled={updating || complaint.status === 'In Progress'}
                  className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                    ${complaint.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-500/20 cursor-default shadow-xs' : 'bg-gray-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700'}
                  `}
                >
                  Mark In Progress
                </button>
                <button 
                  onClick={() => handleUpdateStatus('Resolved')}
                  disabled={updating || complaint.status === 'Resolved'}
                  className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                    ${complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20 cursor-default shadow-xs' : 'bg-gray-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700'}
                  `}
                >
                  Resolve Issue
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 sticky top-6 shadow-sm transition-all">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-8 tracking-tight transition-colors">Activity History</h3>
            <div className="relative pl-2 space-y-8">
              {/* Vertical line */}
              <div className="absolute top-2.5 bottom-8 left-[13px] w-[2px] bg-gray-100 dark:bg-zinc-800 transition-colors"></div>
              
              {complaint.timeline && complaint.timeline.map((event, idx) => (
                <div key={idx} className="relative pl-8 group">
                  {/* Timeline dot */}
                  <div className={`absolute top-1.5 left-0 w-3 h-3 rounded-full border-[3px] border-white dark:border-zinc-900 z-10 transition-all group-hover:scale-125
                    ${event.status === 'Resolved' ? 'bg-emerald-500' : 
                      event.status === 'In Progress' ? 'bg-indigo-500' : 'bg-amber-500'}
                  `}></div>
                  
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200 transition-colors">
                      Status: {event.status}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 transition-colors">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.note && (
                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl mt-3 border border-gray-100 dark:border-zinc-800/60 leading-relaxed transition-all">
                        {event.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!complaint.timeline || complaint.timeline.length === 0) && (
                <p className="text-sm text-zinc-500">No activity recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
