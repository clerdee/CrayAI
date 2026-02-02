import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { ShieldAlert, CheckCircle, XCircle, MessageSquare, Image as ImageIcon, UserX, AlertTriangle, History, RotateCcw, Calendar, X } from 'lucide-react';

// --- MOCK DATA ---
const MOCK_DATA = [
  { 
    id: 301, type: 'Post', author: 'Suspicious_User_99', 
    content: 'Buy cheap crayfish medicine here!', 
    reason: 'Spam Detected', severity: 'Medium', 
    dateString: 'Oct 24, 10:30 AM', timestamp: '2026-10-24T10:30', // ISO Format
    status: 'Pending'
  },
  { 
    id: 302, type: 'Comment', author: 'Angry_Fisher', 
    content: 'You are an idiot.', 
    reason: 'Toxic Language', severity: 'High', 
    dateString: 'Oct 24, 08:15 AM', timestamp: '2026-10-24T08:15',
    status: 'Pending'
  },
  { 
    id: 303, type: 'Post', author: 'New_Breeder_01', 
    content: 'Look at my new setup!', 
    reason: 'Irrelevant Content', severity: 'Low', 
    dateString: 'Oct 23, 05:45 PM', timestamp: '2026-10-23T17:45',
    status: 'Pending'
  },
  { 
    id: 401, type: 'Post', author: 'Spammer_01', 
    content: 'Free iPhone giveaway!', 
    reason: 'Spam', action: 'Deleted', admin: 'Admin_01',
    dateString: 'Oct 20, 02:00 PM', timestamp: '2026-10-20T14:00',
    status: 'Resolved'
  },
];

