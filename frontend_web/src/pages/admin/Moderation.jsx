import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  ShieldAlert, CheckCircle, XCircle, MessageSquare, Image as ImageIcon, 
  UserX, AlertTriangle, History, RotateCcw, Calendar, X, Loader, Trash2, Mail 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Moderation = () => {
  // --- DATA STATE ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); 
  const [showHistory, setShowHistory] = useState(false); 
  const [selectedDateTime, setSelectedDateTime] = useState(''); 

  // --- NOTIFICATION STATE (TOAST) ---
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // --- MODAL STATE (CONFIRMATION) ---
  const [actionModal, setActionModal] = useState(null); 

  // --- HELPER: SHOW TOAST ---
  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
    }, 3000); 
  };

  // --- HELPER: FIX IPHONE HEIC IMAGES ---
  const getDisplayUrl = (url) => {
    if (!url) return '';
    if (url.includes('cloudinary') && url.toLowerCase().endsWith('.heic')) {
        return url.replace(/\.heic$/i, '.jpg');
    }
    return url;
  };

  // --- 1. FETCH DATA ---
  const fetchModerationData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/auth/admin/moderation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setItems(response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch moderation data:", error);
      showToast("Failed to load content feed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationData();
  }, []);

  // --- 2. TRIGGER MODAL ---
  const initiateAction = (id, type, action) => {
    setActionModal({ id, type, action });
  };

  // --- 3. EXECUTE ACTION (API CALL) ---
  const confirmAction = async () => {
    if (!actionModal) return;
    const { id, type, action } = actionModal;

    try {
      const token = localStorage.getItem('token');
      
      if (action === 'Deleted') {
        await axios.delete(`${API_BASE_URL}/auth/admin/moderation/${type}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Optimistic Update
      setItems(prevItems => prevItems.map(item => 
        item.id === id ? { ...item, status: 'Resolved', actionTaken: action } : item
      ));

      showToast(`${type} ${action} successfully!`, "success");
      setActionModal(null); 

    } catch (error) {
      console.error(error);
      showToast("Action failed. Please try again.", "error");
    }
  };

  // --- FILTERS ---
  const statusFiltered = items.filter(item => 
    showHistory ? item.status === 'Resolved' : item.status !== 'Resolved'
  );

  const finalFilteredItems = statusFiltered.filter(item => {
    const matchesType = activeTab === 'All' ? true : item.type === activeTab;
    let matchesDate = true;
    if (selectedDateTime) {
        const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
        const selectedDatePart = selectedDateTime.split('T')[0];
        matchesDate = itemDate === selectedDatePart;
    }
    return matchesType && matchesDate;
  });

  const postCount = items.filter(i => i.type === 'Post').length;
  const commentCount = items.filter(i => i.type === 'Comment').length;

  if (loading) {
    return (
        <AdminLayout title="Content Moderation">
            <div className="h-[600px] flex items-center justify-center text-slate-400 gap-2">
                <Loader className="animate-spin" /> Loading content...
            </div>
        </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Content Moderation">
      
      {/* 1. STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600"><ShieldAlert className="w-6 h-6" /></div>
            <div><p className="text-red-500 text-xs font-bold uppercase">Pending Review</p><h4 className="text-2xl font-bold text-red-900">{items.filter(i=>i.status!=='Resolved').length}</h4></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><ImageIcon className="w-6 h-6" /></div>
            <div><p className="text-slate-500 text-xs font-bold uppercase">Total Posts</p><h4 className="text-2xl font-bold text-slate-800">{postCount}</h4></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><MessageSquare className="w-6 h-6" /></div>
            <div><p className="text-slate-500 text-xs font-bold uppercase">Total Comments</p><h4 className="text-2xl font-bold text-slate-800">{commentCount}</h4></div>
        </div>
      </div>

      {/* 2. MAIN QUEUE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
        
        {/* TOOLBAR */}
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto">
                <button onClick={() => setActiveTab('All')} className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
                <button onClick={() => setActiveTab('Post')} className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'Post' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ImageIcon className="w-4 h-4" /> Posts</button>
                <button onClick={() => setActiveTab('Comment')} className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'Comment' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><MessageSquare className="w-4 h-4" /> Comments</button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm w-full sm:w-auto focus-within:border-teal-500 transition-all">
                    <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                    <input type="datetime-local" value={selectedDateTime} onChange={(e) => setSelectedDateTime(e.target.value)} className="text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer w-full sm:w-auto" />
                    {selectedDateTime && <button onClick={() => setSelectedDateTime('')} className="ml-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                </div>
                <button onClick={() => setShowHistory(!showHistory)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all w-full sm:w-auto ${showHistory ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                    {showHistory ? <RotateCcw className="w-4 h-4" /> : <History className="w-4 h-4" />}
                    {showHistory ? `Back to Queue` : `History`}
                </button>
            </div>
        </div>

        {/* CONTENT LIST */}
        <div className="flex-1 p-6 space-y-4">
            <div className="flex justify-between items-end mb-2">
                <h3 className="text-xs font-bold uppercase text-slate-400">{showHistory ? 'Resolved History' : 'Live Content Stream'}</h3>
            </div>

            {finalFilteredItems.length > 0 ? (
                finalFilteredItems.map((item) => (
                    <div key={`${item.type}-${item.id}`} className={`border rounded-2xl p-6 transition-shadow bg-slate-50/50 ${showHistory ? 'border-slate-200 opacity-75' : 'border-slate-100 hover:shadow-md'}`}>
                        
                        {/* HEADER: Type, Date, Author */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${item.type === 'Post' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {item.type === 'Post' ? <ImageIcon className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                    {item.type}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">• {new Date(item.timestamp).toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                <span className="text-xs text-slate-400 uppercase font-bold">Author:</span>
                                <span className="font-bold text-slate-900">@{item.author}</span>
                                {item.email && (
                                    <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 border-l border-slate-200 pl-2 ml-1">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {item.email}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* CONTENT BODY */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-col gap-2">
                            <div className="flex gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    {item.type === 'Post' ? <ImageIcon className="w-5 h-5 text-teal-600" /> : <MessageSquare className="w-5 h-5 text-blue-600" />}
                                </div>
                                <p className="text-slate-800 text-sm leading-relaxed font-medium">
                                    {item.content || <span className="italic text-slate-400">No text content</span>}
                                </p>
                            </div>

                            {/* IMAGE RENDERING */}
                            {item.media && item.media.length > 0 && (
                                <div className="mt-3 pl-8">
                                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Attached Media:</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {item.media.map((m, idx) => (
                                            <a key={idx} href={m.uri} target="_blank" rel="noopener noreferrer">
                                                <img 
                                                    src={getDisplayUrl(m.uri)}
                                                    alt="Post media" 
                                                    className="h-32 w-32 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity cursor-pointer bg-slate-100" 
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ACTION BUTTONS (TRIGGER MODAL) */}
                        {!showHistory && (
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button onClick={() => initiateAction(item.id, item.type, 'Approved')} className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 hover:text-green-600 rounded-xl transition-colors flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Approve (Keep)
                                </button>
                                <button onClick={() => initiateAction(item.id, item.type, 'Deleted')} className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Delete Content
                                </button>
                            </div>
                        )}
                        {showHistory && (
                             <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 text-xs text-slate-400 font-bold uppercase">
                                Action Taken: <span className="text-slate-700 ml-1">{item.actionTaken || 'Resolved'}</span>
                             </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle className="w-12 h-12 mb-4 text-teal-100" />
                    <p>No records found.</p>
                </div>
            )}
        </div>

        {/* --- CUSTOM CONFIRMATION MODAL --- */}
        {actionModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-0 animate-in zoom-in-95 duration-200 flex flex-col">
                    
                    {/* Header Color based on Action */}
                    <div className={`relative p-8 flex flex-col items-center justify-center border-b ${
                        actionModal.action === 'Deleted' ? 'bg-red-50 border-red-100' : 'bg-teal-50 border-teal-100'
                    }`}>
                        <button onClick={() => setActionModal(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors">
                            <X className={`w-5 h-5 ${actionModal.action === 'Deleted' ? 'text-red-300' : 'text-teal-300'}`} />
                        </button>
                        
                        <div className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center mb-4 ring-4 ${
                            actionModal.action === 'Deleted' 
                            ? 'bg-white text-red-500 shadow-red-100 ring-red-100' 
                            : 'bg-white text-teal-500 shadow-teal-100 ring-teal-100'
                        }`}>
                            {actionModal.action === 'Deleted' ? <Trash2 className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                        </div>
                        
                        <h3 className={`text-xl font-bold text-center ${
                            actionModal.action === 'Deleted' ? 'text-red-900' : 'text-teal-900'
                        }`}>
                            {actionModal.action === 'Deleted' ? 'Delete Content?' : 'Approve Content'}
                        </h3>
                        <p className={`text-sm text-center mt-1 ${
                            actionModal.action === 'Deleted' ? 'text-red-600/80' : 'text-teal-600/80'
                        }`}>
                            {actionModal.action === 'Deleted' ? 'This action cannot be undone.' : 'This item will remain visible.'}
                        </p>
                    </div>

                    <div className="p-6">
                        <button onClick={confirmAction} className={`w-full py-3 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                            actionModal.action === 'Deleted' 
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                            : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'
                        }`}>
                            Confirm {actionModal.action === 'Deleted' ? 'Deletion' : 'Approval'}
                        </button>
                        <button onClick={() => setActionModal(null)} className="w-full mt-3 py-3 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- GLOBAL TOAST NOTIFICATION --- */}
        <div className={`fixed bottom-6 right-6 z-[250] transition-all duration-300 transform ${notification.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
            <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
                notification.type === 'success' 
                ? 'bg-white border-teal-100 text-teal-800' 
                : 'bg-white border-red-100 text-red-800'
            }`}>
                {notification.type === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-teal-500" />
                ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                )}
                <div>
                    <h4 className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                    <p className="text-xs opacity-80">{notification.message}</p>
                </div>
            </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default Moderation;