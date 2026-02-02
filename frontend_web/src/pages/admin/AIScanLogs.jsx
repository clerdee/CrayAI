import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Search, Filter, CheckCircle, XCircle, AlertTriangle, Eye, MoreHorizontal, MapPin, Pencil, Database, Download, Trash2 } from 'lucide-react';
import ScanDetailsModal from './ScanDetailsModal';

// --- MOCK DATA ---
const MOCK_LOGS = [
  { 
    id: 'SCN-8821', 
    date: 'Oct 24, 2026 • 10:42 AM', 
    user: 'John Doe', 
    pond: 'Pond 01',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=100', 
    species: 'C. quadricarinatus', 
    gender: 'Female (Berried)', 
    health: 'Healthy', 
    size: '14.2 cm', 
    age: 'Adult (>7 months)', 
    confidence: 98.2, 
    status: 'Verified',
    location: '14.5995° N, 120.9842° E' 
  },
  { 
    id: 'SCN-8822', 
    date: 'Oct 24, 2026 • 11:15 AM', 
    user: 'Sarah Smith', 
    pond: 'Pond 02',
    image: 'https://images.unsplash.com/photo-1551732607-b247c7c3c437?auto=format&fit=crop&q=80&w=100', 
    species: 'C. quadricarinatus', 
    gender: 'Male', 
    health: 'Shell Disease', 
    size: '12.5 cm', 
    age: 'Adult (6 months)', 
    confidence: 85.5, 
    status: 'Flagged',
    location: '14.6000° N, 120.9800° E'
  },
  { 
    id: 'SCN-8823', 
    date: 'Oct 24, 2026 • 12:30 PM', 
    user: 'Farm_Manager_X', 
    pond: 'Pond 03',
    image: 'https://images.unsplash.com/photo-1571752726703-4e706067a45e?auto=format&fit=crop&q=80&w=100', 
    species: 'Unknown', 
    gender: 'Unknown', 
    health: 'Unknown', 
    size: '--', 
    age: '--', 
    confidence: 42.1, 
    status: 'Unverified',
    location: '14.5900° N, 120.9900° E'
  },
  { 
    id: 'SCN-8824', 
    date: 'Oct 24, 2026 • 01:05 PM', 
    user: 'Mike Ross', 
    pond: 'Pond 04',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=100', 
    species: 'C. quadricarinatus', 
    gender: 'Female', 
    health: 'Healthy', 
    size: '15.8 cm', 
    age: 'Adult (>8 months)', 
    confidence: 99.1, 
    status: 'Verified',
    location: '14.6100° N, 120.9700° E'
  },
  { 
    id: 'SCN-8825', 
    date: 'Oct 24, 2026 • 02:15 PM', 
    user: 'John Doe',
    pond: 'Pond 01',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=100', 
    species: 'C. quadricarinatus', 
    gender: 'Male', 
    health: 'Healthy', 
    size: '13.1 cm', 
    age: 'Adult (6-7 months)', 
    confidence: 97.5, 
    status: 'Verified',
    location: '14.5995° N, 120.9842° E'
  },
];

const AIScanLogs = () => {
  const [filter, setFilter] = useState('All');
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

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

  return (
    <AdminLayout title="AI Scan Logs">
      
      {/* 1. CONTROLS HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 shadow-sm text-sm" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            {['All', 'Female', 'Male', 'Berried', 'Low Confidence'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-teal-600 text-white shadow-md shadow-teal-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                    {f}
                </button>
            ))}
            <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"><Filter className="w-5 h-5" /></button>
        </div>
      </div>

      {/* 2. LOGS TABLE */}
      {/* Key Fix: 'min-h' gives space at bottom, 'overflow-visible' allows dropdown to spill out */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[500px] overflow-visible"> 
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
                  {MOCK_LOGS.map((log, index) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-6 text-center text-slate-400 font-medium text-sm">{index + 1}</td>
                          
                          <td className="p-6">
                              <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm relative">
                                      <img src={log.image} alt="Scan" className="w-full h-full object-cover" />
                                      {log.health !== 'Healthy' && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><AlertTriangle className="text-white w-6 h-6 drop-shadow-md" /></div>}
                                  </div>
                                  <div><p className="font-bold text-slate-900">{log.id}</p><p className="text-xs text-slate-500 mt-1">{log.date}</p></div>
                              </div>
                          </td>

                          <td className="p-6">
                              <div>
                                  <p className="text-sm font-bold text-slate-800">{log.user}</p>
                                  <div className="flex items-center gap-1.5 mt-1 text-slate-500"><MapPin className="w-3 h-3 text-teal-500" /><span className="text-xs font-semibold uppercase tracking-wide text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">{log.pond}</span></div>
                              </div>
                          </td>

                          <td className="p-6">
                              <div className="space-y-1">
                                  <p className="text-sm font-bold text-slate-800 italic">{log.species}</p>
                                  <div className="flex items-center gap-2">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${log.gender.includes('Female') ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{log.gender}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${log.health === 'Healthy' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{log.health}</span>
                                  </div>
                              </div>
                          </td>

                          <td className="p-6">
                              <div className="flex items-center gap-3">
                                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${log.confidence > 90 ? 'bg-teal-500' : 'bg-red-500'}`} style={{ width: `${log.confidence}%` }}></div>
                                  </div>
                                  <span className="text-sm font-bold text-slate-700">{log.confidence}%</span>
                              </div>
                          </td>

                          <td className="p-6 text-right">
                              <div className="flex items-center justify-end gap-3 relative"> {/* Added relative here for positioning context */}
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${log.status === 'Verified' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                      {log.status === 'Verified' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} {log.status}
                                  </span>
                                  
                                  <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
                                      <button onClick={() => setSelectedLog(log)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Eye className="w-5 h-5" /></button>
                                      
                                      {/* 3 DOTS BUTTON */}
                                      <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Toggle: Close if already open, else Open
                                            setActiveMenu(activeMenu === log.id ? null : log.id);
                                        }} 
                                        className={`p-1.5 rounded-lg transition-colors ${activeMenu === log.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                      >
                                          <MoreHorizontal className="w-5 h-5" />
                                      </button>

                                      {/* DROPDOWN MENU - FIXED POSITIONING CONTEXT */}
                                      {activeMenu === log.id && (
                                          <div ref={menuRef} className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                              <div className="p-1.5 space-y-1">
                                                  <button onClick={() => handleMenuAction('edit', log.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                      <Pencil className="w-4 h-4" /> Edit Label
                                                  </button>
                                                  <button onClick={() => handleMenuAction('dataset', log.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                      <Database className="w-4 h-4" /> Add to Dataset
                                                  </button>
                                                  <button onClick={() => handleMenuAction('download', log.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left">
                                                      <Download className="w-4 h-4" /> Download
                                                  </button>
                                                  <div className="h-px bg-slate-100 my-1"></div>
                                                  <button onClick={() => handleMenuAction('delete', log.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left">
                                                      <Trash2 className="w-4 h-4" /> Delete Log
                                                  </button>
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      <ScanDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />

    </AdminLayout>
  );
};

export default AIScanLogs;