const Moderation = () => {
  const [activeTab, setActiveTab] = useState('All'); 
  const [showHistory, setShowHistory] = useState(false);
  
  // --- NEW: DATE & TIME FILTER STATE ---
  const [selectedDateTime, setSelectedDateTime] = useState(''); 

  // 1. Filter by Status (Pending vs History)
  const statusFiltered = MOCK_DATA.filter(item => 
    showHistory ? item.status === 'Resolved' : item.status === 'Pending'
  );

  // 2. Filter by Content Type & Date/Time
  const finalFilteredItems = statusFiltered.filter(item => {
    const matchesType = activeTab === 'All' ? true : item.type === activeTab;
    
    let matchesDate = true;
    if (selectedDateTime) {
        // Simple logic: Check if the item's date matches the selected date (ignoring exact minute for easier demo)
        const itemDate = item.timestamp.split('T')[0];
        const selectedDatePart = selectedDateTime.split('T')[0];
        matchesDate = itemDate === selectedDatePart;
    }

    return matchesType && matchesDate;
  });

  // --- COUNTS ---
  const pendingCount = MOCK_DATA.filter(i => i.status === 'Pending').length;
  const historyCount = MOCK_DATA.filter(i => i.status === 'Resolved').length;

  const handleAction = (id, action) => {
    alert(`${action} item #${id}`);
  };

  return (
    <AdminLayout title="Content Moderation">
      
      {/* 1. SAFETY OVERVIEW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600"><ShieldAlert className="w-6 h-6" /></div>
            <div><p className="text-red-500 text-xs font-bold uppercase">Pending High Severity</p><h4 className="text-2xl font-bold text-red-900">2</h4></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><ImageIcon className="w-6 h-6" /></div>
            <div><p className="text-slate-500 text-xs font-bold uppercase">Total Posts</p><h4 className="text-2xl font-bold text-slate-800">1,240</h4></div>
        </div>
        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"><AlertTriangle className="w-6 h-6" /></div>
            <div><p className="text-orange-500 text-xs font-bold uppercase">Total Flagged</p><h4 className="text-2xl font-bold text-orange-900">{pendingCount}</h4></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><MessageSquare className="w-6 h-6" /></div>
            <div><p className="text-slate-500 text-xs font-bold uppercase">Total Comments</p><h4 className="text-2xl font-bold text-slate-800">8,543</h4></div>
        </div>
      </div>

      {/* 2. MAIN QUEUE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
        
        {/* TOOLBAR */}
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4">
            
            {/* Left: Content Type Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto">
                <button onClick={() => setActiveTab('All')} className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    All
                </button>
                <button onClick={() => setActiveTab('Post')} className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'Post' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <ImageIcon className="w-4 h-4" /> Posts
                </button>
                <button onClick={() => setActiveTab('Comment')} className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'Comment' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <MessageSquare className="w-4 h-4" /> Comments
                </button>
            </div>

            {/* Right: Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                
                {/* --- DATE & TIME PICKER --- */}
                <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm w-full sm:w-auto focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                    <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                    
                    {/* CHANGED: type="datetime-local" adds the time selector */}
                    <input 
                        type="datetime-local" 
                        value={selectedDateTime}
                        onChange={(e) => setSelectedDateTime(e.target.value)}
                        className="text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer w-full sm:w-auto"
                    />
                    
                    {selectedDateTime && (
                        <button onClick={() => setSelectedDateTime('')} className="ml-2 text-slate-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* --- HISTORY TOGGLE --- */}
                <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all w-full sm:w-auto ${
                        showHistory 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    {showHistory ? <RotateCcw className="w-4 h-4" /> : <History className="w-4 h-4" />}
                    {showHistory ? `Back to Pending (${pendingCount})` : `History (${historyCount})`}
                </button>
            </div>
        </div>

        {/* CONTENT LIST */}
        <div className="flex-1 p-6 space-y-4">
            
            <div className="flex justify-between items-end mb-2">
                <h3 className="text-xs font-bold uppercase text-slate-400">
                    {showHistory ? 'Resolved History' : 'Pending Review Queue'}
                </h3>
                {selectedDateTime && (
                    <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2 py-1 rounded-md border border-teal-100">
                        Filtering by: {new Date(selectedDateTime).toLocaleString()}
                    </span>
                )}
            </div>

            {finalFilteredItems.length > 0 ? (
                finalFilteredItems.map((item) => (
                    <div key={item.id} className={`border rounded-2xl p-6 transition-shadow bg-slate-50/50 ${showHistory ? 'border-slate-200 opacity-75' : 'border-slate-100 hover:shadow-md'}`}>
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                {showHistory ? (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                                        item.action === 'Deleted' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {item.action === 'Deleted' ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                        {item.action}
                                    </span>
                                ) : (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                                        item.severity === 'High' ? 'bg-red-100 text-red-700' :
                                        item.severity === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        <AlertTriangle className="w-3 h-3" /> {item.reason}
                                    </span>
                                )}
                                <span className="text-xs text-slate-400 font-medium">• {item.dateString}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-400 uppercase font-bold">Author:</span>
                                <span className="font-bold">@{item.author}</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex gap-4">
                            <div className="mt-1 flex-shrink-0">
                                {item.type === 'Post' ? <ImageIcon className="w-5 h-5 text-teal-600" /> : <MessageSquare className="w-5 h-5 text-blue-600" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-slate-800 text-sm leading-relaxed font-medium">"{item.content}"</p>
                            </div>
                        </div>

                        {!showHistory && (
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button onClick={() => handleAction(item.id, 'Approved')} className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 hover:text-green-600 rounded-xl transition-colors flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Keep
                                </button>
                                <button onClick={() => handleAction(item.id, 'Deleted')} className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" /> Delete
                                </button>
                                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                                <button onClick={() => handleAction(item.id, 'Banned')} className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors tooltip" title="Ban User">
                                    <UserX className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle className="w-12 h-12 mb-4 text-teal-100" />
                    <p>No records found for {selectedDateTime ? new Date(selectedDateTime).toLocaleString() : 'this filter'}.</p>
                </div>
            )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default Moderation;