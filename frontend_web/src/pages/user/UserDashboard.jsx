import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Image as ImageIcon, Calendar, Droplets, Leaf, 
  Activity, TrendingUp, ScanLine, AlertCircle, ArrowRight,
  X, CheckCircle, AlertTriangle, ArrowUpRight, User, Share2, Clock, Cpu, MapPin, Ruler, Trash2
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom'; 
import client from '../../api/client'; 

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const AP_COLORS = ['#8AB4F8', '#3D5A80', '#E76F51', '#2A9D8F'];

// Animation Variants for smooth AP-style entrances
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 30 } }
};

const UserDashboard = () => {
  const navigate = useNavigate(); 
  const fileInputRef = useRef(null); 

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [recentScans, setRecentScans] = useState([]); 
  const [stats, setStats] = useState({ total: 0, warnings: 0, berried: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [marketProjections, setMarketProjections] = useState(MONTH_NAMES.map(m => ({ month: m, price: 0 })));

  // --- NEW: MODAL & NOTIFICATION STATE ---
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanToDelete, setScanToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    fetchDashboardData();
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch Real User Data
      const profileRes = await client.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (profileRes.data?.success) setCurrentUser(profileRes.data.user);

      // Fetch Real Scan Data
      const scanRes = await client.get('/scans/me', { headers: { Authorization: `Bearer ${token}` } });
      if (scanRes.data?.success) {
        const records = scanRes.data.records?.filter(r => !r.isDeleted) || [];
        setRecentScans(records);
        
        let warnings = 0;
        let berried = 0;
        records.forEach(r => {
           if(['High', 'Critical'].includes(r.environment?.algae_label) || r.environment?.turbidity_level >= 7) warnings++;
           if(r.gender === 'Berried') berried++;
        });
        setStats({ total: records.length, warnings, berried }); 
      }

      // Fetch Real Market Data
      const feedRes = await client.get('/posts/feed', { headers: { Authorization: `Bearer ${token}` } });
      if (feedRes.data?.posts) {
        const sales = feedRes.data.posts.filter(p => p.isForSale && p.price > 0);
        let baseData = MONTH_NAMES.map(m => ({ month: m, price: 0 }));
        if (sales.length > 0) {
            const monthlyTotals = {};
            const monthlyCounts = {};
            sales.forEach(sale => {
                const monthIdx = new Date(sale.createdAt).getMonth();
                monthlyTotals[monthIdx] = (monthlyTotals[monthIdx] || 0) + sale.price;
                monthlyCounts[monthIdx] = (monthlyCounts[monthIdx] || 0) + 1;
            });

            let lastKnownPrice = 0;
            for (let i = 0; i < 12; i++) {
                if (monthlyCounts[i]) {
                    lastKnownPrice = Math.round(monthlyTotals[i] / monthlyCounts[i]);
                    break;
                }
            }

            for (let i = 0; i < 12; i++) {
                if (monthlyCounts[i]) {
                    const avg = Math.round(monthlyTotals[i] / monthlyCounts[i]);
                    baseData[i].price = avg;
                    lastKnownPrice = avg;
                } else {
                    baseData[i].price = lastKnownPrice; 
                }
            }
        }
        setMarketProjections(baseData);
      }
    } catch (error) { 
      console.error("Dashboard fetch error:", error); 
    } finally {
      setIsLoading(false);
    }
  };

  // --- MODAL ACTION HANDLERS ---
  const formatScanForModal = (r) => ({
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
  });

  const promptDeleteScan = (scan) => {
    setScanToDelete(scan);
  };

  const confirmDeleteScan = async () => {
    if (!scanToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await client.delete(`/scans/${scanToDelete.dbId}/hard-delete`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setRecentScans(prev => prev.filter(r => r._id !== scanToDelete.dbId));
      
      // Store ID before clearing for the notification
      const deletedId = scanToDelete.id;
      
      setScanToDelete(null);
      setSelectedScan(null);
      
      // Trigger Notification
      setNotification({ type: 'success', message: `Scan ${deletedId} deleted permanently.` });
      setTimeout(() => setNotification(null), 4000);

      fetchDashboardData(); 
    } catch (err) {
      console.error("Delete failed:", err);
      setScanToDelete(null);
      setNotification({ type: 'error', message: "Failed to delete scan. Please try again." });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handlePostToFeed = (scan) => {
    const caption = `Shared from my history! 🕰️\n\nFound a ${scan.gender} Crayfish 🦞\nID: ${scan.id}\n📏 Size: ${scan.width_cm}cm W x ${scan.height_cm}cm H\n🎂 Age: ${scan.age}\n💧 Water Turbidity: Level ${scan.turbidity}\n🌿 Algae: ${scan.algae}`;
    navigate('/community', { 
      state: { 
        newPostImage: scan.image,
        newPostText: caption
      } 
    });
  };

  // --- NAVIGATION HANDLERS ---
  const handleNewScan = () => {
    navigate('/scan'); 
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      navigate('/scan', { state: { uploadedFile: file } });
    }
  };

  const handleViewHistory = () => {
    navigate('/history'); 
  };

  // Logic for Gender Pie Chart
  const getGenderData = () => {
    let male = 0, female = 0, berried = 0;
    recentScans.forEach(r => {
        if(r.gender === 'Male') male++;
        else if(r.gender === 'Female') female++;
        else if(r.gender === 'Berried') berried++;
    });
    
    const total = male + female + berried;
    
    return {
        total: total,
        data: [
            { name: 'Male', value: male, color: '#3D5A80' },
            { name: 'Female', value: female, color: '#E76F51' },
            { name: 'Berried', value: berried, color: '#2A9D8F' }
        ]
    };
  };
  const genderData = getGenderData();
  
  const displayPieData = genderData.total === 0 
    ? [{ name: 'No Scans Yet', value: 1, color: 'rgba(255,255,255,0.05)' }] 
    : genderData.data;

  const getSizeAgeChartData = () => {
    let counts = { crayling: 0, juvenile: 0, subAdult: 0, adult: 0 };
    recentScans.forEach(r => {
       const size = r.morphometrics?.height_cm || 0;
       
       if (size > 0 && size < 3) counts.crayling++;
       else if (size >= 3 && size < 7) counts.juvenile++;
       else if (size >= 7 && size < 11) counts.subAdult++;
       else if (size >= 11) counts.adult++;
    });
    return [
       { name: 'Crayling (< 1mo | < 3cm)', value: counts.crayling },
       { name: 'Juvenile (1-3mo | 3-6.9cm)', value: counts.juvenile },
       { name: 'Sub-Adult (3-6mo | 7-10.9cm)', value: counts.subAdult },
       { name: 'Adult/Breeder (> 6mo | 11cm+)', value: counts.adult }
    ];
  };
  const sizeAgeData = getSizeAgeChartData();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7F9]">
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-2xl font-black text-[#293241] tracking-widest uppercase"
        >
          Cray<span className="text-[#98C1D9]">AI</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] font-sans relative overflow-hidden pb-24">

      {/* --- HIDDEN FILE INPUT FOR UPLOAD --- */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      <div className="absolute top-0 left-0 w-full h-[75vh] z-0 pointer-events-none">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover opacity-80 saturate-150 contrast-125 brightness-105"
          style={{
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)'
          }}
        >
          <source src="/media/real-crayfish.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F4F7F9]/40 to-[#F4F7F9]"></div>
      </div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="relative z-10 max-w-[90rem] mx-auto px-4 md:px-8 lg:px-12 pt-12 md:pt-20 space-y-12"
      >
        
        {/* --- LUXURY HEADER --- */}
        <motion.div variants={fadeUpVariants} className="flex flex-col items-center text-center space-y-4">
          <p className="text-xs md:text-sm font-bold text-[#3D5A80] uppercase tracking-[0.3em] bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
            Researcher Portal
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-[#293241] tracking-tight drop-shadow-sm">
            Hello, <span className="italic font-light opacity-90">{currentUser?.firstName || 'User'}</span>
          </h1>
          <p className="text-sm font-bold text-slate-600 tracking-widest uppercase mt-4 bg-white/30 backdrop-blur-md px-4 py-1 rounded-full">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* --- HERO ACTION CARDS --- */}
        <motion.div variants={fadeUpVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            
            <motion.button 
                onClick={handleNewScan}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 flex flex-col justify-between text-left h-[240px] hover:bg-white/90 transition-all duration-500"
            >
                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                    <Camera className="w-64 h-64 text-[#293241]" />
                </div>
                <div className="w-16 h-16 rounded-full bg-[#293241] flex items-center justify-center text-white shadow-lg group-hover:-translate-y-2 transition-transform duration-500">
                    <ScanLine className="w-7 h-7" />
                </div>
                <div className="z-10">
                    <h3 className="text-2xl font-black text-[#293241] mb-2">New AI Scan</h3>
                    <p className="text-sm font-bold text-slate-500 tracking-wide">Real-time species & health detection</p>
                </div>
            </motion.button>
            
            <motion.button 
                onClick={handleUploadClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 flex flex-col justify-between text-left h-[240px] hover:bg-white/80 transition-all duration-500"
            >
                <div className="w-16 h-16 rounded-full bg-[#E0FBFC] flex items-center justify-center text-[#3D5A80] shadow-md group-hover:-translate-y-2 transition-transform duration-500">
                    <ImageIcon className="w-7 h-7" />
                </div>
                <div className="z-10">
                    <h3 className="text-2xl font-black text-[#293241] mb-2">Upload Image</h3>
                    <p className="text-sm font-bold text-slate-500 tracking-wide">Analyze from local gallery</p>
                </div>
            </motion.button>
        </motion.div>

        {/* --- DATA DASHBOARD GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Overview & Stats */}
            <motion.div variants={fadeUpVariants} className="lg:col-span-4 flex flex-col gap-8">
                
                <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Database Overview</p>
                    
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                            <span className="text-sm font-bold text-[#293241] flex items-center gap-2"><Activity className="w-4 h-4 text-[#3D5A80]"/> Total Scans</span>
                            <span className="text-3xl font-black text-[#293241]">{stats.total}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                            <span className="text-sm font-bold text-[#293241] flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[#E76F51]"/> Health Warnings</span>
                            <span className="text-3xl font-black text-[#E76F51]">{stats.warnings}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-[#293241] flex items-center gap-2"><Droplets className="w-4 h-4 text-[#2A9D8F]"/> Berried Females</span>
                            <span className="text-3xl font-black text-[#2A9D8F]">{stats.berried}</span>
                        </div>
                    </div>
                </div>

                {/* Elegant Gender Pie Chart Breakdown */}
                <div className="bg-[#293241] rounded-3xl p-8 shadow-xl flex flex-col text-white relative overflow-hidden min-h-[350px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#3D5A80] rounded-full filter blur-[60px] opacity-30 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-[#98C1D9] uppercase tracking-[0.2em]">Population Gender</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-2">
                        <div className="w-full h-[180px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <PieChart>
                                    <Pie
                                        data={displayPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        animationDuration={1500}
                                    >
                                        {displayPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value, name) => [genderData.total === 0 ? 0 : value, name]}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', color: '#293241', fontWeight: 'bold' }} 
                                        itemStyle={{ color: '#293241' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Custom Legend - Now includes COUNT and PERCENTAGE */}
                        <div className="flex justify-center gap-5 mt-6 w-full px-2">
                            {genderData.data.map(item => (
                                <div key={item.name} className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">{item.name}</span>
                                    </div>
                                    <span className="text-lg font-black text-white flex items-baseline gap-1">
                                        {item.value} 
                                        <span className="text-[10px] font-medium text-slate-400">
                                            ({item.value > 0 ? Math.round((item.value / genderData.total) * 100) : 0}%)
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </motion.div>

            {/* RIGHT COLUMN: Recent Scans & Economics */}
            <motion.div variants={fadeUpVariants} className="lg:col-span-8 flex flex-col gap-8">
                
                {/* Horizontal Scroll Recent Scans */}
                <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-[#293241] uppercase tracking-wider">Recent Activity</h2>
                        {recentScans.length > 0 && (
                            <button 
                                onClick={handleViewHistory} 
                                className="flex items-center gap-2 text-xs font-bold text-[#3D5A80] hover:text-[#293241] transition-colors uppercase tracking-widest group"
                            >
                                View History <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                    
                    {recentScans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-[#F4F7F9] rounded-2xl">
                            <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">No Records Found</p>
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
                        {recentScans.slice(0, 8).map((scan) => (
                            <div 
                                key={scan._id} 
                                onClick={() => setSelectedScan(formatScanForModal(scan))}
                                className="group relative min-w-[200px] w-[200px] h-[280px] rounded-2xl overflow-hidden snap-start cursor-pointer border border-slate-100 bg-black flex-shrink-0"
                            >
                                <img src={scan.image?.url} alt="Scan" className="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-[#293241] via-transparent to-transparent flex flex-col justify-end p-5">
                                    <span className="text-[9px] font-bold text-[#98C1D9] mb-2 uppercase tracking-[0.2em]">
                                        {new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <h4 className="text-lg font-black text-white leading-tight mb-1">
                                        {scan.morphometrics?.estimated_age?.split(' ')[0] || 'Unknown'} {scan.gender}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-widest">
                                            {scan.morphometrics?.height_cm}cm
                                        </span>
                                        {scan.environment?.algae_label === 'High' && (
                                            <span className="px-2 py-1 bg-[#E76F51]/80 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-widest">
                                                Alert
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>

                {/* Economics Graph - High Contrast AP Style */}
                <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-black text-[#293241] uppercase tracking-wider">Market Value Index</h2>
                            <p className="text-xs font-bold text-slate-400 mt-1 tracking-widest uppercase">Community Average Price (₱/kg)</p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#F4F7F9] px-4 py-2 rounded-full text-[#293241]">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Live Data</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <LineChart data={marketProjections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => `₱${val}`} />
                                <Tooltip 
                                    formatter={(value) => [`₱${value}`, 'Price']}
                                    contentStyle={{ backgroundColor: '#293241', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold' }} 
                                    itemStyle={{ color: '#E0FBFC' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke="#3D5A80" 
                                    strokeWidth={3} 
                                    dot={false} 
                                    activeDot={{ r: 8, fill: '#E76F51', stroke: '#FFF', strokeWidth: 3 }} 
                                    animationDuration={2000} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </motion.div>
        </div>

        {/* --- FULL WIDTH SIZE & AGE DISTRIBUTION CHART --- */}
        <motion.div variants={fadeUpVariants} className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-black text-[#293241] uppercase tracking-wider">Size & Age Distribution</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 tracking-widest uppercase">Morphometric analysis of scanned population</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#3D5A80]/10 flex items-center justify-center text-[#3D5A80]">
                    <Activity className="w-6 h-6" />
                </div>
            </div>

            <div className="w-full h-[400px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={sizeAgeData} margin={{ top: 20, right: 20, left: 0, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }} 
                            dy={10} 
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} />
                        <Tooltip 
                            cursor={{ fill: 'rgba(61, 90, 128, 0.04)' }}
                            contentStyle={{ backgroundColor: '#293241', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold' }} 
                            itemStyle={{ color: '#E0FBFC' }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={70} animationDuration={2000}>
                            {sizeAgeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={AP_COLORS[index % AP_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>

      </motion.div>

      {/* --- NOTIFICATION TOAST --- */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl bg-slate-800 text-white min-w-[300px]"
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="text-sm font-bold tracking-wide flex-1">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)} 
              className="ml-2 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DETAIL MODAL --- */}
      <AnimatePresence>
        {selectedScan && (
          <UserScanDetailModal 
            scan={selectedScan} 
            onClose={() => setSelectedScan(null)} 
            onDelete={() => promptDeleteScan(selectedScan)}
            onPost={() => handlePostToFeed(selectedScan)}
          />
        )}
      </AnimatePresence>

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {scanToDelete && (
          <DeleteConfirmModal
            scan={scanToDelete}
            onClose={() => setScanToDelete(null)}
            onConfirm={confirmDeleteScan}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

// --- SUB-COMPONENT: USER SCAN DETAIL MODAL ---
const UserScanDetailModal = ({ scan, onClose, onDelete, onPost }) => {
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

// --- SUB-COMPONENT: CUSTOM DELETE CONFIRMATION MODAL ---
const DeleteConfirmModal = ({ scan, onClose, onConfirm }) => {
  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#293241]/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trash2 className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-black text-slate-800 mb-2">Delete Scan Log?</h3>
        <p className="text-sm font-medium text-slate-500 mb-8">
          Are you sure you want to permanently delete <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded">{scan.id}</span>? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
          >
            Yes, Delete
          </button>
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

export default UserDashboard;