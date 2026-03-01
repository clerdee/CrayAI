import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { 
  ScanEye, Users, Activity, Droplets, HelpCircle, ShieldAlert, Loader, 
  FileText, FileSpreadsheet, Download, MessageSquare 
} from 'lucide-react';

// --- IMPORTS FOR EXPORT ---
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; 
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 
const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL; 

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // KPI Cards State
  const [userCount, setUserCount] = useState(0); 
  const [chatbotStats, setChatbotStats] = useState({ failed_count: 0 }); 
  const [moderationCount, setModerationCount] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  
  // Knowledge Base Breakdown State
  const [qaCounts, setQaCounts] = useState({ approved: 0, pending: 0 });

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
            axios.get(`${API_BASE_URL}/auth/admin/analytics`, { headers: { Authorization: `Bearer ${token}` }}),
            axios.get(CHATBOT_API_URL) 
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

        if (results[4].status === 'fulfilled' && Array.isArray(results[4].value.data)) {
            const dataset = results[4].value.data;
            setQaCounts({
                approved: dataset.filter(item => item.status === 'Approved').length,
                pending: dataset.filter(item => item.status === 'Pending Review').length
            });
        }

      } catch (error) {
        console.error("Critical Dashboard Error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // --- COMPREHENSIVE EXPORT FUNCTIONS ---

  const exportToPDF = () => {
    try {
        const doc = new jsPDF();
        let yPos = 25; 

        // 1. Header
        doc.setFillColor(41, 50, 65); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Full System Audit Report', 14, 25);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);
        
        yPos = 50;

        // 2. Executive Summary (KPIs)
        doc.setTextColor(0);
        doc.setFontSize(14);
        doc.text('1. Executive Summary', 14, yPos);
        yPos += 5;

        autoTable(doc, {
            startY: yPos,
            head: [['Total Scans', 'Total Users', 'Pending Moderation', 'Knowledge Base']],
            body: [[totalScans, userCount, moderationCount, `${qaCounts.approved} Appr | ${qaCounts.pending} Pend`]],
            theme: 'grid',
            headStyles: { fillColor: [61, 90, 128], halign: 'center' },
            bodyStyles: { halign: 'center', fontSize: 11, fontStyle: 'bold' }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;

        // 3. Population Gender Stats 
        doc.text('2. Population Demographics', 14, yPos);
        yPos += 5;

        const genderBody = populationData.map(p => [p.name, p.value]);
        autoTable(doc, {
            startY: yPos,
            head: [['Gender Group', 'Count']],
            body: genderBody,
            theme: 'striped',
            headStyles: { fillColor: [41, 50, 65] },
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // 4. Scan Activity Trends 
        doc.text('3. Scan Activity Trends', 14, yPos);
        yPos += 5;

        const activityBody = scanActivityData.map(a => [a.name, a.scans, a.detected_disease]);
        autoTable(doc, {
            startY: yPos,
            head: [['Time Period', 'Total Scans', 'Disease Detected']],
            body: activityBody,
            theme: 'striped',
            headStyles: { fillColor: [13, 148, 136] }, 
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // 5. Water Quality Data
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        
        doc.text('4. Water Quality Analysis', 14, yPos);
        yPos += 5;

        const waterBody = waterQualityData.map(w => [w.name, w.turbidity, w.algae]);
        autoTable(doc, {
            startY: yPos,
            head: [['Location/User', 'Avg Turbidity (NTU)', 'Avg Algae Level']],
            body: waterBody,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }, 
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // 6. Detailed Logs Table
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.text('5. Recent Detailed Logs', 14, yPos);
        yPos += 5;

        const logsBody = recentLogs.map(log => {
            const algae = log.environment?.algae_label || log.algae || 'N/A';
            const turbidity = log.environment?.turbidity_level || log.turbidity || 'N/A';
            return [
                log.species,
                log.user,
                log.gender || 'Unknown',
                log.health,
                `${typeof log.confidence === 'number' ? log.confidence.toFixed(1) : log.confidence}%`,
                algae,
                `Lvl ${turbidity}`
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [["Species", "User", "Gender", "Health", "Conf.", "Algae", "Turbidity"]],
            body: logsBody,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 50, 65] },
        });

        doc.save(`Full_System_Report.pdf`);
    } catch (err) {
        console.error("PDF Export Failed:", err);
        alert("Failed to export PDF.");
    }
  };

  const exportToExcel = () => {
    try {
        const workbook = XLSX.utils.book_new();

        const kpiData = [
            { Metric: "Total AI Scans", Value: totalScans },
            { Metric: "Total Users", Value: userCount },
            { Metric: "Pending Moderation", Value: moderationCount },
            { Metric: "Knowledge Base", Value: `${qaCounts.approved} Approved | ${qaCounts.pending} Pending` }
        ];
        const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
        XLSX.utils.book_append_sheet(workbook, kpiSheet, "Executive Summary");

        const genderSheet = XLSX.utils.json_to_sheet(populationData);
        XLSX.utils.book_append_sheet(workbook, genderSheet, "Gender Stats");

        const activityData = scanActivityData.map(item => ({
            "Time Period": item.name,
            "Total Scans": item.scans,
            "Disease Detected": item.detected_disease
        }));
        const activitySheet = XLSX.utils.json_to_sheet(activityData);
        XLSX.utils.book_append_sheet(workbook, activitySheet, "Activity Trends");

        const waterData = waterQualityData.map(item => ({
            "Location/User": item.name,
            "Avg Turbidity": item.turbidity,
            "Avg Algae": item.algae
        }));
        const waterSheet = XLSX.utils.json_to_sheet(waterData);
        XLSX.utils.book_append_sheet(workbook, waterSheet, "Water Quality");

        const logsData = recentLogs.map(log => ({
            "Species": log.species,
            "User": log.user,
            "Email": log.email,
            "Gender": log.gender || 'Unknown',
            "Health Status": log.health,
            "Confidence": `${typeof log.confidence === 'number' ? log.confidence.toFixed(1) : log.confidence}%`,
            "Algae Level": log.environment?.algae_label || log.algae || 'N/A',
            "Turbidity": log.environment?.turbidity_level || log.turbidity || 'N/A',
            "Scan Date": new Date(log.createdAt || Date.now()).toLocaleDateString()
        }));
        const logsSheet = XLSX.utils.json_to_sheet(logsData);
        XLSX.utils.book_append_sheet(workbook, logsSheet, "Detailed Logs");

        XLSX.writeFile(workbook, "Full_System_Report.xlsx");
    } catch (err) {
        console.error("Excel Export Failed:", err);
        alert("Failed to export Excel.");
    }
  };

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
      
      {/* --- HEADER ACTION BAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-sm text-slate-500">Real-time monitoring and reporting</p>
        </div>
        
        {/* EXPORT BUTTONS */}
        <div className="flex gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
            </button>
        </div>
      </div>

      {/* 1. KEY METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total AI Scans" 
          value={totalScans.toLocaleString()} 
          subtext="Processed images"
          icon={<ScanEye className="text-teal-600" />} 
          bg="bg-teal-50" 
        />
        
        {/* NEW: Split format DualStatsCard for Knowledge Base */}
        <DualStatsCard 
          title="Knowledge Base" 
          value1={qaCounts.approved} 
          label1="Approved"
          value2={qaCounts.pending} 
          label2="Pending"
          icon={<MessageSquare className={qaCounts.pending > 0 ? "text-orange-600" : "text-purple-600"} />} 
          bg={qaCounts.pending > 0 ? "bg-orange-50" : "bg-purple-50"} 
          textColor2={qaCounts.pending > 0 ? "text-orange-500 font-bold" : "text-slate-400"}
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
                        <YAxis allowDecimals={false} domain={[0, dataMax => Math.max(dataMax, 1)]} axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="scans" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" name="Total Scans" />
                        <Area type="monotone" dataKey="detected_disease" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDisease)" name="Disease Detected" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Pie Chart */}
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[50%] text-center pointer-events-none">
                    <p className={`text-2xl font-bold ${hasPopulationData ? 'text-slate-800' : 'text-slate-300'}`}>
                        {hasPopulationData ? totalScans : '0'}
                    </p>
                    <p className="text-xs text-slate-400">Specimens</p>
                </div>
            </div>
            <div className="flex justify-center items-center gap-6 mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span><span className="text-sm font-medium text-slate-600">{populationData.find(d => d.name === 'Male')?.value || 0} Male</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#EC4899]"></span><span className="text-sm font-medium text-slate-600">{populationData.find(d => d.name === 'Female')?.value || 0} Female</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span><span className="text-sm font-medium text-slate-600">{populationData.find(d => d.name === 'Berried')?.value || 0} Berried</span></div>
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
                  <button onClick={() => navigate('/admin/scans')} className="text-xs text-teal-600 font-bold hover:underline">
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
                                  </div>
                              </div>
                              <div className="text-right shrink-0">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                      log.health === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                      {log.health}
                                  </span>
                                  {/* --- FORMATTED CONFIDENCE FETCHED FROM BACKEND --- */}
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {typeof log.confidence === 'number' ? log.confidence.toFixed(1) : log.confidence}% Confidence
                                  </p>
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

// Original Stats Card for standard single metrics
const StatsCard = ({ title, value, subtext, icon, bg }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
        <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-xl ${bg}`}>
            {icon}
        </div>
        <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-2xl truncate">{value}</h4>
            <p className="text-sm text-slate-500 font-medium truncate">{title}</p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">{subtext}</p>
        </div>
    </div>
);

// NEW: Dual Stats Card for splitting two numbers side-by-side
const DualStatsCard = ({ title, value1, label1, value2, label2, icon, bg, textColor2 }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
        <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-xl ${bg}`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500 font-medium truncate pb-1">{title}</p>
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-slate-900 leading-none">{value1}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1">{label1}</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-slate-900 leading-none">{value2}</span>
                    <span className={`text-[10px] font-medium mt-1 ${textColor2}`}>{label2}</span>
                </div>
            </div>
        </div>
    </div>
);

export default AdminDashboard;