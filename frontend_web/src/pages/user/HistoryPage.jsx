import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, ChevronRight, 
  Trash2, FileText, FileSpreadsheet,
  Droplets, Activity, Ruler, MapPin, X, ScanEye, CheckCircle, AlertTriangle, ArrowUpRight, User, Share2, Clock, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; 
import client from '../../api/client';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

const HistoryPage = () => {
  const navigate = useNavigate(); 
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await client.get('/scans/me', { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.data && res.data.success) {
        const formatted = res.data.records.map(r => ({
          id: r.scanId || r._id,
          dbId: r._id, 
          date: new Date(r.createdAt),
          image: r.image?.url || 'https://via.placeholder.com/400x300?text=No+Image',
          species: 'Australian Red Claw',
          
          gender: r.gender || 'Unknown',
          confidence: typeof r.gender_confidence === 'number' ? r.gender_confidence : 0,
          
          age: r.morphometrics?.estimated_age || 'Unknown',
          width_cm: parseFloat(r.morphometrics?.width_cm || 0),
          height_cm: parseFloat(r.morphometrics?.height_cm || 0),
          
          algae: r.environment?.algae_label || 'Low',
          turbidity: r.environment?.turbidity_level || 1,
          
          health: (['High', 'Critical'].includes(r.environment?.algae_label) || r.environment?.turbidity_level > 6) ? 'Risk' : 'Healthy',
          
          location: r.location || 'Unknown Location',
          model: r.model_version || 'CrayAI v1.0',
          processingTime: r.processing_time || 'N/A'
        }));
        setLogs(formatted.sort((a, b) => b.date - a.date));
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION: DELETE SCAN ---
  const handleDeleteScan = async (scan) => {
    if (!window.confirm("Are you sure you want to delete this scan log?")) return;

    try {
      const token = localStorage.getItem('token');
      await client.delete(`/scans/${scan.dbId}/hard-delete`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setLogs(prev => prev.filter(l => l.id !== scan.id));
      setSelectedScan(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete scan. Please try again.");
    }
  };

  // --- ACTION: POST TO COMMUNITY ---
  const handlePostToFeed = (scan) => {
    const caption = `Shared from my history! 🕰️\n\nFound a ${scan.gender} Crayfish 🦞\nID: ${scan.id}\n📏 Size: ${scan.width_cm}cm W x ${scan.height_cm}cm H\n🎂 Age: ${scan.age}\n💧 Water Turbidity: Level ${scan.turbidity}\n🌿 Algae: ${scan.algae}`;
    
    navigate('/community', { 
      state: { 
        newPostImage: scan.image,
        newPostText: caption
      } 
    });
  };

  // --- 2. FILTERING LOGIC (Simplified to Search Only) ---
  const filteredLogs = logs.filter(log => {
    const search = searchQuery.toLowerCase();
    return log.id.toLowerCase().includes(search) || 
           log.species.toLowerCase().includes(search) ||
           log.gender.toLowerCase().includes(search);
  });

  // --- 3. EXPORT FUNCTIONS ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('My Scan Activity History', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    const tableData = filteredLogs.map(log => [
      log.date.toLocaleDateString(),
      log.id,
      log.gender,
      log.age.split(' ')[0],
      log.health,
      `${log.confidence}%`
    ]);

    autoTable(doc, {
      head: [['Date', 'Scan ID', 'Gender', 'Age', 'Status', 'Conf.']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [41, 50, 65] }
    });
    doc.save('My_CrayAI_History.pdf');
  };

  const exportToExcel = () => {
    const data = filteredLogs.map(log => ({
      Date: log.date.toLocaleDateString(),
      Time: log.date.toLocaleTimeString(),
      "Scan ID": log.id,
      Gender: log.gender,
      "Est. Age": log.age,
      "Width (cm)": log.width_cm,
      "Height (cm)": log.height_cm,
      "Health Status": log.health,
      "Confidence": `${log.confidence}%`,
      "Algae Level": log.algae,
      "Turbidity": log.turbidity,
      "Model": log.model,
      "Proc. Time": log.processingTime
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scan History");
    XLSX.writeFile(wb, "My_CrayAI_History.xlsx");
  };

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-6 lg:p-10 font-sans pb-24">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#293241] tracking-tight">Scan History</h1>
          <p className="text-slate-500 font-medium mt-1">Archive of your AI analyses</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={exportToPDF} className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm">
            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button onClick={exportToExcel} className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:border-green-200 hover:text-green-600 hover:bg-green-50 transition-all shadow-sm">
            <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* SIMPLE SEARCH BAR */}
      <div className="mb-8 relative max-w-md"> 
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#3D5A80] focus:ring-4 focus:ring-[#3D5A80]/10 transition-all font-medium text-slate-700 shadow-sm"
          />
      </div>

      {/* CONTENT GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D5A80]"></div>
            <p className="font-medium animate-pulse">Retrieving records...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white rounded-3xl border border-slate-100 border-dashed"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ScanEye className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">No activities found</h3>
          <p className="text-slate-400 font-medium">Try running a new scan.</p>
        </motion.div>
      ) : (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredLogs.map(log => {
            const confColor = log.confidence > 90 ? 'bg-teal-500' : log.confidence > 75 ? 'bg-yellow-400' : 'bg-red-500';

            return (
            <motion.div 
              key={log.id} 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="group bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => setSelectedScan(log)}
            >
                {/* Card Header Image */}
                <div className="h-48 rounded-2xl bg-slate-900 overflow-hidden relative">
                    <img src={log.image} alt="scan" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm ${
                            log.health === 'Healthy' 
                            ? 'bg-green-500/90 text-white' 
                            : 'bg-red-500/90 text-white'
                        }`}>
                            {log.health === 'Healthy' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {log.health}
                        </span>
                    </div>

                    {/* Date Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs font-bold text-white/90 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {log.date.toLocaleDateString()} <span className="opacity-50">•</span> {log.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-3 pt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded tracking-wide">
                            {log.id}
                        </span>
                    </div>

                    <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-black text-lg leading-tight ${log.gender?.includes('Female') ? 'text-pink-600' : log.gender?.includes('Male') ? 'text-[#3D5A80]' : 'text-slate-700'}`}>
                            {log.gender}
                        </h3>
                        <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-[#3D5A80] group-hover:text-white transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 font-bold mb-4">{log.species}</p>
                    
                    {/* CONFIDENCE BAR */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">AI Confidence</span>
                            </div>
                            <span className="text-xs font-black text-slate-700">{log.confidence}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${confColor}`} style={{ width: `${log.confidence}%` }}></div>
                        </div>
                    </div>
                </div>
            </motion.div>
          )})}
        </motion.div>
      )}

      {/* --- DETAIL MODAL --- */}
      <AnimatePresence>
        {selectedScan && (
          <UserScanDetailModal 
            scan={selectedScan} 
            onClose={() => setSelectedScan(null)} 
            onDelete={() => handleDeleteScan(selectedScan)}
            onPost={() => handlePostToFeed(selectedScan)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

// --- SUB-COMPONENT: USER SCAN DETAIL MODAL ---
const UserScanDetailModal = ({ scan, onClose, onDelete, onPost }) => {
    // Conversions
    const widthIn = (scan.width_cm / 2.54).toFixed(2);
    const heightIn = (scan.height_cm / 2.54).toFixed(2);
    const displaySize = `${scan.width_cm}cm x ${scan.height_cm}cm`;
    const displaySizeIn = `(${widthIn}" x ${heightIn}")`;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#293241]/60 backdrop-blur-sm"
        onClick={onClose} 
      >
        <motion.div 
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
        >
          {/* Left: Image */}
          <div className="w-full md:w-2/5 bg-black relative min-h-[300px] md:min-h-full group">
            <img src={scan.image} alt="Full Scan" className="absolute inset-0 w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
            
            <button onClick={onClose} className="absolute top-4 left-4 md:hidden bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors z-20">
              <X className="w-5 h-5" />
            </button>
    
            <div className="absolute bottom-6 left-6 right-6">
                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 backdrop-blur-md ${
                    scan.health === 'Healthy' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
                }`}>
                   {scan.health} Status
                </span>
                <h2 className="text-2xl font-black text-white leading-tight">{scan.species}</h2>
                <p className="text-white/70 text-xs font-medium mt-1 flex items-center gap-2">
                    ID: <span className="font-mono text-white tracking-wider">{scan.id}</span>
                </p>
            </div>
          </div>
    
          {/* Right: Details */}
          <div className="w-full md:w-3/5 p-8 overflow-y-auto bg-white relative flex flex-col">
            <button onClick={onClose} className="hidden md:block absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
            </button>
    
            <div className="flex-1">
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Morphometrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <DetailBox label="Gender" value={scan.gender} icon={<User className="w-5 h-5 text-blue-500" />} />
                        <DetailBox label="Est. Age" value={scan.age} icon={<Activity className="w-5 h-5 text-orange-500" />} />
                        
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                                <Ruler className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Size (WxH)</p>
                                <p className="text-sm font-black text-slate-800 truncate">{displaySize}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{displaySizeIn}</p>
                            </div>
                        </div>

                        <DetailBox label="Location" value={scan.location} icon={<MapPin className="w-5 h-5 text-red-500" />} />
                    </div>
                </div>
    
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">System Data</h3>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Cpu className="w-4 h-4"/>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">AI Model</p>
                                    <p className="font-bold text-slate-700 text-xs">{scan.model}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700">{scan.processingTime}s</span>
                                </div>
                                <p className="text-[9px] text-slate-400 uppercase font-bold">Process Time</p>
                            </div>
                        </div>

                        <div className="h-px bg-slate-200 w-full" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                                    <Droplets className="w-4 h-4"/>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Turbidity</p>
                                    <p className="font-bold text-slate-700">Lvl {scan.turbidity}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Algae</p>
                                    <p className="font-bold text-slate-700">{scan.algae}</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <Activity className="w-4 h-4"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    
            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                <button 
                    onClick={onDelete}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-100 transition-colors"
                >
                    <Trash2 className="w-4 h-4" /> Delete Log
                </button>
                <button 
                    onClick={onPost}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#3D5A80] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#293241] shadow-lg shadow-[#3D5A80]/20 transition-all"
                >
                    <Share2 className="w-4 h-4" /> Post to Community
                </button>
            </div>
    
          </div>
        </motion.div>
      </div>
    );
};

const DetailBox = ({ label, value, icon }) => (
  <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

export default HistoryPage;