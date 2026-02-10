import React, { useState } from 'react';
import { Layers, ScanEye } from 'lucide-react';
import VisionDataset from './VisionDataset';
import VisionSimulator from './VisionSimulator';

const VisionMode = () => {
  const [activeTab, setActiveTab] = useState('dataset'); // 'dataset' | 'simulator'

  return (
    <div className="space-y-6">
      
      {/* --- SUB-TABS (Dataset vs Simulator) --- */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 inline-flex gap-1 shadow-sm">
        <button 
          onClick={() => setActiveTab('dataset')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'dataset' 
              ? 'bg-slate-800 text-white shadow-md' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Dataset Gallery
        </button>

        <button 
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'simulator' 
              ? 'bg-teal-600 text-white shadow-md shadow-teal-100' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <ScanEye className="w-3.5 h-3.5" />
          Measurement Simulator
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'dataset' ? <VisionDataset /> : <VisionSimulator />}
      </div>

    </div>
  );
};

export default VisionMode;