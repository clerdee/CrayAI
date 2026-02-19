import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Server, Database, BrainCircuit, Cloud, Activity, AlertCircle, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const SystemHealth = () => {
  const [isRefreshing, setIsRefreshing] = useState(true);
  
  // Real State Data
  const [healthData, setHealthData] = useState({
    services: [
      { id: 'node', ping: '--' },
      { id: 'mongo', ping: '--' },
      { id: 'python', ping: '--' },
      { id: 'cloudinary', ping: '--' }
    ],
    ai: { avgProcessingTime: '--', version: '--', uptime: '--' },
    database: { usedMB: 0, totalMB: 512, scansCount: 0, postsCount: 0 }
  });

  const fetchHealthData = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      // Calls your new real backend endpoint!
      const res = await axios.get(`${API_BASE_URL}/auth/admin/health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setHealthData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch health data:", error);
    } finally {
      // Small timeout just to make the refresh button animation feel satisfying
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchHealthData();
    // Auto-ping every 30 seconds to keep the dashboard alive
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Map icons and colors to the IDs sent by the backend
  const serviceConfig = {
    node: { name: 'Node.js Main API', icon: Server, color: 'text-teal-600', bg: 'bg-teal-50' },
    mongo: { name: 'MongoDB Cluster', icon: Database, color: 'text-teal-600', bg: 'bg-teal-50' },
    python: { name: 'Python AI Engine', icon: BrainCircuit, color: 'text-blue-600', bg: 'bg-blue-50' },
    cloudinary: { name: 'Cloudinary CDN', icon: Cloud, color: 'text-teal-600', bg: 'bg-teal-50' },
  };

  // Calculate percentage of Database used
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
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-teal-500" />
            <h3 className="font-bold text-slate-800 text-lg">MongoDB Storage</h3>
          </div>
          <div className="space-y-5">
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

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Total Scans (Vectors)</p>
                <p className="text-xl font-bold text-slate-800">{healthData.database.scansCount.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Community Posts</p>
                <p className="text-xl font-bold text-slate-800">{healthData.database.postsCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemHealth;