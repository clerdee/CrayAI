import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, Zap, Ruler, AlertCircle, RefreshCw, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';

const VisionSimulator = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

  // 1. HANDLE IMAGE SELECTION
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImage(null); 
      setMeasurements([]);
      setError(null);
      setShowRawData(false);
    }
  };

  // 2. SEND TO PYTHON AI (Port 5001)
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('photo', selectedImage);

    try {
      // Connect to your Python Backend
      const response = await axios.post('http://localhost:5001/api/measure', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.image) {
        setResultImage(`data:image/jpeg;base64,${response.data.image}`);
        setMeasurements(response.data.measurements);
      }
    } catch (err) {
      console.error("AI Error:", err);
      setError("Failed to connect to Vision Engine. Is 'app.py' running on Port 5001?");
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract key items
  const referenceItem = measurements.find(m => m.type === 'reference');
  const targetItems = measurements.filter(m => m.type === 'target');
  const noiseItems = measurements.filter(m => m.type !== 'reference' && m.type !== 'target');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      
      {/* --- LEFT: VISUALIZER (Takes up more space now) --- */}
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
              <span className="text-[10px] text-white font-bold tracking-wide">OBJECT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></span>
              <span className="text-[10px] text-white font-bold tracking-wide">SCAN ZONE</span>
            </div>
          </div>
        </div>

        {/* CONTROLS (Moved under image for better flow) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <label className="flex-1 cursor-pointer">
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
                    <ImageIcon className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-600">
                        {selectedImage ? selectedImage.name : "Select Image..."}
                    </span>
                </div>
            </label>

            <button 
                onClick={handleAnalyze}
                disabled={!selectedImage || loading}
                className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                !selectedImage 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200'
                }`}
            >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Analyzing..." : "Run"}
            </button>
        </div>
      </div>

      {/* --- RIGHT: COMPACT RESULTS PANEL --- */}
      <div className="lg:col-span-1 flex flex-col h-full overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-indigo-600" /> 
              Scan Results
            </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {measurements.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                    <p className="text-sm">No results yet.</p>
                </div>
            ) : (
                <>
                    {/* 1. REFERENCE OBJECT (The Coin) */}
                    {referenceItem ? (
                        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-100 px-2 py-1 rounded mb-2 inline-block">REFERENCE</span>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-blue-400 font-semibold mb-1">Standard (Coin)</p>
                                    <p className="text-2xl font-bold text-slate-800">2.90<span className="text-sm text-slate-400 ml-1">cm</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400">Calibrated</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-xs text-center font-bold">
                            ⚠️ Reference Object Not Found
                        </div>
                    )}

                    {/* 2. TARGET OBJECTS (The Crayfish/Pen) */}
                    {targetItems.length > 0 ? (
                        targetItems.map((item, idx) => (
                            <div key={idx} className="bg-green-50 rounded-2xl p-4 border border-green-100 shadow-sm">
                                <span className="text-[10px] font-extrabold text-green-600 bg-green-100 px-2 py-1 rounded mb-2 inline-block">TARGET #{idx + 1}</span>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-xs text-green-600 font-bold uppercase mb-1">Width</p>
                                        <p className="text-xl font-bold text-slate-800">{item.width_cm}<span className="text-sm text-slate-400 ml-1">cm</span></p>
                                    </div>
                                    <div className="border-l border-green-200 pl-4">
                                        <p className="text-xs text-green-600 font-bold uppercase mb-1">Height</p>
                                        <p className="text-xl font-bold text-slate-800">{item.height_cm}<span className="text-sm text-slate-400 ml-1">cm</span></p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-slate-400">No main target detected.</p>
                    )}

                    {/* 3. COLLAPSIBLE NOISE SECTION (The Fix for "Too Long") */}
                    {noiseItems.length > 0 && (
                        <div className="border-t border-slate-100 pt-4">
                            <button 
                                onClick={() => setShowRawData(!showRawData)}
                                className="w-full flex justify-between items-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <span>Found {noiseItems.length} other items (Noise)</span>
                                {showRawData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            
                            {showRawData && (
                                <div className="mt-3 space-y-2">
                                    {noiseItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded-lg text-xs text-slate-500 font-mono">
                                            <span>Item #{idx + 1}</span>
                                            <span>{item.width_cm} x {item.height_cm} cm</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
      </div>

    </div>
  );
};

export default VisionSimulator;