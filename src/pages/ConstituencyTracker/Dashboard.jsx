import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getComplaints } from '../../services/complaintsService';
import { AlertCircle, Clock, CheckCircle2, Inbox } from 'lucide-react';

export default function ConstituencyDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getComplaints();
      setComplaints(data);
    } catch (error) {
      console.error("Error fetching Dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const pending = complaints.filter(c => c.status === 'Pending').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  const wardCounts = complaints.reduce((acc, c) => {
    acc[c.ward] = (acc[c.ward] || 0) + 1;
    return acc;
  }, {});
  
  // Sort wards for chart
  const wardData = Object.keys(wardCounts)
    .sort((a, b) => parseInt(a.replace('Ward ', '')) - parseInt(b.replace('Ward ', '')))
    .map(ward => ({ ward, count: wardCounts[ward] }));

  const recentComplaints = complaints.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-100">Constituency Tracker</h1>
        <Link 
          to="/constituency/complaints" 
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          View All Complaints
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center gap-4">
          <div className="bg-zinc-800 p-3 rounded-md text-zinc-300">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">Total Complaints</p>
            <p className="text-2xl font-bold text-zinc-100">{complaints.length}</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-md text-amber-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">Pending</p>
            <p className="text-2xl font-bold text-zinc-100">{pending}</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-md text-blue-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">In Progress</p>
            <p className="text-2xl font-bold text-zinc-100">{inProgress}</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-md text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">Resolved</p>
            <p className="text-2xl font-bold text-zinc-100">{resolved}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Complaints by Ward</h2>
          <div className="space-y-3">
            {wardData.map((data, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm text-zinc-400 w-16">{data.ward}</span>
                <div className="flex-1 bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-zinc-600 h-full rounded-full" 
                    style={{ width: `${Math.max((data.count / Math.max(...wardData.map(w => w.count))) * 100, 5)}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-zinc-300 w-6 text-right">{data.count}</span>
              </div>
            ))}
            {wardData.length === 0 && (
              <p className="text-zinc-500 text-sm italic">No data available.</p>
            )}
          </div>
        </div>

        {/* Recent Complaints List */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-0 overflow-hidden">
          <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-zinc-100">Recent Complaints</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Citizen</th>
                  <th className="px-5 py-3 font-medium">Issue Type</th>
                  <th className="px-5 py-3 font-medium">Ward</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {recentComplaints.map(complaint => (
                  <tr key={complaint.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-3 text-zinc-200 font-medium">
                      <Link to={`/constituency/complaints/${complaint.id}`} className="hover:underline">
                        {complaint.citizenName}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{complaint.issueType}</td>
                    <td className="px-5 py-3">{complaint.ward}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' : 
                          complaint.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}
                      `}>
                        {complaint.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentComplaints.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-zinc-500">No recent complaints found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
