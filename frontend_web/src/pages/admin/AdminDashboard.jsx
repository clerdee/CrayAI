import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { ScanEye, AlertTriangle, Users, Sprout, Activity, Droplets } from 'lucide-react';

// 1. Scan Activity (AI Usage)
const scanActivityData = [
  { name: 'Mon', scans: 120, detected_disease: 5 },
  { name: 'Tue', scans: 150, detected_disease: 8 },
  { name: 'Wed', scans: 180, detected_disease: 12 }, 
  { name: 'Thu', scans: 140, detected_disease: 4 },
  { name: 'Fri', scans: 200, detected_disease: 6 },
  { name: 'Sat', scans: 250, detected_disease: 10 },
  { name: 'Sun', scans: 220, detected_disease: 9 },
];

// 2. Population Demographics (Gender/Berried Status)
const populationData = [
  { name: 'Male', value: 450, color: '#3B82F6' }, // Blue
  { name: 'Female (Non-Berried)', value: 300, color: '#EC4899' }, 
  { name: 'Berried (Pregnant)', value: 150, color: '#F59E0B' }, 
  { name: 'Juvenile/Unknown', value: 100, color: '#94A3B8' }, 
];

// 3. Water Quality Reports (Turbidity/Algae)
const waterQualityData = [
  { name: 'Pond A', turbidity: 20, algae: 15 },
  { name: 'Pond B', turbidity: 45, algae: 60 }, 
  { name: 'Pond C', turbidity: 25, algae: 20 },
  { name: 'Pond D', turbidity: 30, algae: 25 },
];

const AdminDashboard = () => {
  return (
    <AdminLayout title="System Overview">
      
      {/* 1. KEY METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total AI Scans" 
          value="1,245" 
          subtext="+12% from last week"
          icon={<ScanEye className="text-teal-600" />} 
          bg="bg-teal-50" 
        />
        <StatsCard 
          title="Disease Alerts" 
          value="32" 
          subtext="Requires Moderation"
          icon={<AlertTriangle className="text-red-600" />} 
          bg="bg-red-50" 
        />
        <StatsCard 
          title="Active Users" 
          value="150+" 
          subtext="5 Pending Approvals"
          icon={<Users className="text-blue-600" />} 
          bg="bg-blue-50" 
        />
        <StatsCard 
          title="Avg. Accuracy" 
          value="96.8%" 
          subtext="Based on user validation"
          icon={<Activity className="text-purple-600" />} 
          bg="bg-purple-50" 
        />
      </div>

      {/* 2. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main Chart: Scan Activity & Disease Detection */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">AI Scan Activity</h3>
                    <p className="text-xs text-slate-500">Total uploads vs. Potential disease vectors detected</p>
                </div>
            </div>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scanActivityData}>
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
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="scans" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" name="Total Scans" />
                        <Area type="monotone" dataKey="detected_disease" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDisease)" name="Disease Detected" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Pie Chart: Population Demographics */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Population Gender Stats</h3>
            <p className="text-xs text-slate-500 mb-6">Aggregated from valid species scans</p>
            <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={populationData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {populationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center">
                    <p className="text-2xl font-bold text-slate-800">1K+</p>
                    <p className="text-xs text-slate-400">Specimens</p>
                </div>
            </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: Water Quality & Moderation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Water Quality Bar Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-blue-500" /> Water Turbidity & Algae
                  </h3>
              </div>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waterQualityData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis />
                          <Tooltip cursor={{fill: 'transparent'}} />
                          <Legend />
                          <Bar dataKey="turbidity" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Turbidity (NTU)" />
                          <Bar dataKey="algae" fill="#10B981" radius={[4, 4, 0, 0]} name="Algae Level" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Recent AI Logs Table */}
          <RecentScansTable />
      </div>

    </AdminLayout>
  );
};

// --- HELPER COMPONENTS ---

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

const RecentScansTable = () => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Recent AI Logs</h3>
            <button className="text-xs text-teal-600 font-bold hover:underline">View All</button>
        </div>
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden">
                            <img src={`https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=100&auto=format&fit=crop`} alt="Scan" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Cherax quadricarinatus</p>
                            <p className="text-xs text-slate-500">User: Farmer_{i}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${i === 2 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {i === 2 ? 'High Turbidity' : 'Healthy'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">98% Confidence</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default AdminDashboard;