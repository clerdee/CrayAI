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
  // --- STATE MANAGEMENT ---
  const [logs, setLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- MENU & MODAL STATE ---
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  // --- PAGINATION STATE (Matches UserManagement) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  // --- 1. FETCH DATA FROM API ---
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Using real API call structure
      const response = await axios.get(`${API_BASE_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Assuming API returns { success: true, data: [...] } or just the array
      if (response.data) {
         setLogs(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      // Optional: Add toast here if you have a toast helper
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (action, logId) => {
    console.log(`${action} clicked for log ${logId}`);
    setActiveMenu(null); 
  };

  // --- FILTERING LOGIC ---
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

  // --- PAGINATION LOGIC (Matches UserManagement) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // Generate Page Numbers Array
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <AdminLayout title="AI Scan Logs">
      
      {/* 1. CONTROLS HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search logs (ID, User, Species)..." 
                value={searchQuery}
                onChange={(e) => { 
                    setSearchQuery(e.target.value); 
                    setCurrentPage(1); // Reset to page 1 on search
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

      {/* 2. LOGS TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col"> 
          
          <div className="overflow-visible flex-1">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-6 w-16 text-center">#</th>
                          <th className="p-6">Scan Details</th>
                          <th className="p-6">User / Pond</th> 
                          <th className="p-6">AI Prediction</th>
                          <th className="p-6">Confidence</th>
                          <th className="p-6 text-right">Status & Action</th>
                      </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                      {loading ? (
                          <tr>
                              <td colSpan="6" className="p-24 text-center text-slate-400">
                                  <div className="flex flex-col items-center justify-center">
                                      <Loader className="w-10 h-10 animate-spin mb-3 text-teal-500" />
                                      <p className="text-sm font-medium animate-pulse">Retrieving scan logs...</p>
                                  </div>
                              </td>
                          </tr>
                      ) : currentLogs.length === 0 ? (
                          <tr>
                              <td colSpan="6" className="p-12 text-center">
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
                          currentLogs.map((log, index) => (
                              <tr key={log.id || index} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                                  <td className="p-6 text-center text-slate-400 font-medium text-sm">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                  </td>
                                  
                                  <td className="p-6">
                                      <div className="flex items-center gap-4">
                                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100 shadow-sm relative shrink-0">
                                              <img src={log.image} alt="Scan" className="w-full h-full object-cover" />
                                              {log.health !== 'Healthy' && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><AlertTriangle className="text-white w-5 h-5 drop-shadow-md" /></div>}
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-900 text-sm">{log.id}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{new Date(log.date || log.createdAt).toLocaleDateString()}</p>
                                          </div>
                                      </div>
                                  </td>

                                  <td className="p-6">
                                      <div>
                                          <p className="text-sm font-bold text-slate-700">{log.user}</p>
                                          <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                            <MapPin className="w-3 h-3 text-teal-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{log.pond || 'Main Pond'}</span>
                                          </div>
                                      </div>
                                  </td>

                                  <td className="p-6">
                                      <div className="space-y-1.5">
                                          <p className="text-sm font-bold text-slate-800 italic">{log.species}</p>
                                          <div className="flex flex-wrap items-center gap-2">
                                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${log.gender?.includes('Female') ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{log.gender}</span>
                                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${log.health === 'Healthy' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{log.health}</span>
                                          </div>
                                      </div>
                                  </td>

                                  <td className="p-6">
                                      <div className="flex items-center gap-3">
                                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                              <div className={`h-full rounded-full ${log.confidence > 90 ? 'bg-teal-500' : log.confidence > 75 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${log.confidence}%` }}></div>
                                          </div>
                                          <span className="text-xs font-bold text-slate-600">{log.confidence}%</span>
                                      </div>
                                  </td>

                                  <td className="p-6 text-right">
                                      <div className="flex items-center justify-end gap-4 relative">
                                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${log.status === 'Verified' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
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

                                              {/* DROPDOWN MENU */}
                                              {activeMenu === log.id && (
                                                  <div ref={menuRef} className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                                      <div className="p-1.5 space-y-1">
                                                          <button onClick={(e) => { e.stopPropagation(); handleMenuAction('edit', log.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                              <Pencil className="w-3.5 h-3.5" /> Edit Details
                                                          </button>
                                                          <button onClick={(e) => { e.stopPropagation(); handleMenuAction('dataset', log.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                              <Database className="w-3.5 h-3.5" /> Add to Training
                                                          </button>
                                                          <div className="h-px bg-slate-100 my-1"></div>
                                                          <button onClick={(e) => { e.stopPropagation(); handleMenuAction('delete', log.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left">
                                                              <Trash2 className="w-3.5 h-3.5" /> Delete Log
                                                          </button>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>

          {/* 3. PAGINATION FOOTER (Matches UserManagement Style) */}
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
                    
                    {/* Render Page Numbers - Simple Map like UserManagement */}
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