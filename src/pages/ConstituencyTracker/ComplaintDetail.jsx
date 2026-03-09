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
      <div className="p-8 text-center text-zinc-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
        <h2 className="text-xl font-semibold mb-2">Complaint Not Found</h2>
        <Link to="/constituency/complaints" className="text-zinc-100 underline hover:text-white">Back to Complaints</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-zinc-400 mb-2">
          <Link to="/constituency/complaints" className="hover:text-zinc-100 transition-colors flex items-center gap-1 text-sm">
            <ChevronLeft className="w-4 h-4" />
            All Complaints
          </Link>
          <span>/</span>
          <span className="text-zinc-100 text-sm font-mono">{complaint.id.substring(0, 8)}...</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
          ${complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
            complaint.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}
        `}>
          {complaint.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">{complaint.issueType} Issue in {complaint.ward}</h1>
              <p className="text-zinc-400 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Reported on {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-zinc-950/50 p-4 rounded-md border border-zinc-800/50">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Citizen Name</p>
                <p className="font-medium text-zinc-200">{complaint.citizenName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contact Number</p>
                <p className="font-medium text-zinc-200">{complaint.phoneNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location / Ward</p>
                <p className="font-medium text-zinc-200">{complaint.ward}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Priority</p>
                <p className={`font-medium
                  ${complaint.priority === 'High' ? 'text-red-400' : 
                    complaint.priority === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}
                `}>{complaint.priority}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Description</h3>
              <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950 p-4 rounded-md border border-zinc-800">
                {complaint.description}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Internal Assignment</h3>
              <p className="text-zinc-300 bg-zinc-950 p-3 rounded-md border border-zinc-800 max-w-sm">
                Assigned to: <span className="font-medium text-zinc-100">{complaint.assignedTo || 'Unassigned'}</span>
              </p>
            </div>
          </div>

          {/* Update Status Actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-100">Update Status</h3>
            <div className="space-y-3">
              <textarea 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 resize-none"
                placeholder="Add an internal note about this status update (optional)..."
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              ></textarea>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateStatus('Pending')}
                  disabled={updating || complaint.status === 'Pending'}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors border
                    ${complaint.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 cursor-default' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}
                  `}
                >
                  Set Pending
                </button>
                <button 
                  onClick={() => handleUpdateStatus('In Progress')}
                  disabled={updating || complaint.status === 'In Progress'}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors border
                    ${complaint.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 cursor-default' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}
                  `}
                >
                  Mark In Progress
                </button>
                <button 
                  onClick={() => handleUpdateStatus('Resolved')}
                  disabled={updating || complaint.status === 'Resolved'}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors border
                    ${complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 cursor-default' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-6">Activity Timeline</h3>
            <div className="relative pl-4 space-y-6">
              {/* Vertical line */}
              <div className="absolute top-2 bottom-0 left-6 w-0.5 bg-zinc-800 -ml-0.5"></div>
              
              {complaint.timeline && complaint.timeline.map((event, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className={`absolute top-1.5 left-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 z-10
                    ${event.status === 'Resolved' ? 'bg-emerald-500' : 
                      event.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'}
                  `}></div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-200">
                      Status changed to {event.status}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.note && (
                      <p className="text-sm text-zinc-400 bg-zinc-950 p-2 rounded mt-2 border border-zinc-800/60">
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
