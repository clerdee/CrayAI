import React, { useState, useEffect } from 'react';
import { 
  Camera, Image as ImageIcon, Calendar, Droplets, Leaf, 
  Activity, ChevronLeft, ChevronRight, TrendingUp,
  ScanLine, HelpCircle, AlertCircle, CheckCircle, MapPin, Plus, ArrowRight
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis
} from 'recharts';
import client from '../../api/client'; 

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const UserDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('Age'); 
  const [recentScans, setRecentScans] = useState([]); 
  const [stats, setStats] = useState({ total: 0, warnings: 0, berried: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [marketProjections, setMarketProjections] = useState(MONTH_NAMES.map(m => ({ month: m, price: 0 })));
  const [marketMonthIndex, setMarketMonthIndex] = useState(new Date().getMonth());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    fetchDashboardData();
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const profileRes = await client.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (profileRes.data?.success) {
        setCurrentUser(profileRes.data.user);
      }

      const scanRes = await client.get('/scans/me', { headers: { Authorization: `Bearer ${token}` } });
      if (scanRes.data?.success) {
        const records = scanRes.data.records || [];
        const activeRecords = records.filter(r => !r.isDeleted);
        setRecentScans(activeRecords);
        
        const total = activeRecords.length;
        let warnings = 0;
        let berried = 0;
        activeRecords.forEach(r => {
           if(r.environment?.algae_label === 'High' || r.environment?.algae_label === 'Critical') warnings++;
           if(r.environment?.turbidity_level >= 7) warnings++;
           if(r.gender === 'Berried') berried++;
        });
        setStats({ total, warnings, berried }); 
      }

      const feedRes = await client.get('/posts/feed', { headers: { Authorization: `Bearer ${token}` } });
      if (feedRes.data?.posts) {
        const sales = feedRes.data.posts.filter(p => p.isForSale && p.price > 0);
        let baseData = MONTH_NAMES.map(m => ({ month: m, price: 0 }));
        
        if (sales.length > 0) {
            const monthlyTotals = {};
            const monthlyCounts = {};

            sales.forEach(sale => {
                const monthIdx = new Date(sale.createdAt).getMonth();
                if (!monthlyTotals[monthIdx]) {
                    monthlyTotals[monthIdx] = 0;
                    monthlyCounts[monthIdx] = 0;
                }
                monthlyTotals[monthIdx] += sale.price;
                monthlyCounts[monthIdx] += 1;
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
      console.error("Failed to fetch dashboard data:", error); 
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['Gender', 'Size', 'Age'];
  const getAnalyticsData = () => {
    if (recentScans.length === 0) return { total: 0, items: [ { label: 'No Data', value: 0, pct: '0%', color: '#BDC3C7', icon: AlertCircle } ] };
    const total = recentScans.length;
    let items = [];

    if (activeTab === 'Age') {
        let crayling = 0, juv = 0, sub = 0, adult = 0;
        recentScans.forEach(r => {
           const age = r.morphometrics?.estimated_age || '';
           if(age.includes('Crayling')) crayling++;
           else if(age.includes('Juvenile')) juv++;
           else if(age.includes('Sub-Adult')) sub++;
           else if(age.includes('Adult')) adult++;
        });
        items = [
           { label: 'Crayling (< 1m)', value: crayling, pct: `${Math.round((crayling/total)*100)}%`, color: '#8AB4F8', icon: Activity },
           { label: 'Juvenile (1-3m)', value: juv, pct: `${Math.round((juv/total)*100)}%`, color: '#3D5A80', icon: Activity },
           { label: 'Sub-Adult (3-6m)', value: sub, pct: `${Math.round((sub/total)*100)}%`, color: '#E76F51', icon: Activity },
           { label: 'Adult (> 6m)', value: adult, pct: `${Math.round((adult/total)*100)}%`, color: '#2A9D8F', icon: Activity }
        ];
    } else if (activeTab === 'Size') {
        let size1 = 0, size2 = 0, size3 = 0, size4 = 0;
        recentScans.forEach(r => {
           const h = r.morphometrics?.height_cm || 0;
           if(h > 0 && h < 3) size1++;
           else if(h >= 3 && h < 7) size2++;
           else if(h >= 7 && h < 11) size3++;
           else if(h >= 11) size4++;
        });
        items = [
           { label: '< 3 cm', value: size1, pct: `${Math.round((size1/total)*100)}%`, color: '#8AB4F8', icon: ScanLine },
           { label: '3 - 6.9 cm', value: size2, pct: `${Math.round((size2/total)*100)}%`, color: '#3D5A80', icon: ScanLine },
           { label: '7 - 10.9 cm', value: size3, pct: `${Math.round((size3/total)*100)}%`, color: '#E76F51', icon: ScanLine },
           { label: '> 11 cm', value: size4, pct: `${Math.round((size4/total)*100)}%`, color: '#2A9D8F', icon: ScanLine }
        ];
    } else {
        let male = 0, female = 0, berried = 0;
        recentScans.forEach(r => {
            if(r.gender === 'Male') male++;
            else if(r.gender === 'Female') female++;
            else if(r.gender === 'Berried') berried++;
        });
        items = [
           { label: 'Male', value: male, pct: `${Math.round((male/total)*100)}%`, color: '#8AB4F8', icon: Activity },
           { label: 'Female', value: female, pct: `${Math.round((female/total)*100)}%`, color: '#E76F51', icon: Activity },
           { label: 'Berried', value: berried, pct: `${Math.round((berried/total)*100)}%`, color: '#2A9D8F', icon: Activity }
        ];
    }
    return { total, items };
  };
  const analyticsData = getAnalyticsData();

  const getTurbidityTrendData = () => {
    if (recentScans.length === 0) return [{ date: "No Data", value: 0 }];
    const last10 = [...recentScans].slice(0, 10).reverse();
    return last10.map(r => ({
      date: `${new Date(r.createdAt).getMonth()+1}/${new Date(r.createdAt).getDate()}`,
      value: r.environment?.turbidity_level || 1
    }));
  };
  const turbidityTrend = getTurbidityTrendData();

  const getAlgaeBarData = () => {
    if (recentScans.length === 0) return [{name: "Low", value: 0}, {name: "Mod", value: 0}, {name: "High", value: 0}, {name: "Crit", value: 0}];
    let low = 0, mod = 0, high = 0, crit = 0;
    recentScans.forEach(r => {
        const a = r.environment?.algae_label || 'Low';
        if(a.includes('Low')) low++;
        else if(a.includes('Moderate')) mod++;
        else if(a.includes('High')) high++;
        else crit++;
    });
    return [{name: "Low", value: low}, {name: "Mod", value: mod}, {name: "High", value: high}, {name: "Crit", value: crit}];
  };
  const algaeBarData = getAlgaeBarData();

  const hasMarketData = marketProjections.some(m => m.price > 0);
  const handleNextMonth = () => setMarketMonthIndex((prev) => (prev + 1) % 12);
  const handlePrevMonth = () => setMarketMonthIndex((prev) => (prev - 1 + 12) % 12);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7F9]">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5A80]"></div>
            <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-4 md:p-8 lg:px-12 pb-24 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-bold text-[#3D5A80] uppercase tracking-wider bg-[#3D5A80]/10 px-2.5 py-1 rounded-md">Researcher Portal</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#293241] tracking-tight">
              Welcome back, {currentUser?.firstName || 'User'}
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-[#E0FBFC] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#3D5A80]" />
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Today's Date</p>
                <p className="text-sm font-bold text-[#293241]">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>
          </div>
        </div>

        {/* --- STATS & ACTIONS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* STATS (Spans 7 cols on Desktop) */}
            <div className="md:col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#3D5A80]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ScanLine className="w-6 h-6 text-[#3D5A80]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-[#293241]">{stats.total}</h3>
                        <p className="text-sm font-semibold text-slate-500 mt-1">Total AI Scans</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#E76F51]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertCircle className="w-6 h-6 text-[#E76F51]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-[#293241]">{stats.warnings}</h3>
                        <p className="text-sm font-semibold text-slate-500 mt-1">Health Warnings</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#2A9D8F]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Droplets className="w-6 h-6 text-[#2A9D8F]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-[#293241]">{stats.berried}</h3>
                        <p className="text-sm font-semibold text-slate-500 mt-1">Berried Females</p>
                    </div>
                </div>
            </div>

            {/* ACTIONS (Spans 5 cols on Desktop) */}
            <div className="md:col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
                <button className="group relative overflow-hidden rounded-[2rem] p-6 bg-gradient-to-br from-[#3D5A80] to-[#293241] shadow-[0_8px_30px_rgba(61,90,128,0.25)] hover:shadow-[0_12px_40px_rgba(61,90,128,0.4)] transition-all duration-300 flex flex-col justify-between text-left h-full min-h-[160px]">
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500">
                        <Camera className="w-24 h-24 text-white" />
                    </div>
                    <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-2xl flex items-center justify-center z-10">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="z-10 mt-6">
                        <h3 className="text-xl font-extrabold text-white mb-1">New Scan</h3>
                        <p className="text-xs font-medium text-[#E0FBFC]">Real-time AI Analysis</p>
                    </div>
                </button>
                
                <button className="group rounded-[2rem] p-6 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-[#98C1D9] hover:bg-[#F4F7F9] transition-all duration-300 flex flex-col justify-between text-left h-full min-h-[160px]">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4F7F9] group-hover:bg-white flex items-center justify-center transition-colors">
                        <ImageIcon className="w-6 h-6 text-[#3D5A80]" />
                    </div>
                    <div className="mt-6">
                        <h3 className="text-xl font-extrabold text-[#293241] mb-1">Upload</h3>
                        <p className="text-xs font-medium text-slate-500">From Local Storage</p>
                    </div>
                </button>
            </div>
        </div>

        {/* --- RECENT SCANS SECTION --- */}
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3D5A80]/10 flex items-center justify-center">
                    <ScanLine className="w-5 h-5 text-[#3D5A80]" />
                </div>
                <h2 className="text-xl font-extrabold text-[#293241]">Recent Scans</h2>
            </div>
            {recentScans.length > 0 && (
                <button className="flex items-center gap-1 text-sm font-bold text-[#3D5A80] hover:text-[#293241] transition-colors group">
                    View History <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            )}
          </div>

          {recentScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[#F4F7F9] rounded-3xl border border-dashed border-slate-300">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                <ImageIcon className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-lg font-bold text-[#2C3E50]">No recent scans found</p>
              <p className="text-sm text-slate-500 text-center mt-1 max-w-sm">Your AI classification history will appear here once you start scanning crayfish.</p>
            </div>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x custom-scrollbar">
              {recentScans.slice(0, 8).map((scan) => (
                <div key={scan._id} className="group relative min-w-[160px] w-[160px] md:min-w-[180px] md:w-[180px] h-[220px] rounded-3xl overflow-hidden snap-start shadow-sm cursor-pointer border border-slate-100 bg-black flex-shrink-0">
                  <img src={scan.image?.url} alt="Scan" className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500" />
                  
                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                     {(scan.environment?.algae_label === 'High' || scan.environment?.algae_label === 'Critical') && (
                         <span className="bg-[#E76F51] text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider shadow-md">Alert</span>
                     )}
                  </div>

                  {/* Gradient Overlay & Text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <span className="text-[10px] font-bold text-[#98C1D9] mb-1 uppercase tracking-widest">
                      {new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <h4 className="text-sm font-black text-white leading-tight mb-1 truncate">
                      {scan.morphometrics?.estimated_age?.split(' ')[0] || 'Unknown'} {scan.gender}
                    </h4>
                    <p className="text-xs font-medium text-slate-300">
                      {scan.morphometrics?.height_cm}cm • Alg: {scan.environment?.algae_label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- GRID FOR CHARTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* DEMOGRAPHICS (1 Column span on LG) */}
          <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sample</p>
                <p className="text-4xl font-black text-[#293241]">{analyticsData.total}</p>
              </div>
              <div className="flex flex-col gap-1 bg-[#F4F7F9] p-1.5 rounded-2xl">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === cat ? 'bg-white text-[#3D5A80] shadow-sm scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-5 flex-1 justify-center flex flex-col">
              {analyticsData.items.map((item, idx) => (
                <div key={idx} className="group flex items-center justify-between">
                  <div className="flex items-center gap-4 w-5/12">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: `${item.color}15` }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 truncate">{item.label}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-4 pl-4">
                    <div className="flex-1 h-2.5 bg-[#F4F7F9] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: item.pct, backgroundColor: item.color }} />
                    </div>
                    <span className="text-sm font-black text-[#293241] w-8 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ALGAE BAR CHART (2 Columns span on LG) */}
          <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 lg:col-span-2">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#293241]">Algae Frequency</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Detection counts by severity level</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#2A9D8F]/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-[#2A9D8F]" />
              </div>
            </div>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={algaeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip 
                     cursor={{ fill: '#F1F5F9' }} 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold', color: '#1E293B' }} 
                  />
                  <Bar dataKey="value" fill="#2A9D8F" radius={[8, 8, 0, 0]} barSize={50} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* --- BOTTOM CHARTS GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* TURBIDITY (Dark Mode Card) */}
            <div className="bg-gradient-to-br from-[#293241] to-[#1E2532] rounded-[2rem] p-6 lg:p-8 shadow-xl border border-slate-700/50">
                <div className="flex justify-between items-start mb-6">
                    <div>
                    <h2 className="text-xl font-extrabold text-white">Turbidity Trend</h2>
                    <p className="text-sm font-medium text-[#98C1D9] mt-1">Historical water clarity (1-10)</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#3D5A80]/50 flex items-center justify-center border border-[#3D5A80]">
                        <Droplets className="w-6 h-6 text-[#E0FBFC]" />
                    </div>
                </div>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={turbidityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3D5A80" opacity={0.3} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#98C1D9', fontSize: 12, fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#98C1D9', fontSize: 12 }} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(41, 50, 65, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #3D5A80', color: '#FFF' }}
                            itemStyle={{ color: '#E0FBFC', fontWeight: '900' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#8AB4F8" strokeWidth={4} dot={{ r: 6, strokeWidth: 3, fill: '#293241', stroke: '#8AB4F8' }} activeDot={{ r: 8, fill: '#E0FBFC', stroke: '#8AB4F8' }} animationDuration={1500} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ECONOMICS CARD */}
            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-extrabold text-[#293241]">Market Value Trend</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Real-time community average</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#0FA958]/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-[#0FA958]" />
                    </div>
                </div>

                {hasMarketData ? (
                <div className="flex-1 flex flex-col justify-between">
                    <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={marketProjections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(val) => `₱${val}`} />
                                <Tooltip 
                                    formatter={(value) => [`₱${value}`, 'Price']}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                                />
                                <Line type="monotone" dataKey="price" stroke="#3D5A80" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: '#3D5A80', stroke: '#FFF', strokeWidth: 3 }} animationDuration={1500} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 bg-[#F4F7F9] rounded-2xl p-4">
                        <button onClick={handlePrevMonth} className="p-3 bg-white rounded-xl shadow-sm hover:scale-105 transition-transform">
                            <ChevronLeft className="w-5 h-5 text-[#3D5A80]" />
                        </button>
                        <div className="text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">{marketProjections[marketMonthIndex].month} Average</p>
                            <p className="text-3xl font-black text-[#293241]">₱{marketProjections[marketMonthIndex].price}</p>
                        </div>
                        <button onClick={handleNextMonth} className="p-3 bg-white rounded-xl shadow-sm hover:scale-105 transition-transform">
                            <ChevronRight className="w-5 h-5 text-[#3D5A80]" />
                        </button>
                    </div>
                </div>
                ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F4F7F9] rounded-3xl border border-dashed border-slate-300 mt-4">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                        <TrendingUp className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-bold text-[#2C3E50]">No Market Data</p>
                    <p className="text-sm text-slate-500 text-center mt-2 max-w-[200px]">When users post items for sale, the average prices will map here.</p>
                </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default UserDashboard;