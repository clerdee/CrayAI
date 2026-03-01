import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, Zap, Ruler, RefreshCw, Image as ImageIcon, Activity, Droplets, Maximize2, GitCommit } from 'lucide-react';

// --- HELPER: CONVERT CM TO INCHES ---
const cmToInches = (cm) => (cm / 2.54).toFixed(2);

// --- HELPER: ALGAE LABELS ---
const getAlgaeLabel = (level) => {
  const levels = ["Low (Clean)", "Moderate", "High", "Critical"];
  const colors = ["text-green-600 bg-green-50 border-green-200", "text-yellow-600 bg-yellow-50 border-yellow-200", "text-orange-600 bg-orange-50 border-orange-200", "text-red-600 bg-red-50 border-red-200"];
  return { label: levels[level] || "Unknown", style: colors[level] || colors[0] };
};

const VisionSimulator = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [scanData, setScanData] = useState(null); // Store full backend response
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. HANDLE IMAGE SELECTION
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImage(null); 
      setScanData(null);
      setError(null);
    }
  };

  // 2. SEND TO PYTHON AI
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('photo', selectedImage);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/measure`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

      if (response.data.success) {
        if (response.data.image) {
          setResultImage(`data:image/jpeg;base64,${response.data.image}`);
        }
        setScanData(response.data);
      } else {
        setError("Analysis finished but no crayfish were detected.");
        setScanData(response.data); 
      }
    } catch (err) {
      console.error("AI Error:", err);
      setError("Failed to connect to Vision Engine. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const algaeInfo = scanData ? getAlgaeLabel(scanData.algae_level) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] p-6 bg-slate-50/50">
      
      {/* --- LEFT: VISUALIZER --- */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        {/* Main Image Area */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden flex-1 border border-slate-800 shadow-2xl flex items-center justify-center relative min-h-[400px]">
          {resultImage ? (
            <img src={resultImage} alt="AI Result" className="max-w-full max-h-full object-contain" />
          ) : previewUrl ? (
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain opacity-50" />
          ) : (
            <div className="text-center text-slate-600 p-8">
              <Zap className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-400">Simulator Ready</p>
              <p className="text-sm opacity-60">Upload an image to start</p>
            </div>
          )}
          
          {/* Legend Overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              <span className="text-[10px] text-white font-bold tracking-wide">CRAYFISH DETECTED</span>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <label className="flex-1 cursor-pointer group">
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 group-hover:bg-slate-100 rounded-xl border border-dashed border-slate-300 transition-colors">
                    <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700">
                        {selectedImage ? selectedImage.name : "Select Image..."}
                    </span>
                </div>
            </label>

            <button 
                onClick={handleAnalyze}
                disabled={!selectedImage || loading}
                className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                !selectedImage 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                }`}
            >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Analyzing..." : "Run Analysis"}
            </button>
        </div>
        
        {error && (
            <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                ⚠️ {error}
            </div>
        )}
      </div>

      {/* --- RIGHT: RESULTS PANEL --- */}
      <div className="lg:col-span-1 flex flex-col h-full overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-indigo-600" /> 
              Live Diagnostics
            </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!scanData ? (
                <div className="text-center text-slate-400 py-10">
                    <p className="text-sm">Run a scan to view data.</p>
                </div>
            ) : (
                <>
                    {/* 1. ENVIRONMENT DATA */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Environment</h4>
                        
                        {/* Algae */}
                        <div className={`flex justify-between items-center p-4 rounded-xl border ${algaeInfo.style}`}>
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5" />
                                <div>
                                    <p className="text-xs font-bold uppercase opacity-70">Algae Level</p>
                                    <p className="font-bold">{algaeInfo.label}</p>
                                </div>
                            </div>
                        </div>

                        {/* Turbidity */}
                        <div className="flex justify-between items-center p-4 rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                            <div className="flex items-center gap-3">
                                <Droplets className="w-5 h-5" />
                                <div>
                                    <p className="text-xs font-bold uppercase opacity-70">Water Turbidity</p>
                                    <p className="font-bold">Level {scanData.turbidity_level} / 10</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-2"></div>

                    {/* 2. TARGET OBJECTS */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
                            Detected Targets 
                            <span className="bg-slate-200 text-slate-600 px-2 rounded-full">{scanData.measurements ? scanData.measurements.length : 0}</span>
                        </h4>

                        {scanData.measurements && scanData.measurements.length > 0 ? (
                            scanData.measurements.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    {/* HEADER: GENDER & CONFIDENCE */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide mb-1 w-fit ${
                                                item.gender === 'Female' || item.gender === 'Berried' 
                                                ? 'bg-pink-100 text-pink-700' 
                                                : item.gender === 'Male' 
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {item.gender === 'Female' || item.gender === 'Berried' ? '♀' : item.gender === 'Male' ? '♂' : '?'} {item.gender || "Unknown"}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium pl-1">Conf: {item.gender_confidence}%</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 block">
                                                {item.estimated_age}
                                            </span>
                                        </div>
                                    </div>

                                    {/* METRICS GRID */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                                <Maximize2 className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase">Width</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-700">{item.width_cm}<span className="text-xs font-normal text-slate-400">cm</span></p>
                                            <p className="text-[10px] font-bold text-slate-400">{cmToInches(item.width_cm)}"</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                                <GitCommit className="w-3 h-3 rotate-90" />
                                                <span className="text-[10px] font-black uppercase">Height</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-700">{item.height_cm}<span className="text-xs font-normal text-slate-400">cm</span></p>
                                            <p className="text-[10px] font-bold text-slate-400">{cmToInches(item.height_cm)}"</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 bg-slate-50 rounded-xl text-center border-2 border-dashed border-slate-200">
                                <p className="text-sm text-slate-400 font-medium">No crayfish detected</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default VisionSimulator;