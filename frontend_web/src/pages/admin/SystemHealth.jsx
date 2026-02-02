import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  Wifi, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  HardDrive,
  RefreshCw
} from 'lucide-react';

const SystemHealth = () => {
  // Mock State for "Last Updated" visual effect
  const [lastUpdated, setLastUpdated] = useState('Just now');

  const handleRefresh = () => {
    setLastUpdated('Refreshing...');
    setTimeout(() => setLastUpdated('Just now'), 1000);
  };

  return (
    <AdminLayout title="System Health">
      
      {/* 1. HEADER ACTIONS */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          System Operational
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-teal-600 hover:border-teal-200 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          {lastUpdated}
        </button>
      </div>

      {/* 2. CRITICAL SERVICES STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatusCard 
          title="API Server" 
          status="Online" 
          uptime="99.9%" 
          ping="24ms" 
          icon={Server} 
          color="green" 
        />
        <StatusCard 
          title="MongoDB Database" 
          status="Online" 
          uptime="99.9%" 
          ping="12ms" 
          icon={Database} 
          color="green" 
        />
        <StatusCard 
          title="AI Inference Engine" 
          status="Processing" 
          uptime="98.5%" 
          ping="450ms" 
          icon={Cpu} 
          color="blue" 
        />
        <StatusCard 
          title="Image Storage" 
          status="Healthy" 
          usage="45% Full" 
          ping="Cloudinary" 
          icon={HardDrive} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. PERFORMANCE METRICS (Left Column - 2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* A. AI Model Performance */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BrainActivityIcon /> AI Performance Metrics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <MetricBox label="Avg. Scan Time" value="1.2s" trend="-0.3s" trendUp={true} />
              <MetricBox label="Success Rate" value="98.2%" trend="+1.1%" trendUp={true} />
              <MetricBox label="Failed Scans" value="12" trend="+2" trendUp={false} isError={true} />
            </div>

            {/* Mock Chart Visualization */}
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Requests per Minute (RPM)</p>
              <div className="flex items-end gap-1 h-32 w-full">
                {[40, 65, 45, 80, 55, 70, 90, 60, 50, 75, 85, 95, 60, 40, 70, 55, 80, 65, 90, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-teal-100 hover:bg-teal-500 rounded-t-sm transition-colors relative group" style={{ height: `${h}%` }}>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1 py-0.5 rounded">
                      {h}req
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* B. Server Resources */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Activity className="w-5 h-5 text-slate-400" /> Resource Usage
             </h3>
             <div className="space-y-6">
                <ResourceBar label="CPU Usage" value={42} color="bg-blue-500" />
                <ResourceBar label="Memory (RAM)" value={68} color="bg-purple-500" />
                <ResourceBar label="Disk Space (Logs)" value={24} color="bg-orange-500" />
             </div>
          </div>

        </div>

        {/* 4. SYSTEM LOGS (Right Column - 1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl shadow-lg h-full max-h-[600px] overflow-hidden flex flex-col">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" /> System Logs
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar font-mono text-xs">
              <LogItem time="11:42:05" type="INFO" msg="Scheduled backup completed successfully." />
              <LogItem time="11:40:12" type="SUCCESS" msg="User #8821 verified via OTP." />
              <LogItem time="11:38:00" type="WARN" msg="High latency detected on /api/scan endpoint (850ms)." color="text-yellow-400" />
              <LogItem time="11:35:22" type="INFO" msg="New admin login detected from IP 192.168.1.5." />
              <LogItem time="11:30:10" type="ERROR" msg="Failed to fetch weather data: Timeout." color="text-red-400" />
              <LogItem time="11:28:45" type="INFO" msg="AI Model v2.1 loaded into memory." />
              <LogItem time="11:25:00" type="SUCCESS" msg="Database connection established." />
              <LogItem time="11:24:58" type="INFO" msg="Server started on port 5000." />
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700">
               <input 
                  type="text" 
                  placeholder="Filter logs..." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-500"
               />
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

// --- HELPER COMPONENTS ---

const StatusCard = ({ title, status, uptime, ping, icon: Icon, usage, color }) => {
  const colorMap = {
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.green}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
           <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{status}</span>
        </span>
      </div>
      <h4 className="text-slate-500 text-xs font-bold uppercase mb-1">{title}</h4>
      <div className="flex justify-between items-end">
         <span className="text-xl font-bold text-slate-800">{uptime || usage}</span>
         <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Wifi className="w-3 h-3" /> {ping}
         </span>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, trend, trendUp, isError }) => (
  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
    <p className="text-xs text-slate-500 font-bold uppercase mb-1">{label}</p>
    <div className="flex items-end gap-2">
       <span className="text-2xl font-bold text-slate-800">{value}</span>
       <span className={`text-xs font-bold mb-1 ${
          isError 
            ? 'text-red-500' 
            : trendUp ? 'text-green-600' : 'text-green-600' // Simple logic for demo
       }`}>
          {trend}
       </span>
    </div>
  </div>
);

const ResourceBar = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-sm mb-2">
       <span className="font-bold text-slate-700">{label}</span>
       <span className="font-bold text-slate-500">{value}%</span>
    </div>
    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
       <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const LogItem = ({ time, type, msg, color }) => (
  <div className="flex gap-3 items-start border-l-2 border-slate-700 pl-3 py-1">
     <span className="text-slate-500 flex-shrink-0">{time}</span>
     <span className={`font-bold w-12 flex-shrink-0 ${
        type === 'ERROR' ? 'text-red-400' : 
        type === 'WARN' ? 'text-yellow-400' : 
        type === 'SUCCESS' ? 'text-green-400' : 'text-blue-400'
     }`}>
        {type}
     </span>
     <span className={`break-words ${color || 'text-slate-300'}`}>{msg}</span>
  </div>
);

// Just a custom icon wrapper for visual variety
const BrainActivityIcon = () => (
    <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center text-teal-600">
        <Activity className="w-4 h-4" />
    </div>
);

export default SystemHealth;