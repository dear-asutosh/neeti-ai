import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPeople } from '../../../services/peopleService';
import { Search, Plus, User, Phone, Mail, Building, LayoutGrid, List as ListIcon } from 'lucide-react';

export default function PeopleList() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getPeople();
      setPeople(data);
    } catch (error) {
      console.error("Error fetching people:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = people.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? p.role === roleFilter : true;
    const matchesWard = wardFilter ? p.ward === wardFilter || p.ward === 'All Wards' : true;

    return matchesSearch && matchesRole && matchesWard;
  });

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">People & Stakeholders directory</h1>
          <p className="text-sm text-zinc-400">Manage internal teams, officials, ward members, and contractors.</p>
        </div>
        <Link 
          to="/constituency/people/new" 
          className="bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Stakeholder
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex-1 max-w-lg relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by Name or Department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="Ward Member">Ward Member</option>
              <option value="Government Official">Government Official</option>
              <option value="Contractor">Contractor</option>
              <option value="Party Worker">Party Worker</option>
              <option value="Community Leader">Community Leader</option>
              <option value="Other">Other</option>
            </select>
            <select 
              value={wardFilter} 
              onChange={(e) => setWardFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="">All Wards</option>
              {[...Array(10)].map((_, i) => (
                <option key={i} value={`Ward ${i + 1}`}>Ward {i + 1}</option>
              ))}
            </select>
            
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md ml-2 p-0.5">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredPeople.length === 0 && (
          <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-md border-dashed">
            No stakeholders match the current filters.
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && filteredPeople.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map(person => (
              <div 
                key={person.id} 
                onClick={() => navigate(`/constituency/people/${person.id}`)}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg p-5 flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <span className="text-zinc-300 font-bold text-lg">{person.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-zinc-100 font-medium truncate">{person.fullName}</h3>
                    <p className="text-zinc-400 text-xs truncate mb-1">{person.department}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${getRoleBadgeStyle(person.role)}`}>
                      {person.role}
                    </span>
                  </div>
                </div>

                <div className="mt-auto space-y-2 pt-4 border-t border-zinc-800/50 text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Building className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{person.ward}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{person.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{person.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && filteredPeople.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-zinc-800">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Ward</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredPeople.map(person => (
                  <tr key={person.id} className="hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/constituency/people/${person.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <span className="text-zinc-200 font-medium">{person.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeStyle(person.role)}`}>
                        {person.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{person.department}</td>
                    <td className="px-4 py-3">{person.ward}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col space-y-0.5">
                        <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-500"/> {person.phone}</span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500"><Mail className="w-3 h-3 text-zinc-600"/> {person.email || 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
