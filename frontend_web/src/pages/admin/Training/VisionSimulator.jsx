import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, Zap, Ruler, RefreshCw, Image as ImageIcon, Activity, Droplets, Maximize2, GitCommit } from 'lucide-react';

// Helper function to convert CM to Inches
const cmToInches = (cm) => (cm / 2.54).toFixed(2);

const getAlgaeLabel = (level) => {
  const levels = ["Low (Clean)", "Moderate", "High", "Critical"];
  const colors = ["text-green-600 bg-green-50 border-green-200", "text-yellow-600 bg-yellow-50 border-yellow-200", "text-orange-600 bg-orange-50 border-orange-200", "text-red-600 bg-red-50 border-red-200"];
  return { label: levels[level] || "Unknown", style: colors[level] || colors[0] };
};

const VisionSimulator = () => {
  // --- STATES ---
  const [activeTab, setActiveTab] = useState('overall'); // 'overall' or 'environment'
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [scanData, setScanData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- TAB SWITCHER (Resets the "Tool") ---
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    // Clearing these makes it feel like a completely separate tool!
    setSelectedImage(null);
    setPreviewUrl(null);
    setResultImage(null);
    setScanData(null);
    setError(null);
  };

  // --- HANDLE IMAGE SELECTION ---
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

  // --- SEND TO PYTHON AI ---
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

      if (response.data.success || response.data.ai_environment_status) {
        if (response.data.image) {
          setResultImage(`data:image/jpeg;base64,${response.data.image}`);
        }
        setScanData(response.data);
      } else {
        setError("Analysis finished but no data was detected.");
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
    <div className="flex flex-col gap-6 min-h-[600px] p-6 bg-slate-50/50 border border-slate-200 rounded-3xl shadow-sm">
      
      {/* ========================================== */}
      {/* 1. MASTER TAB NAVIGATION (TOP)               */}
      {/* ========================================== */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
          <button 
              onClick={() => handleTabSwitch('overall')}
              className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'overall' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 border-b-0 translate-y-2'
              }`}
          >
              <Zap className="w-4 h-4" /> Overall System Scan
          </button>
          <button 
              onClick={() => handleTabSwitch('environment')}
              className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'environment' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 border-b-0 translate-y-2'
              }`}
          >
              <Droplets className="w-4 h-4" /> Water Quality Analysis
          </button>
      </div>

      {/* ========================================== */}
      {/* 2. DYNAMIC INPUT CONTAINER                   */}
      {/* ========================================== */}
      <div className={`bg-white rounded-3xl p-6 shadow-sm border ${activeTab === 'overall' ? 'border-indigo-100' : 'border-blue-100'} flex flex-col md:flex-row gap-6 items-center`}>
        {/* Raw Image Preview */}
        <div className="w-full md:w-1/3 h-48 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner relative">
            {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain opacity-80" />
            ) : (
                <div className="text-center text-slate-600">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium text-slate-400">No Image Selected</p>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
            <div>
                <h2 className={`text-xl font-bold ${activeTab === 'overall' ? 'text-indigo-900' : 'text-blue-900'}`}>
                    {activeTab === 'overall' ? 'Tri-Core AI Simulator' : 'Environmental Simulator'}
                </h2>
                <p className="text-sm text-slate-500">
                    {activeTab === 'overall' 
                        ? 'Upload a photo to scan crayfish targets and test the water environment.' 
                        : 'Upload a pond or tank photo to run a specialized water quality check.'}
                </p>
            </div>

            <div className="flex items-center gap-4 w-full">
                <label className="flex-1 cursor-pointer group">
                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 group-hover:bg-slate-100 rounded-xl border border-dashed border-slate-300 transition-colors">
                        <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                        <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 truncate">
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
                        : activeTab === 'overall' 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                    }`}
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {loading ? "Analyzing..." : "Run Scan"}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium shadow-sm">
                    ⚠️ {error}
                </div>
            )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. DYNAMIC RESULTS AREA                      */}
      {/* ========================================== */}
      {scanData && (
        <div className={`grid grid-cols-1 ${activeTab === 'overall' ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto w-full'} gap-6`}>
            
            {/* --- CRAYFISH SCAN (ONLY VISIBLE IN 'OVERALL' TAB) --- */}
            {activeTab === 'overall' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Ruler className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-800">Biological Scan</h3>
                    </div>
                    
                    {/* Result Image */}
                    <div className="h-64 bg-slate-900 w-full flex items-center justify-center p-2 relative">
                        {resultImage && <img src={resultImage} alt="AI Result" className="max-w-full max-h-full object-contain" />}
                        <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            <span className="text-[10px] text-white font-bold tracking-wide">TARGETS</span>
                        </div>
                    </div>

                    {/* Crayfish Data */}
                    <div className="p-6 overflow-y-auto max-h-[300px]">
                        {scanData.measurements && scanData.measurements.length > 0 ? (
                            scanData.measurements.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-4 last:mb-0">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide mb-1 w-fit ${
                                                item.gender === 'Female' || item.gender === 'Berried' 
                                                ? 'bg-pink-100 text-pink-700' 
                                                : item.gender === 'Male' 
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-slate-200 text-slate-600'
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                                <Maximize2 className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase">Width</span>
                                            </div>
                                            <div className="flex items-baseline gap-1.5">
                                                <p className="text-lg font-black text-slate-700">{item.width_cm}<span className="text-xs font-normal text-slate-400 ml-0.5">cm</span></p>
                                                <p className="text-xs font-bold text-slate-400">({cmToInches(item.width_cm)}")</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                                <GitCommit className="w-3 h-3 rotate-90" />
                                                <span className="text-[10px] font-black uppercase">Height</span>
                                            </div>
                                            <div className="flex items-baseline gap-1.5">
                                                <p className="text-lg font-black text-slate-700">{item.height_cm}<span className="text-xs font-normal text-slate-400 ml-0.5">cm</span></p>
                                                <p className="text-xs font-bold text-slate-400">({cmToInches(item.height_cm)}")</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-400 py-6">
                                <p className="text-sm font-medium">No crayfish detected</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- ENVIRONMENT SCAN (VISIBLE IN BOTH TABS) --- */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${activeTab === 'overall' ? 'text-indigo-600' : 'text-blue-600'}`} />
                    <h3 className="font-bold text-slate-800">Environmental Scan</h3>
                </div>

                {/* Result Image */}
                <div className="h-64 bg-slate-900 w-full flex items-center justify-center p-2 relative">
                    {resultImage && <img src={resultImage} alt="AI Result" className="max-w-full max-h-full object-contain" />}
                    <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></span>
                        <span className="text-[10px] text-white font-bold tracking-wide">WATER DATA</span>
                    </div>
                </div>

                {/* Environment Data */}
                <div className="p-6 overflow-y-auto max-h-[300px] space-y-4">
                    {/* AI Water Analysis */}
                    <div className="flex justify-between items-center p-4 rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70">AI Water Analysis</p>
                                <p className="font-bold">{scanData.ai_environment_status || "Unknown"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Algae (Fallback) */}
                    <div className={`flex justify-between items-center p-4 rounded-xl border ${algaeInfo.style}`}>
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70">Algae Level</p>
                                <p className="font-bold">{algaeInfo.label}</p>
                            </div>
                        </div>
                    </div>

                    {/* Turbidity (Fallback) */}
                    <div className="flex justify-between items-center p-4 rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                        <div className="flex items-center gap-3">
                            <Droplets className="w-5 h-5" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70">Water Turbidity</p>
                                <p className="font-bold">Level {scanData.turbidity_level} / 10</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      )}
    </div>
  );
};

export default VisionSimulator;