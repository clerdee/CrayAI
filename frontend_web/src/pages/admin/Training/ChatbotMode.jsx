import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast'; 
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, Check, Clock, Tag, Search, Plus, MessageSquare, Edit3, Trash2, 
  Loader2, XCircle, Sparkles, AlertTriangle, AlertCircle, LayoutList, 
  MessageCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';

// Adjust these imports if needed based on your file structure
import AdminLayout from '../../../layouts/AdminLayout';
import StatCard from '../../../components/admin/StatCard';
import AddQaModal from './AddQaModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ChatSimulator from './ChatSimulator';
import UnansweredTab from './UnansweredTab';

const ChatbotMode = () => {
  // --- 1. URL PARAMS FOR REDIRECT (From Header Notification) ---
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'All';

  // --- 2. STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dataset, setDataset] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  
  // 📊 Real-Time Stats State (Defaulted to 0 to prevent crash)
  const [stats, setStats] = useState({ 
    total_interactions: 0, 
    accuracy: 0, 
    failed_count: 0, 
    flagged_count: 0 
  });

  // Linking State for promoting logs (Unanswered -> QA)
  const [promotingLogId, setPromotingLogId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // UI States (Modals)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // --- 3. PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 5 Q&A pairs per page

  // API URL
  const API_URL = 'http://localhost:5001/api/training/chatbot';

  // --- 4. DATA FETCHING ---
  const fetchData = async () => {
    try {
      // Use Promise.allSettled so if one fails, the UI still loads what it can
      const [qaResponse, statsResponse] = await Promise.allSettled([
        axios.get(API_URL),        
        axios.get(`${API_URL}/stats`) 
      ]);

      // Process QA Dataset
      if (qaResponse.status === 'fulfilled') {
        setDataset(Array.isArray(qaResponse.value.data) ? qaResponse.value.data : []);
      } else {
        setDataset([]);
        // toast.error("Could not load Q&A pairs"); // Optional: suppress to avoid spamming toast
      }

      // Process Stats
      if (statsResponse.status === 'fulfilled' && statsResponse.value.data) {
        setStats(statsResponse.value.data);
      }

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

  // Handle URL Param changes (e.g. clicking notification while already on page)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
        setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // --- 5. CALCULATE COUNTS ---
  // Using safety checks (|| 0) to prevent crashes if data is undefined
  const counts = {
    all: dataset?.length || 0,
    approved: dataset?.filter(i => i.status === 'Approved').length || 0,
    pending: dataset?.filter(i => i.status === 'Pending Review').length || 0,
    unanswered: stats.failed_count || 0
  };

  // --- 6. FILTERING LOGIC ---
  const filteredDataset = (dataset || []).filter(item => {
    const matchesTab = 
      activeTab === 'All' ? true :
      activeTab === 'Approved' ? item.status === 'Approved' :
      activeTab === 'Pending' ? item.status === 'Pending Review' : true;

    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = 
      (item.query || '').toLowerCase().includes(lowerQuery) || 
      (item.response || '').toLowerCase().includes(lowerQuery) ||
      (item.topic || '').toLowerCase().includes(lowerQuery);

    return matchesTab && matchesSearch;
  });

  // --- 7. PAGINATION CALCULATION ---
  useEffect(() => {
    setCurrentPage(1); 
  }, [activeTab, searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDataset.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDataset.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Generate page numbers array
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // --- 8. HANDLERS ---
  const handleSave = async (formData) => {
    const savePromise = new Promise(async (resolve, reject) => {
      try {
        if (editingItem && editingItem._id) {
          await axios.put(`${API_URL}/${editingItem._id}`, formData);
          resolve("Knowledge updated successfully!");
        } else {
          await axios.post(API_URL, formData);
          resolve("New pair added successfully!");
          
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

  return (
    <div className="animate-in fade-in zoom-in duration-300 relative">
        <Toaster position="top-right" reverseOrder={false} />

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard 
                title="Total Queries Received" 
                value={stats.total_interactions || 0} 
                icon={MessageCircle} 
                color="bg-blue-50 text-blue-600" 
            />
            <StatCard 
                title="System Accuracy" 
                value={(stats.accuracy || 0) + "%"} 
                icon={Check} 
                color={(stats.accuracy || 0) > 80 ? "bg-teal-50 text-teal-600" : "bg-orange-50 text-orange-600"} 
            />
            <StatCard 
                title="Needs Attention" 
                value={counts.unanswered} 
                icon={Clock} 
                color={counts.unanswered > 0 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-600"} 
            />
            <StatCard 
                title="Flagged Content" 
                value={stats.flagged_count || 0} 
                icon={AlertTriangle} 
                color={(stats.flagged_count || 0) > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"} 
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

                    <div className="w-px h-6 bg-slate-200 mx-1 self-center hidden md:block"></div>

                    {/* UNANSWERED TAB */}
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
                // 1. Unanswered View (Redirect Target)
                <UnansweredTab 
                    key={lastUpdated} 
                    searchQuery={searchQuery} 
                    onConvertToQa={handlePromoteLog} 
                />
            ) : (
                // 2. Standard Table View
                <div className="flex flex-col flex-1">
                    <div className="p-6 flex-1">
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
                                        {currentItems.map((item) => (
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

                    {/* PAGINATION CONTROLS (NUMBERED) */}
                    {filteredDataset.length > 0 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl">
                            <p className="text-xs text-slate-500 font-medium">
                                Showing <span className="font-bold text-slate-700">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-700">{Math.min(indexOfLastItem, filteredDataset.length)}</span> of <span className="font-bold text-slate-700">{filteredDataset.length}</span> items
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