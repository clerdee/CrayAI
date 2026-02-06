import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  ShieldAlert, CheckCircle, XCircle, MessageSquare, Image as ImageIcon, 
  AlertTriangle, Calendar, X, Loader, Trash2, Mail, Layers, CheckCheck, Globe, User
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Moderation = () => {
  // --- DATA STATE ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); 
  const [selectedDateTime, setSelectedDateTime] = useState(''); 

  // --- NOTIFICATION STATE (TOAST) ---
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // --- MODAL STATE (CONFIRMATION) ---
  // Structure: { id: null, type: 'BULK' | 'Post' | 'Comment', action: 'Approved' | 'Deleted', count: 0 }
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

  // --- HELPER: GET USER DETAILS ---
  // Extracts user info safely from the item object
  const getUserDetails = (item) => {
    const authorObj = item.author || {};
    return {
        name: authorObj.name || "Unknown",
        email: authorObj.email || "No Email",
        image: authorObj.profilePic || null
    };
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

  // --- 2. INITIATE ACTIONS (OPEN MODAL) ---
  
  // A. Single Item Action
  const initiateAction = (id, type, action) => {
    setActionModal({ id, type, action });
  };

  // B. Bulk Action
  const initiateBulkApprove = () => {
    const pendingItems = finalFilteredItems;
    if (pendingItems.length === 0) return;
    
    setActionModal({ 
        id: null, 
        type: 'BULK', 
        action: 'Approved', 
        count: pendingItems.length 
    });
  };

  // --- 3. EXECUTE ACTION (ROUTER) ---
  const confirmAction = async () => {
    if (!actionModal) return;

    if (actionModal.type === 'BULK') {
        await executeBulkApprove();
    } else {
        await executeSingleAction();
    }
  };

  // --- 3A. SINGLE ITEM LOGIC ---
  const executeSingleAction = async () => {
    const { id, type, action } = actionModal;
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_BASE_URL}/auth/admin/moderation/${type}/${id}`, 
        { status: action }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItems(prevItems => prevItems.map(item => 
        item.id === id ? { ...item, status: 'Resolved', actionTaken: action } : item
      ));

      showToast(`${type} ${action === 'Deleted' ? 'Removed' : 'Verified'}!`, "success");
      setActionModal(null); 

    } catch (error) {
      console.error(error);
      showToast("Action failed. Please try again.", "error");
    }
  };

  // --- 3B. BULK APPROVE LOGIC ---
  const executeBulkApprove = async () => {
    const pendingItems = finalFilteredItems;
    try {
        const token = localStorage.getItem('token');
        
        await Promise.all(pendingItems.map(item => 
            axios.put(`${API_BASE_URL}/auth/admin/moderation/${item.type}/${item.id}`, 
                { status: 'Approved' },
                { headers: { Authorization: `Bearer ${token}` } }
            )
        ));

        setItems(prev => prev.map(item => 
            pendingItems.find(p => p.id === item.id) 
                ? { ...item, status: 'Resolved', actionTaken: 'Approved' } 
                : item
        ));

        showToast(`Successfully approved ${pendingItems.length} items`, 'success');
        setActionModal(null);
    } catch (error) {
        console.error(error);
        showToast("Failed to batch approve", 'error');
    }
  };

  // --- CALCULATE STATS ---
  const stats = {
    pending: items.filter(i => i.status !== 'Resolved').length,
    total: items.length,
    approved: items.filter(i => i.actionTaken === 'Approved').length,
    flagged: items.filter(i => i.actionTaken === 'Deleted').length, 
    postsCount: items.filter(i => i.type === 'Post' && i.status !== 'Resolved').length,
    commentsCount: items.filter(i => i.type === 'Comment' && i.status !== 'Resolved').length
  };

  // --- FILTERS ---
  const finalFilteredItems = items.filter(item => {
    // Only show items that are NOT resolved
    if (item.status === 'Resolved') return false;

    const matchesType = activeTab === 'All' ? true : item.type === activeTab;
    let matchesDate = true;
    if (selectedDateTime) {
        const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
        const selectedDatePart = selectedDateTime.split('T')[0];
        matchesDate = itemDate === selectedDatePart;
    }
    return matchesType && matchesDate;
  });

  if (loading) {
    return (
        <AdminLayout title="Content Moderation">
            <div className="h-[600px] flex items-center justify-center text-slate-400 gap-2">
                <Loader className="animate-spin" /> Loading content queue...
            </div>
        </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Content Moderation">
      
      {/* 1. STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
                <p className="text-orange-600/80 text-xs font-bold uppercase">Pending Review</p>
                <h4 className="text-2xl font-bold text-orange-900">{stats.pending}</h4>
            </div>
        </div>

        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Layers className="w-6 h-6" />
            </div>
            <div>
                <p className="text-blue-600/80 text-xs font-bold uppercase">Total Content</p>
                <h4 className="text-2xl font-bold text-blue-900">{stats.total}</h4>
            </div>
        </div>

        <div className="bg-teal-50 p-5 rounded-2xl border border-teal-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                <CheckCircle className="w-6 h-6" />
            </div>
            <div>
                <p className="text-teal-600/80 text-xs font-bold uppercase">Approved Content</p>
                <h4 className="text-2xl font-bold text-teal-900">{stats.approved}</h4>
            </div>
        </div>

        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
                <p className="text-red-600/80 text-xs font-bold uppercase">Flagged / Removed</p>
                <h4 className="text-2xl font-bold text-red-900">{stats.flagged}</h4>
            </div>
        </div>

      </div>

      {/* 2. MAIN QUEUE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
        
        {/* TOOLBAR */}
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4">
            
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto overflow-x-auto gap-1">
                <button 
                    onClick={() => setActiveTab('All')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    All Pending
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'All' ? 'bg-slate-100 text-slate-600' : 'bg-white text-slate-400'}`}>
                        {stats.pending}
                    </span>
                </button>

                <button 
                    onClick={() => setActiveTab('Post')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'Post' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <ImageIcon className="w-4 h-4" /> Posts
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'Post' ? 'bg-teal-50 text-teal-600' : 'bg-white text-slate-400'}`}>
                        {stats.postsCount}
                    </span>
                </button>

                <button 
                    onClick={() => setActiveTab('Comment')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'Comment' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MessageSquare className="w-4 h-4" /> Comments
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'Comment' ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-400'}`}>
                        {stats.commentsCount}
                    </span>
                </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm w-full sm:w-auto focus-within:border-teal-500 transition-all">
                    <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                    <input type="datetime-local" value={selectedDateTime} onChange={(e) => setSelectedDateTime(e.target.value)} className="text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer w-full sm:w-auto" />
                    {selectedDateTime && <button onClick={() => setSelectedDateTime('')} className="ml-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                </div>
                
                {/* 👇 APPROVE ALL (Triggers Modal) */}
                <button 
                    onClick={initiateBulkApprove} 
                    disabled={finalFilteredItems.length === 0}
                    className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all w-full sm:w-auto shadow-lg ${
                        finalFilteredItems.length === 0 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-200'
                    }`}
                >
                    <CheckCheck className="w-4 h-4" /> Approve All
                </button>
            </div>
        </div>

        {/* CONTENT LIST (GRID) */}
        <div className="flex-1 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live Content Queue
                </h3>
            </div>

            {finalFilteredItems.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {finalFilteredItems.map((item) => {
                        // 👇 GET USER DATA HERE
                        const user = getUserDetails(item); 

                        return (
                            <div key={`${item.type}-${item.id}`} className="border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-all bg-white relative group flex flex-col h-full">
                                
                                {/* Status Badge */}
                                <div className="absolute top-6 right-6 flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 z-10">
                                    <Globe className="w-3 h-3" /> Live (Pending)
                                </div>

                                {/* Header with User Info */}
                                <div className="flex flex-col gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${item.type === 'Post' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'}`}>
                                            {item.type === 'Post' ? <ImageIcon className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                            {item.type}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">• {new Date(item.timestamp).toLocaleString()}</span>
                                    </div>

                                    {/* User Details Card */}
                                    <div className="flex items-center gap-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                        {user.image ? (
                                            <img 
                                                src={user.image} 
                                                alt={user.name} 
                                                className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                                                onError={(e) => { e.target.onerror = null; e.target.src=`https://ui-avatars.com/api/?name=${user.name}&background=random`; }} 
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border border-white shadow-sm text-sm">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate">@{user.name}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                                                <Mail className="w-3 h-3" /> {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 flex-1">
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 flex-shrink-0">
                                            {item.type === 'Post' ? <ImageIcon className="w-4 h-4 text-teal-600" /> : <MessageSquare className="w-4 h-4 text-blue-600" />}
                                        </div>
                                        <p className="text-slate-800 text-sm leading-relaxed font-medium line-clamp-4">
                                            {item.content || <span className="italic text-slate-400">No text content</span>}
                                        </p>
                                    </div>

                                    {item.media && item.media.length > 0 && (
                                        <div className="mt-3 pl-7">
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {item.media.map((m, idx) => (
                                                    <a key={idx} href={m.uri} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                                        <img src={getDisplayUrl(m.uri)} alt="Post media" className="h-24 w-24 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity bg-white" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-end gap-2 mt-auto pt-2">
                                    <button onClick={() => initiateAction(item.id, item.type, 'Approved')} className="flex-1 px-3 py-2.5 text-slate-600 text-xs font-bold hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-200 hover:border-green-200">
                                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                                    </button>
                                    <button onClick={() => initiateAction(item.id, item.type, 'Deleted')} className="flex-1 px-3 py-2.5 bg-white text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 border border-red-100 hover:border-red-200 shadow-sm">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle className="w-12 h-12 mb-4 text-teal-100" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-xs">No pending content to review.</p>
                </div>
            )}
        </div>

        {/* --- CUSTOM CONFIRMATION MODAL (Handles Both Single & Bulk) --- */}
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
                            {actionModal.type === 'BULK' 
                                ? <Layers className="w-8 h-8" />
                                : actionModal.action === 'Deleted' ? <Trash2 className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />
                            }
                        </div>
                        
                        <h3 className={`text-xl font-bold text-center ${
                            actionModal.action === 'Deleted' ? 'text-red-900' : 'text-teal-900'
                        }`}>
                            {actionModal.type === 'BULK' 
                                ? 'Approve All?' 
                                : actionModal.action === 'Deleted' ? 'Delete Content?' : 'Approve Content'
                            }
                        </h3>
                        <p className={`text-sm text-center mt-1 ${
                            actionModal.action === 'Deleted' ? 'text-red-600/80' : 'text-teal-600/80'
                        }`}>
                            {actionModal.type === 'BULK'
                                ? `Verify ${actionModal.count} visible items?`
                                : actionModal.action === 'Deleted' 
                                    ? 'This will hide the content from users.' 
                                    : 'This marks the content as verified.'
                            }
                        </p>
                    </div>

                    <div className="p-6">
                        <button onClick={confirmAction} className={`w-full py-3 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                            actionModal.action === 'Deleted' 
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                            : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'
                        }`}>
                            Confirm {actionModal.type === 'BULK' ? 'Approve All' : actionModal.action === 'Deleted' ? 'Deletion' : 'Approval'}
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