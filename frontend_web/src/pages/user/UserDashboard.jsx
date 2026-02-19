import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Image as ImageIcon, Calendar, Droplets, Leaf, 
  Activity, TrendingUp, ScanLine, AlertCircle, ArrowRight
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis, Cell
} from 'recharts';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [recentScans, setRecentScans] = useState([]); 
  const [stats, setStats] = useState({ total: 0, warnings: 0, berried: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [marketProjections, setMarketProjections] = useState(MONTH_NAMES.map(m => ({ month: m, price: 0 })));

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
  
  // If empty, draw a faint placeholder circle instead of collapsing
  const displayPieData = genderData.total === 0 
    ? [{ name: 'No Scans Yet', value: 1, color: 'rgba(255,255,255,0.05)' }] 
    : genderData.data;

  // Logic for Size/Age Distribution Chart strictly matching the Python backend logic
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
      
      {/* =========================================
          AMBIENT SEAMLESS BACKGROUND VIDEO 
      ========================================= */}
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

        {/* --- HERO ACTION CARDS (GLASSMORPHISM) --- */}
        <motion.div variants={fadeUpVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.button 
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
                
                {/* Minimalist Stats Summary */}
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
                                    {/* Only show tooltip values if there's actual data */}
                                    <Tooltip 
                                        formatter={(value, name) => [genderData.total === 0 ? 0 : value, name]}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', color: '#293241', fontWeight: 'bold' }} 
                                        itemStyle={{ color: '#293241' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Custom Legend - Will always show, dynamically displaying 0% when empty */}
                        <div className="flex justify-center gap-5 mt-6 w-full px-2">
                            {genderData.data.map(item => (
                                <div key={item.name} className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-white">
                                        {item.value > 0 ? Math.round((item.value / genderData.total) * 100) : 0}%
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
                            <button className="flex items-center gap-2 text-xs font-bold text-[#3D5A80] hover:text-[#293241] transition-colors uppercase tracking-widest group">
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
                            <div key={scan._id} className="group relative min-w-[200px] w-[200px] h-[280px] rounded-2xl overflow-hidden snap-start cursor-pointer border border-slate-100 bg-black flex-shrink-0">
                                <img src={scan.image?.url} alt="Scan" className="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                                
                                {/* Gradient Overlay */}
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
    </div>
  );
};

export default UserDashboard;