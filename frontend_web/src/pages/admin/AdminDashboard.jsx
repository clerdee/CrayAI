import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { ScanEye, Users, Activity, Droplets, HelpCircle, ShieldAlert, Loader } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'; 
const CHATBOT_API_URL = 'http://localhost:5001/api/training/chatbot'; 

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // KPI Cards State
  const [userCount, setUserCount] = useState(0); 
  const [chatbotStats, setChatbotStats] = useState({ failed_count: 0 }); 
  const [moderationCount, setModerationCount] = useState(0);
  const [totalScans, setTotalScans] = useState(0);

  // Charts State
  const [scanActivityData, setScanActivityData] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [waterQualityData, setWaterQualityData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token'); 

        const results = await Promise.allSettled([
            axios.get(`${API_BASE_URL}/auth/user-count`),
            axios.get(`${CHATBOT_API_URL}/stats`),
            axios.get(`${API_BASE_URL}/auth/admin/moderation`, { headers: { Authorization: `Bearer ${token}` }}),
            axios.get(`${API_BASE_URL}/auth/admin/analytics`, { headers: { Authorization: `Bearer ${token}` }})
        ]);

        if (results[0].status === 'fulfilled' && results[0].value.data.success) {
            setUserCount(results[0].value.data.count);
        }

        if (results[1].status === 'fulfilled' && results[1].value.data) {
            setChatbotStats(results[1].value.data);
        }

        if (results[2].status === 'fulfilled' && results[2].value.data.success) {
            const pendingItems = results[2].value.data.items.filter(item => item.status !== 'Resolved').length;
            setModerationCount(pendingItems);
        }

        if (results[3].status === 'fulfilled' && results[3].value.data.success) {
            const { scans, activity, population, water, logs } = results[3].value.data.data;
            setTotalScans(scans || 0);
            setScanActivityData(activity || []);
            setPopulationData(population || []);
            setWaterQualityData(water || []);
            setRecentLogs(logs || []);
        }

      } catch (error) {
        console.error("Critical Dashboard Error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const hasPopulationData = populationData.length > 0 && populationData.some(item => item.value > 0);
  const finalPopulationData = hasPopulationData 
    ? populationData 
    : [{ name: 'No Data Yet', value: 100, color: '#f1f5f9' }]; 

  if (loading) {
    return (
        <AdminLayout title="System Overview">
            <div className="h-[80vh] flex items-center justify-center text-slate-400">
                <Loader className="animate-spin w-8 h-8 mr-2" /> Loading Dashboard...
            </div>
        </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Overview">
      
      {/* 1. KEY METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total AI Scans" 
          value={totalScans.toLocaleString()} 
          subtext="Processed images"
          icon={<ScanEye className="text-teal-600" />} 
          bg="bg-teal-50" 
        />
        
        <StatsCard 
          title="Unanswered Queries" 
          value={chatbotStats.failed_count || 0} 
          subtext="Needs Admin Review"
          icon={<HelpCircle className={(chatbotStats.failed_count || 0) > 0 ? "text-orange-600" : "text-green-600"} />} 
          bg={(chatbotStats.failed_count || 0) > 0 ? "bg-orange-50" : "bg-green-50"} 
        />
        
        <StatsCard 
          title="Total Users" 
          value={userCount} 
          subtext="Registered Accounts"
          icon={<Users className="text-blue-600" />} 
          bg="bg-blue-50" 
        />
        
        <StatsCard 
          title="Pending Moderation" 
          value={moderationCount} 
          subtext="Flagged Posts & Comments"
          icon={<ShieldAlert className={moderationCount > 0 ? "text-red-600" : "text-slate-400"} />} 
          bg={moderationCount > 0 ? "bg-red-50" : "bg-slate-50"} 
        />
      </div>

      {/* 2. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main Chart: Scan Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">AI Scan Activity</h3>
                    <p className="text-xs text-slate-500">Total uploads vs. Potential disease vectors detected</p>
                </div>
            </div>
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={scanActivityData.length > 0 ? scanActivityData : [{name:'No Data', scans:0, detected_disease:0}]}>
                        <defs>
                            <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorDisease" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} dy={10} />
                        
                        <YAxis 
                            allowDecimals={false} 
                            domain={[0, dataMax => Math.max(dataMax, 1)]} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94A3B8', fontSize: 12}} 
                        />
                        
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="scans" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" name="Total Scans" />
                        <Area type="monotone" dataKey="detected_disease" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDisease)" name="Disease Detected" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Pie Chart: Population Gender Stats */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[350px]">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Population Gender Stats</h3>
            <p className="text-xs text-slate-500 mb-6">Aggregated from valid species scans</p>
            
            <div className="w-full relative flex-1 min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={finalPopulationData} 
                            innerRadius={60} 
                            outerRadius={80} 
                            paddingAngle={hasPopulationData ? 5 : 0} 
                            dataKey="value"
                            stroke="none"
                        >
                            {finalPopulationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        {hasPopulationData && <Tooltip />}
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[50%] text-center pointer-events-none">
                    <p className={`text-2xl font-bold ${hasPopulationData ? 'text-slate-800' : 'text-slate-300'}`}>
                        {hasPopulationData ? totalScans : '0'}
                    </p>
                    <p className="text-xs text-slate-400">Specimens</p>
                </div>
            </div>

            {/* --- CUSTOM ALWAYS-VISIBLE LEGEND --- */}
            <div className="flex justify-center items-center gap-6 mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span>
                    <span className="text-sm font-medium text-slate-600">
                        {populationData.find(d => d.name === 'Male')?.value || 0} Male
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#EC4899]"></span>
                    <span className="text-sm font-medium text-slate-600">
                        {populationData.find(d => d.name === 'Female')?.value || 0} Female
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                    <span className="text-sm font-medium text-slate-600">
                        {populationData.find(d => d.name === 'Berried')?.value || 0} Berried
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: Water Quality & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Water Quality Bar Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[350px]">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <Droplets className="w-5 h-5 text-blue-500" /> Water Turbidity & Algae
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Showing top 6 most active users & locations</p>
                  </div>
              </div>
              <div className="w-full flex-1 min-h-[250px]">
                  {waterQualityData.length > 0 && waterQualityData.some(d => d.turbidity > 0 || d.algae > 0) ? (
                      <ResponsiveContainer width="99%" height="100%">
                          <BarChart data={waterQualityData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                              <YAxis allowDecimals={false} tick={{fill: '#94A3B8', fontSize: 11}} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{fill: 'transparent'}} />
                              <Legend />
                              <Bar dataKey="turbidity" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Avg Turbidity (NTU)" />
                              <Bar dataKey="algae" fill="#10B981" radius={[4, 4, 0, 0]} name="Avg Algae Level" />
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300">
                          <Droplets className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">No water quality data recorded.</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Recent AI Logs Table */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 text-lg">Recent AI Logs</h3>
                  <button onClick={() => navigate('/admin/logs')} className="text-xs text-teal-600 font-bold hover:underline">
                      View All
                  </button>
              </div>
              <div className="space-y-4">
                  {recentLogs.length > 0 ? (
                      recentLogs.map((log, i) => (
                          <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-50">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                                      {log.image ? (
                                          <img src={log.image} alt="Scan" className="w-full h-full object-cover" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                              <ScanEye className="w-5 h-5" />
                                          </div>
                                      )}
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-slate-900">{log.species}</p>
                                      <p className="text-xs text-slate-500 truncate max-w-[150px]">{log.user}</p>
                                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{log.email}</p>
                                  </div>
                              </div>
                              <div className="text-right shrink-0">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                      log.health === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                      {log.health}
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-1">{log.confidence}% Confidence</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-8 text-slate-400">
                          <p className="text-sm">No recent scans found.</p>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </AdminLayout>
  );
};

// --- HELPER COMPONENT ---
const StatsCard = ({ title, value, subtext, icon, bg }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${bg}`}>
            {icon}
        </div>
        <div>
            <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>
        </div>
    </div>
);

export default AdminDashboard;