import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Database, Upload, Tag, Check, Clock, Filter, Plus, Trash2, Search, MessageSquare, Image as ImageIcon, FileText, Edit3, Save } from 'lucide-react';

// --- MOCK DATA: VISION (Crayfish Images) ---
const VISION_DATASET = [
  { id: 101, src: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=200', label: 'Male', health: 'Healthy', status: 'Labeled' },
  { id: 102, src: 'https://images.unsplash.com/photo-1551732607-b247c7c3c437?q=80&w=200', label: 'Female (Berried)', health: 'Healthy', status: 'Labeled' },
  { id: 103, src: 'https://images.unsplash.com/photo-1571752726703-4e706067a45e?q=80&w=200', label: 'Unknown', health: 'Unknown', status: 'Unlabeled' },
];

// --- MOCK DATA: CHATBOT (Q&A Pairs) ---
const CHATBOT_DATASET = [
  { id: 201, query: "How do I treat shell disease?", response: "Isolate the crayfish and improve water quality. You may use salt baths.", topic: 'Health', status: 'Approved' },
  { id: 202, query: "What is the ideal pH for Red Claw?", response: "The ideal pH range is between 7.0 and 8.5.", topic: 'Water Quality', status: 'Approved' },
  { id: 203, query: "My crayfish is not eating.", response: "Check the water temperature. If it's too cold (< 20°C), their metabolism slows down.", topic: 'Behavior', status: 'Pending Review' },
  { id: 204, query: "Can they live with Goldfish?", response: "I am not sure.", topic: 'Compatibility', status: 'Needs Improvement' },
];

const TrainingData = () => {
  // Toggle State: 'vision' or 'chatbot'
  const [trainingMode, setTrainingMode] = useState('vision'); 
  const [activeTab, setActiveTab] = useState('All');

  return (
    <AdminLayout title="AI Training Center">
      
      {/* 1. MODE TOGGLE (The "2 Columns" Switch) */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 inline-flex">
            <button 
                onClick={() => setTrainingMode('vision')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    trainingMode === 'vision' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
                <ImageIcon className="w-4 h-4" /> Vision (Classification)
            </button>
            <button 
                onClick={() => setTrainingMode('chatbot')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    trainingMode === 'chatbot' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
                <MessageSquare className="w-4 h-4" /> Chatbot (NLP)
            </button>
        </div>
      </div>

      {/* 2. DYNAMIC STATS (Changes based on Mode) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {trainingMode === 'vision' ? (
            <>
                <StatCard title="Total Images" value="5,240" icon={Database} color="bg-blue-50 text-blue-600" />
                <StatCard title="Labeled" value="4,100" icon={Check} color="bg-teal-50 text-teal-600" />
                <StatCard title="Pending" value="1,140" icon={Clock} color="bg-orange-50 text-orange-600" />
                <StatCard title="Classes" value="8 Types" icon={Tag} color="bg-purple-50 text-purple-600" />
            </>
        ) : (
            <>
                <StatCard title="Knowledge Base" value="850 Q&A" icon={FileText} color="bg-indigo-50 text-indigo-600" />
                <StatCard title="Accuracy Rate" value="92%" icon={Check} color="bg-teal-50 text-teal-600" />
                <StatCard title="Failed Queries" value="45" icon={Clock} color="bg-red-50 text-red-600" />
                <StatCard title="Topics" value="12" icon={Tag} color="bg-purple-50 text-purple-600" />
            </>
        )}
      </div>

      {/* 3. MAIN TRAINING WORKSPACE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {['All', 'Approved', 'Pending'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab}
                    </button>
                ))}
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder={trainingMode === 'vision' ? "Search tags..." : "Search questions..."} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-slate-200">
                    <Plus className="w-4 h-4" /> {trainingMode === 'vision' ? 'Add Image' : 'Add Q&A Pair'}
                </button>
            </div>
        </div>

        {/* --- CONDITIONAL CONTENT --- */}
        
        {/* A. VISION MODE (Grid) */}
        {trainingMode === 'vision' && (
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {VISION_DATASET.map((item) => (
                    <div key={item.id} className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md transition-all">
                        <img src={item.src} alt="Dataset" className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3">
                            {item.status === 'Unlabeled' ? (
                                <span className="bg-orange-500/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold">Pending</span>
                            ) : (
                                <span className="bg-teal-500/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                            <p className="font-bold text-sm">{item.label}</p>
                            <p className="text-xs opacity-80">{item.health}</p>
                            <div className="flex gap-2 mt-3">
                                <button className="flex-1 bg-white text-slate-900 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-500 hover:text-white">Edit</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* B. CHATBOT MODE (2-Column Table) */}
        {trainingMode === 'chatbot' && (
            <div className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold">
                                <th className="p-4 w-1/3">User Query (Input)</th>
                                <th className="p-4 w-1/3">Bot Response (Output)</th>
                                <th className="p-4">Topic</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {CHATBOT_DATASET.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 align-top">
                                        <div className="flex gap-3">
                                            <div className="mt-1 min-w-[24px]"><MessageSquare className="w-5 h-5 text-slate-400" /></div>
                                            <p className="text-sm font-medium text-slate-800">{item.query}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="flex gap-3">
                                            <div className="mt-1 min-w-[24px]"><div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[10px] text-teal-700 font-bold">AI</div></div>
                                            <p className="text-sm text-slate-600">{item.response}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{item.topic}</span>
                                    </td>
                                    <td className="p-4 align-top">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            item.status === 'Approved' ? 'bg-green-50 text-green-600' : 
                                            item.status === 'Needs Improvement' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 align-top text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                            <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </div>

    </AdminLayout>
  );
};

// Helper for Stats
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-6 h-6" /></div>
        <div><p className="text-slate-500 text-xs font-bold uppercase tracking-wide">{title}</p><h4 className="text-2xl font-bold text-slate-800">{value}</h4></div>
    </div>
);

export default TrainingData;