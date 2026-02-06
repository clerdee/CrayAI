import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast'; 
import { FileText, Check, Clock, Tag, Search, Plus, MessageSquare, Edit3, Trash2, Loader2, XCircle, Sparkles, AlertTriangle, AlertCircle, LayoutList, MessageCircle } from 'lucide-react';
import StatCard from '../../../components/admin/StatCard';
import AddQaModal from './AddQaModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ChatSimulator from './ChatSimulator';
import UnansweredTab from './UnansweredTab';

const ChatbotMode = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [dataset, setDataset] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  
  // 📊 Real-Time Stats State
  const [stats, setStats] = useState({ 
    total_interactions: 0, // 👈 Added this field
    accuracy: 0, 
    failed_count: 0, 
    flagged_count: 0 
  });

  // Linking State for promoting logs
  const [promotingLogId, setPromotingLogId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // UI States
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // API URL
  const API_URL = 'http://localhost:5001/api/training/chatbot';

  // --- 1. DATA FETCHING ---
  const fetchData = async () => {
    try {
      const [qaResponse, statsResponse] = await Promise.all([
        axios.get(API_URL),        
        axios.get(`${API_URL}/stats`) 
      ]);
      setDataset(qaResponse.data);
      setStats(statsResponse.data); 
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to sync with AI Brain");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [lastUpdated]);

  // --- 2. CALCULATE COUNTS (For the Tabs) ---
  const counts = {
    all: dataset.length,
    approved: dataset.filter(i => i.status === 'Approved').length,
    pending: dataset.filter(i => i.status === 'Pending Review').length,
    unanswered: stats.failed_count
  };

  // --- 3. HANDLERS ---
  const handleSave = async (formData) => {
    const savePromise = new Promise(async (resolve, reject) => {
      try {
        if (editingItem && editingItem._id) {
          // Update
          await axios.put(`${API_URL}/${editingItem._id}`, formData);
          resolve("Knowledge updated successfully!");
        } else {
          // Create
          await axios.post(API_URL, formData);
          resolve("New pair added successfully!");
          
          // Delete log if promoted
          if (promotingLogId) {
            await axios.delete(`${API_URL}/logs/${promotingLogId}`);
            setPromotingLogId(null);
          }
        }
        setIsAddModalOpen(false);
        setLastUpdated(Date.now()); 
      } catch (error) {
        console.error("Error saving:", error);
        reject("Failed to save changes.");
      }
    });

    toast.promise(savePromise, {
      loading: 'Saving to brain...',
      success: (msg) => <b>{msg}</b>,
      error: (err) => <b>{err}</b>,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        await axios.delete(`${API_URL}/${deletingId}`);
        setIsDeleteModalOpen(false);
        setLastUpdated(Date.now());
        resolve("Item deleted.");
      } catch (error) {
        reject("Could not delete item.");
      }
    });

    toast.promise(deletePromise, {
      loading: 'Deleting...',
      success: <b>Q&A removed!</b>,
      error: <b>Failed to delete.</b>,
    });
  };

  const handlePromoteLog = (logItem) => {
    setPromotingLogId(logItem._id);
    setEditingItem({
        query: logItem.query, 
        response: '',        
        topic: 'General',
        status: 'Approved'
    });
    setIsAddModalOpen(true);
  };

  // --- UI ACTIONS ---
  const handleOpenAdd = () => { setEditingItem(null); setPromotingLogId(null); setIsAddModalOpen(true); };
  const handleOpenEdit = (item) => { setEditingItem(item); setPromotingLogId(null); setIsAddModalOpen(true); };
  const handleOpenDelete = (id) => { setDeletingId(id); setIsDeleteModalOpen(true); };

  // --- FILTERING ---
  const filteredDataset = dataset.filter(item => {
    const matchesTab = 
      activeTab === 'All' ? true :
      activeTab === 'Approved' ? item.status === 'Approved' :
      activeTab === 'Pending' ? item.status === 'Pending Review' : true;

    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = 
      item.query.toLowerCase().includes(lowerQuery) || 
      item.response.toLowerCase().includes(lowerQuery) ||
      item.topic.toLowerCase().includes(lowerQuery);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="animate-in fade-in zoom-in duration-300 relative">
        <Toaster position="top-right" reverseOrder={false} />

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* 👇 UPDATED: Showing Total Interactions instead of Q&A Count */}
            <StatCard 
                title="Total Queries Received" 
                value={stats.total_interactions} 
                icon={MessageCircle} 
                color="bg-blue-50 text-blue-600" 
            />
            <StatCard 
                title="System Accuracy" 
                value={stats.accuracy + "%"} 
                icon={Check} 
                color={stats.accuracy > 80 ? "bg-teal-50 text-teal-600" : "bg-orange-50 text-orange-600"} 
            />
            <StatCard 
                title="Needs Attention" 
                value={counts.unanswered} 
                icon={Clock} 
                color={counts.unanswered > 0 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-600"} 
            />
            <StatCard 
                title="Flagged Content" 
                value={stats.flagged_count} 
                icon={AlertTriangle} 
                color={stats.flagged_count > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"} 
            />
        </div>

        {/* MAIN WORKSPACE */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
            
            {/* TOOLBAR & TABS */}
            <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4">
                
                {/* 🏷️ TABS WITH BADGES */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-full xl:w-auto overflow-x-auto">
                    {[
                        { id: 'All', label: 'All Pairs', count: counts.all },
                        { id: 'Approved', label: 'Approved', count: counts.approved },
                        { id: 'Pending', label: 'Pending', count: counts.pending }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                activeTab === tab.id ? 'bg-slate-100 text-slate-600' : 'bg-white text-slate-400'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}

                    {/* Unanswered Tab (Special Style) */}
                    <div className="w-px h-6 bg-slate-200 mx-1 self-center hidden md:block"></div>

                    <button 
                        onClick={() => setActiveTab('Unanswered')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'Unanswered' 
                            ? 'bg-orange-100 text-orange-800 shadow-sm ring-1 ring-orange-200' 
                            : 'text-slate-500 hover:text-orange-600'
                        }`}
                    >
                        <AlertCircle className="w-4 h-4" /> Unanswered 
                        {counts.unanswered > 0 && (
                            <span className="bg-orange-500 text-white text-[10px] px-1.5 rounded-full shadow-sm animate-pulse">
                                {counts.unanswered}
                            </span>
                        )}
                    </button>
                </div>

                {/* SEARCH & ACTIONS */}
                <div className="flex gap-3 w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search knowledge..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 transition-all" 
                        />
                        {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><XCircle className="w-4 h-4" /></button>)}
                    </div>
                    
                    <button onClick={() => setIsSimulatorOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-teal-600 transition-colors shadow-sm whitespace-nowrap">
                        <Sparkles className="w-4 h-4" /> Test Bot
                    </button>
                    <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-slate-200 whitespace-nowrap">
                        <Plus className="w-4 h-4" /> Add Pair
                    </button>
                </div>
            </div>

            {/* CONTENT SWITCHER */}
            {activeTab === 'Unanswered' ? (
                // 1. Unanswered View
                <UnansweredTab 
                    key={lastUpdated} 
                    searchQuery={searchQuery} 
                    onConvertToQa={handlePromoteLog} 
                />
            ) : (
                // 2. Standard Table View
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-3 text-teal-500" />
                            <p className="text-sm">Loading Knowledge Base...</p>
                        </div>
                    ) : filteredDataset.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                            {searchQuery ? (
                                <>
                                    <Search className="w-8 h-8 mb-3 opacity-20" />
                                    <p className="text-sm">No matches found for "{searchQuery}"</p>
                                    <button onClick={() => setSearchQuery('')} className="mt-2 text-teal-600 text-xs font-bold hover:underline">Clear Search</button>
                                </>
                            ) : (
                                <>
                                    <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
                                    <p className="text-sm">No Q&A pairs found in "{activeTab}".</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold">
                                        <th className="p-4 w-1/3">User Query (Input)</th>
                                        <th className="p-4 w-1/3">Bot Response (Output)</th>
                                        <th className="p-4">Topic</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDataset.map((item) => (
                                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 align-top">
                                                <div className="flex gap-3">
                                                    <div className="mt-1 min-w-[24px]"><MessageSquare className="w-5 h-5 text-slate-400" /></div>
                                                    <p className="text-sm font-medium text-slate-800">{item.query}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex gap-3">
                                                    <div className="mt-1 min-w-[24px]"><div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[10px] text-teal-700 font-bold">AI</div></div>
                                                    <p className="text-sm text-slate-600 line-clamp-3">{item.response}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{item.topic}</span></td>
                                            <td className="p-4 align-top">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Approved' ? 'bg-green-50 text-green-600' : item.status === 'Needs Improvement' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleOpenDelete(item._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* DIALOGS */}
        <AddQaModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSave} initialData={editingItem} />
        <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} />
        <ChatSimulator isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} onInteraction={() => setLastUpdated(Date.now())} />
    </div>
  );
};

export default ChatbotMode;