import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Server, Database, BrainCircuit, Cloud, Activity, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL; 

const SystemHealth = () => {
  const [isRefreshing, setIsRefreshing] = useState(true);
  
  // Real State Data with new metrics
  const [healthData, setHealthData] = useState({
    services: [
      { id: 'node', ping: '--' },
      { id: 'mongo', ping: '--' },
      { id: 'python', ping: '--' },
      { id: 'cloudinary', ping: '--' }
    ],
    ai: { avgProcessingTime: '--', version: '--', uptime: '--' },
    database: { 
        usedMB: 0, 
        totalMB: 512, 
        scansCount: 0, 
        postsCount: 0,
        usersCount: 0,
        commentsCount: 0,
        notificationsCount: 0,
        chatsCount: 0 
    }
  });

  // State for Chatbot Dataset from Python API
  const [chatbotData, setChatbotData] = useState({ totalKnowledge: 0, failedLogs: 0 });

  const fetchHealthData = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      
      const [healthRes, botStatsRes, botDataRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/auth/admin/health`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${CHATBOT_API_URL}/stats`),
          axios.get(CHATBOT_API_URL)
      ]);
      
      if (healthRes.status === 'fulfilled' && healthRes.value.data.success) {
        setHealthData(healthRes.value.data);
      }

      let knowledgeCount = 0;
      let failedCount = 0;

      if (botDataRes.status === 'fulfilled' && Array.isArray(botDataRes.value.data)) {
          knowledgeCount = botDataRes.value.data.length;
      }
      if (botStatsRes.status === 'fulfilled' && botStatsRes.value.data) {
          failedCount = botStatsRes.value.data.failed_count || 0;
      }

      setChatbotData({ totalKnowledge: knowledgeCount, failedLogs: failedCount });

    } catch (error) {
      console.error("Failed to fetch health data:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const serviceConfig = {
    node: { name: 'Node.js Main API', icon: Server, color: 'text-teal-600', bg: 'bg-teal-50' },
    mongo: { name: 'MongoDB Cluster', icon: Database, color: 'text-teal-600', bg: 'bg-teal-50' },
    python: { name: 'Python AI Engine', icon: BrainCircuit, color: 'text-blue-600', bg: 'bg-blue-50' },
    cloudinary: { name: 'Cloudinary CDN', icon: Cloud, color: 'text-teal-600', bg: 'bg-teal-50' },
  };

  const storagePercentage = Math.min(((healthData.database.usedMB / healthData.database.totalMB) * 100).toFixed(2), 100);

  return (
    <AdminLayout title="System Health">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Infrastructure Status</h2>
          <p className="text-sm text-slate-500">Live monitoring of CrayAI microservices</p>
        </div>
        <button 
          onClick={fetchHealthData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
          {isRefreshing ? 'Pinging...' : 'Ping Services'}
        </button>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {healthData.services.map((svc) => {
          const config = serviceConfig[svc.id];
          if(!config) return null;
          
          return (
            <div key={svc.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg}`}>
                <config.icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{config.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${svc.status === 'Operational' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`text-sm font-medium ${svc.status === 'Operational' ? 'text-green-600' : 'text-red-600'}`}>{svc.status || 'Checking...'}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Latency: {svc.ping}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Performance Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-800 text-lg">AI Model Performance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Average Processing Time</span>
              <span className="font-bold text-slate-800">{healthData.ai.avgProcessingTime}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Model Version Active</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{healthData.ai.version}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Uptime</span>
              <span className="font-bold text-slate-800">{healthData.ai.uptime}</span>
            </div>
          </div>
        </div>

        {/* Database Storage Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-teal-500" />
            <h3 className="font-bold text-slate-800 text-lg">System Data Storage</h3>
          </div>
          
          <div className="space-y-5 flex-1 flex flex-col">
            {/* Storage Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-600">Storage Used ({healthData.database.usedMB}MB / {healthData.database.totalMB}MB)</span>
                <span className="font-bold text-slate-800">{storagePercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${storagePercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Comprehensive Data Metrics Grid (8 Items) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto pt-4 border-t border-slate-50">
              <MetricBox label="Users" value={healthData.database.usersCount} />
              <MetricBox label="AI Scans" value={healthData.database.scansCount} />
              <MetricBox label="Posts" value={healthData.database.postsCount} />
              <MetricBox label="Comments" value={healthData.database.commentsCount} />
              
              <MetricBox label="Notifications" value={healthData.database.notificationsCount} />
              <MetricBox label="Chat Msgs" value={healthData.database.chatsCount} />
              <MetricBox label="Bot Q&A" value={chatbotData.totalKnowledge} />
              <MetricBox label="Bot Logs" value={chatbotData.failedLogs} />
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Sub-component for neat metric blocks
const MetricBox = ({ label, value }) => (
  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center transition-colors hover:bg-slate-100">
    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5 text-center">{label}</p>
    <p className="text-xl font-black text-slate-700">{value.toLocaleString()}</p>
  </div>
);

export default SystemHealth;