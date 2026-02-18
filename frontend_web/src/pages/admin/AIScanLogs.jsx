import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  Search, Filter, CheckCircle, AlertTriangle, Eye, MoreHorizontal, MapPin, 
  Pencil, Database, Download, Trash2, Loader, ChevronLeft, ChevronRight, ScanLine, RefreshCw
} from 'lucide-react';
import ScanDetailsModal from './ScanDetailsModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AIScanLogs = () => {
  const [logs, setLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/scans/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
         const formattedLogs = response.data.records.map(record => {
            const isUnhealthy = 
                record.environment?.algae_label === 'High' || 
                record.environment?.algae_label === 'Critical' || 
                record.environment?.turbidity_level > 6;

            const width = record.morphometrics?.width_cm || 0;
            const height = record.morphometrics?.height_cm || 0;
            const widthIn = (width / 2.54).toFixed(2);
            const heightIn = (height / 2.54).toFixed(2);
            const age = record.morphometrics?.estimated_age || 'Unknown Age';

            const algae = record.environment?.algae_label || 'Low';
            const turbidity = record.environment?.turbidity_level || 1;

            return {
                id: record.scanId || record._id,
                user: record.user ? `${record.user.firstName} ${record.user.lastName}` : 'Unknown User',
                userEmail: record.user?.email || 'No email provided', // Fetched Email
                userImage: record.user?.profilePic || null, 
                pond: record.location || 'Unknown Location',
                species: 'Australian Red Claw', 
                gender: record.gender || 'Not Defined',
                sizeCm: `${height}cm x ${width}cm`, 
                sizeIn: `(${heightIn}in x ${widthIn}in)`,
                age: age, 
                algae: algae,
                turbidity: turbidity,
                confidence: 95, 
                status: record.isDeleted ? 'Deleted' : 'Verified',
                image: record.image?.url || 'https://via.placeholder.com/150',
                date: record.createdAt,
                rawRecord: record 
            };
         });
         
         setLogs(formattedLogs.filter(log => log.status !== 'Deleted'));
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = async (action, logId) => {
    setActiveMenu(null); 
    if (action === 'delete') {
      try {
        setLogs(prev => prev.filter(log => log.id !== logId));
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'All' || 
                          (filter === 'Low Confidence' && log.confidence < 80) ||
                          log.gender?.includes(filter) ||
                          log.status === filter;
    
    const search = searchQuery.toLowerCase();
    const matchesSearch = log.id?.toLowerCase().includes(search) ||
                          log.user?.toLowerCase().includes(search) ||
                          log.species?.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <AdminLayout title="AI Scan Logs">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search logs (ID, User, Species)..." 
                value={searchQuery}
                onChange={(e) => { 
                    setSearchQuery(e.target.value); 
                    setCurrentPage(1); 
                }}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 shadow-sm text-sm" 
            />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
            {['All', 'Female', 'Male', 'Berried', 'Low Confidence'].map((f) => (
                <button 
                    key={f} 
                    onClick={() => { setFilter(f); setCurrentPage(1); }} 
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-teal-600 text-white shadow-md shadow-teal-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                    {f}
                </button>
            ))}
            <button onClick={fetchLogs} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500" title="Refresh Data">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col"> 
          
          <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                  <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-4 w-12 text-center">#</th>
                          <th className="p-4 w-64">Scan Details</th>
                          <th className="p-4">User / Location</th> 
                          <th className="p-4">Gender</th>
                          <th className="p-4">Estimated Age</th>
                          <th className="p-4">AI Prediction</th>
                          <th className="p-4 w-32">Confidence</th>
                          <th className="p-4 text-right">Status & Action</th>
                      </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                      {loading ? (
                          <tr>
                              <td colSpan="8" className="p-24 text-center text-slate-400">
                                  <div className="flex flex-col items-center justify-center">
                                      <Loader className="w-10 h-10 animate-spin mb-3 text-teal-500" />
                                      <p className="text-sm font-medium animate-pulse">Retrieving scan logs...</p>
                                  </div>
                              </td>
                          </tr>
                      ) : currentLogs.length === 0 ? (
                          <tr>
                              <td colSpan="8" className="p-12 text-center">
                                  <div className="flex flex-col items-center justify-center text-slate-400 opacity-60">
                                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                          <ScanLine className="w-8 h-8 text-slate-400" />
                                      </div>
                                      <h3 className="text-lg font-bold text-slate-600">No Logs Found</h3>
                                      <p className="text-sm mt-1 max-w-xs mx-auto">
                                          Try adjusting your search or filters.
                                      </p>
                                  </div>
                              </td>
                          </tr>
                      ) : (
                          currentLogs.map((log, index) => {
                              const dt = formatDateTime(log.date);
                              const hasWarning = log.algae === 'High' || log.algae === 'Critical' || log.turbidity > 6;
                              
                              return (
                              <tr key={log.id || index} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                                  
                                  <td className="p-4 text-center text-slate-400 font-medium text-sm">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                  </td>
                                  
                                  <td className="p-4">
                                      <div className="flex items-start gap-3">
                                          <div className="w-14 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm relative shrink-0 bg-black">
                                              <img src={log.image} alt="Scan" className="w-full h-full object-cover" />
                                              {hasWarning && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><AlertTriangle className="text-white w-4 h-4 drop-shadow-md" /></div>}
                                          </div>
                                          <div className="flex flex-col justify-center">
                                            <p className="font-bold text-slate-900 text-xs truncate max-w-[140px]">{log.id}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{dt.date} • {dt.time}</p>
                                            
                                            <div className="mt-1 flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-700">{log.sizeCm}</span>
                                                <span className="text-[10px] text-slate-500 italic">{log.sizeIn}</span>
                                            </div>
                                          </div>
                                      </div>
                                  </td>

                                  <td className="p-4">
                                      <div className="flex flex-col min-w-0">
                                          <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{log.user}</p>
                                          <div className="flex items-center gap-1 mt-0.5 text-slate-500">
                                            <MapPin className="w-3 h-3 text-teal-500 shrink-0" />
                                            <span className="text-[9px] font-bold uppercase tracking-wide text-teal-600 bg-teal-50 px-1 py-0.5 rounded border border-teal-100 truncate max-w-[120px]">
                                                {log.pond}
                                            </span>
                                          </div>
                                      </div>
                                  </td>

                                  <td className="p-4">
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${log.gender?.includes('Female') ? 'bg-pink-50 text-pink-600 border-pink-100' : log.gender?.includes('Male') ? 'bg-blue-50 text-blue-600 border-blue-100' : log.gender?.includes('Berried') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        {log.gender}
                                    </span>
                                  </td>

                                  <td className="p-4">
                                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 whitespace-nowrap shadow-sm">
                                        {log.age.split(' ')[0]}
                                    </span>
                                  </td>

                                  <td className="p-4">
                                      <div className="space-y-1">
                                          <p className="text-[11px] font-bold text-slate-800 italic">{log.species}</p>
                                          <div className="flex flex-col gap-1 mt-1">
                                              <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full border w-fit ${log.algae === 'High' || log.algae === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : log.algae === 'Moderate' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                Algae: {log.algae}
                                              </span>
                                              <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full border w-fit ${log.turbidity > 6 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                Turbidity: Lvl {log.turbidity}
                                              </span>
                                          </div>
                                      </div>
                                  </td>

                                  <td className="p-4">
                                      <div className="flex items-center gap-2">
                                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                              <div className={`h-full rounded-full ${log.confidence > 90 ? 'bg-teal-500' : log.confidence > 75 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${log.confidence}%` }}></div>
                                          </div>
                                          <span className="text-[11px] font-bold text-slate-600">{log.confidence}%</span>
                                      </div>
                                  </td>

                                  <td className="p-4 text-right">
                                      <div className="flex items-center justify-end gap-3 relative">
                                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wide ${log.status === 'Verified' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                              {log.status === 'Verified' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {log.status}
                                          </span>
                                          
                                          <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
                                              <button onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                              
                                              <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === log.id ? null : log.id);
                                                }} 
                                                className={`p-1.5 rounded-lg transition-colors ${activeMenu === log.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                              >
                                                  <MoreHorizontal className="w-4 h-4" />
                                              </button>

                                              {activeMenu === log.id && (
                                                  <div ref={menuRef} className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right text-left">
                                                      <div className="p-1.5 space-y-1">
                                                          <button onClick={(e) => { e.stopPropagation(); handleMenuAction('edit', log.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors">
                                                              <Pencil className="w-3.5 h-3.5" /> Edit Details
                                                          </button>
                                                          <button onClick={(e) => { e.stopPropagation(); handleMenuAction('dataset', log.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors">
                                                              <Database className="w-3.5 h-3.5" /> Add to Training
                                                          </button>
                                                          <div className="h-px bg-slate-100 my-1"></div>
                                                          <button onClick={(e) => { e.stopPropagation(); handleMenuAction('delete', log.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                              <Trash2 className="w-3.5 h-3.5" /> Delete Log
                                                          </button>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          )})
                      )}
                  </tbody>
              </table>
          </div>

          {filteredLogs.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl mt-auto">
                <p className="text-xs text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-700">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-700">{Math.min(indexOfLastItem, filteredLogs.length)}</span> of <span className="font-bold text-slate-700">{filteredLogs.length}</span> logs
                </p>
                
                <div className="flex items-center gap-1">
                    <button 
                        onClick={prevPage} 
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white hover:bg-teal-50 hover:border-teal-200 text-slate-600 hover:text-teal-600'}`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {pageNumbers.map(number => (
                        <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-all ${
                                currentPage === number 
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600'
                            }`}
                        >
                            {number}
                        </button>
                    ))}

                    <button 
                        onClick={nextPage} 
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white hover:bg-teal-50 hover:border-teal-200 text-slate-600 hover:text-teal-600'}`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
          )}
      </div>

      <ScanDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />

    </AdminLayout>
  );
};

export default AIScanLogs;