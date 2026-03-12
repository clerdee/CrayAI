import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, Camera, ScanLine, AlertCircle, 
  Loader2, Save, RefreshCw, Ruler, Droplets, Activity,
  Info, Calendar, MapPin, Fingerprint, Cpu, Clock, Share2, Zap
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom'; 
import client from '../../api/client';
import { CLOUDINARY_CONFIG } from '../../config/cloudinary'; 

// --- UPDATED: 3 CLASSES FOR ALGAE ---
const ALGAE_LEVELS = [
  { label: "Low", color: "#0FA958" },    // Index 0
  { label: "Medium", color: "#FFE600" }, // Index 1
  { label: "High", color: "#E11A22" }    // Index 2
];

// --- AGE CLASSIFICATION LOGIC WITH MONTHS ---
const getAgeCategory = (lengthCm) => {
  if (!lengthCm) return { class: 'Unknown', months: '--' };
  if (lengthCm < 2) return { class: 'Crayling', months: '< 1 month' };
  if (lengthCm < 6) return { class: 'Juvenile', months: '1-3 months' };
  if (lengthCm < 12) return { class: 'Sub-Adult', months: '3-6 months' };
  return { class: 'Adult / Breeder', months: '> 6 months' };
};

// --- UPDATED: 3-SECTION SVG GAUGE CHART ---
const GaugeChart = ({ levelIndex }) => {
  // Needle points: -60 (Left/Low), 0 (Top/Medium), 60 (Right/High)
  const needleRotations = [-60, 0, 60];
  // Fallback to 0 (Low) if index is somehow out of bounds
  const rotation = needleRotations[levelIndex] !== undefined ? needleRotations[levelIndex] : -60;
  
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <svg width="240" height="140" viewBox="0 0 200 120">
        {/* Low Segment (Left 60 degrees) */}
        <path d="M 20 100 A 80 80 0 0 1 60 30.72" fill="none" stroke="#0FA958" strokeWidth="25" strokeLinecap="round" />
        
        {/* Medium Segment (Top 60 degrees) */}
        <path d="M 60 30.72 A 80 80 0 0 1 140 30.72" fill="none" stroke="#FFE600" strokeWidth="25" />
        
        {/* High Segment (Right 60 degrees) */}
        <path d="M 140 30.72 A 80 80 0 0 1 180 100" fill="none" stroke="#E11A22" strokeWidth="25" strokeLinecap="round" />
        
        {/* White Separator Lines */}
        <line x1="100" y1="100" x2="60" y2="30.72" stroke="#FFF" strokeWidth="5" />
        <line x1="100" y1="100" x2="140" y2="30.72" stroke="#FFF" strokeWidth="5" />
        
        {/* Animated Needle */}
        <g transform={`rotate(${rotation}, 100, 100)`} className="transition-transform duration-1000 ease-out">
          <polygon points="94,100 106,100 100,35" fill="#293241" />
          <circle cx="100" cy="100" r="10" fill="#293241" />
        </g>
      </svg>
    </div>
  );
};

// --- TURBIDITY GRAPH ---
const TurbidityGraph = ({ level }) => {
  const colors = [ '#F8FAFB', '#F1F5F9', '#E2E8F0', '#CBD5E1', '#DCC9A0', '#C4A484', '#A67B5B', '#8B5A2B', '#5D4037', '#3E2723' ];
  
  const getStatusText = (val) => {
    if (val <= 3) return "Healthy conditions for crayfish.";
    if (val <= 6) return "Water losing oxygen; growth may be stunted.";
    return "Critical: Gills may clog; risk of suffocation.";
  };

  return (
    <div className="mt-4">
      <div className="flex h-10 gap-1 justify-between">
        {colors.map((color, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
             <div 
                className={`w-full rounded-md border transition-all ${level === index + 1 ? 'border-[#3D5A80] border-2 h-full shadow-md scale-110 z-10' : 'border-slate-200 h-4/5 mt-auto opacity-70'}`}
                style={{ backgroundColor: color }}
             />
             <span className={`text-[10px] mt-1 ${level === index + 1 ? 'font-black text-[#3D5A80]' : 'font-bold text-slate-400'}`}>
               {index + 1}
             </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-[#FDF8F3] p-3 rounded-xl mt-4 border border-[#F3E8E0]">
         <Info className="w-4 h-4 text-[#8B5A2B]" />
         <p className="text-xs font-bold text-[#5D4037]">{getStatusText(level)}</p>
      </div>
    </div>
  );
};

// --- MAIN SCAN PAGE ---
const ScanPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const fileInputRef = useRef(null);
  
  const [scanMode, setScanMode] = useState('overall'); // 'overall' or 'environment'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState('specimen');
  const [userLocation, setUserLocation] = useState('Unknown Location');

  // --- HANDLE INCOMING FILE FROM DASHBOARD ---
  useEffect(() => {
    if (location.state && location.state.uploadedFile) {
      const file = location.state.uploadedFile;
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // --- LOCATION TRACKING ---
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const street = user.street || '';
        const city = user.city || '';
        setUserLocation(street && city ? `${street}, ${city}` : city || 'Web Client');
      } catch (err) {
        console.error('Failed to parse user data');
      }
    }
  }, []);

  // --- MODE SWITCHER ---
  const handleModeSwitch = (mode) => {
    setScanMode(mode);
    setActiveTab(mode === 'overall' ? 'specimen' : 'environment');
    resetScanner(); 
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null); 
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;
    setIsScanning(true);
    setScanResult(null);
    
    setActiveTab(scanMode === 'overall' ? 'specimen' : 'environment');

    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/measure`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const endTime = Date.now();
      const actualProcessingTime = ((endTime - startTime) / 1000).toFixed(2);

      let aiMarkedImage = previewUrl; 
      if (res.data && res.data.image) {
        aiMarkedImage = `data:image/jpeg;base64,${res.data.image}`;
        setPreviewUrl(aiMarkedImage);
      }

      setScanResult({
        ...res.data,
        gender: res.data.gender || "Not Defined",
        genderConfidence: res.data.genderConfidence ?? 0,
        generatedScanId: `CRY-${Math.floor(Date.now() / 1000)}`,
        actualProcessingTime: actualProcessingTime,
        markedImageBase64: aiMarkedImage
      });
      toast.success('Analysis complete!');
    } catch (error) {
      console.error("AI Error:", error);
      toast.error('Failed to communicate with AI brain. Is the backend running?');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveScan = async (actionType = 'profile') => {
    if (!scanResult || !selectedFile) return;
    setIsSaving(true);
    
    try {
      const uploadData = new FormData();
      uploadData.append('file', scanResult.markedImageBase64 || selectedFile); 
      uploadData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset || 'CrayAI');
      uploadData.append('cloud_name', CLOUDINARY_CONFIG.cloudName || 'dvdrak5wl');

      const cloudRes = await fetch(CLOUDINARY_CONFIG.apiUrl, {
          method: 'POST',
          body: uploadData
      });

      if (!cloudRes.ok) throw new Error(`Cloudinary upload failed with status ${cloudRes.status}`);

      const cloudData = await cloudRes.json();
      
      const width = scanMode === 'overall' ? (scanResult.measurements?.[0]?.width_cm || 0) : 0;
      const height = scanMode === 'overall' ? (scanResult.measurements?.[0]?.height_cm || 0) : 0;
      const ageData = getAgeCategory(height);
      const algaeInfo = ALGAE_LEVELS[scanResult.algae_level] || ALGAE_LEVELS[0];

      const payload = {
        scanId: scanResult.generatedScanId,
        gender: scanMode === 'overall' ? (scanResult.gender || "Not Defined") : "N/A",
        gender_confidence: scanMode === 'overall' ? (scanResult.genderConfidence || 0) : 0, 
        image: {
          url: cloudData.secure_url,
          public_id: cloudData.public_id
        },
        morphometrics: {
          width_cm: width,
          height_cm: height,
          estimated_age: scanMode === 'overall' ? `${ageData.class} (${ageData.months})` : 'N/A'
        },
        environment: {
          algae_label: algaeInfo.label,
          turbidity_level: scanResult.turbidity_level || 2,
          ai_analysis: scanResult.ai_environment_status || "No textual analysis provided."
        },
        metadata: {
          location: userLocation,
          processing_time: scanResult.actualProcessingTime,
          model_version: scanResult.model_version || '1.0'
        }
      };

      await client.post('/scans/create', payload);

      if (actionType === 'feed') {
        toast.success('Scan saved! Redirecting to Community...');
        let postText = "";
        if (scanMode === 'overall') {
          postText = `I just scanned a ${ageData.class} ${scanResult.gender !== "Not Defined" ? scanResult.gender : ""} Red Claw! Dimensions: ${width.toFixed(2)}cm x ${height.toFixed(2)}cm. Water Turbidity is Level ${scanResult.turbidity_level || 2} with ${algaeInfo.label} Algae traces.`;
        } else {
          postText = `I just ran a Water Quality check! Water Turbidity is Level ${scanResult.turbidity_level || 2} with ${algaeInfo.label} Algae traces.`;
        }
        
        setTimeout(() => navigate('/community', { 
          state: { 
            newPostImage: cloudData.secure_url,
            newPostText: postText
          }
        }), 1500);
      } else {
        toast.success('Scan successfully saved to your Profile!');
        setTimeout(() => navigate('/profile'), 1500);
      }

    } catch (error) {
      console.error("Save Error:", error);
      toast.error('Failed to save scan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasDetected = scanResult?.measurements && scanResult.measurements.length > 0;
  const metrics = hasDetected ? scanResult.measurements[0] : null;
  const ageInfo = metrics ? getAgeCategory(metrics.height_cm) : null;
  const algaeData = scanResult ? (ALGAE_LEVELS[scanResult.algae_level] || ALGAE_LEVELS[0]) : ALGAE_LEVELS[0];

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-4 md:p-8 font-sans pb-24">
      <Toaster position="top-center" />
      <div className="max-w-[90rem] mx-auto">
        
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#293241] tracking-tight uppercase">AI Scanner</h1>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Analyze sizing and water quality instantly</p>
          </div>
          
          {/* --- MODE SWITCHER UI --- */}
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => handleModeSwitch('overall')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${scanMode === 'overall' ? 'bg-white text-[#3D5A80] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Zap className="w-4 h-4" /> Overall Scan
            </button>
            <button 
              onClick={() => handleModeSwitch('environment')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${scanMode === 'environment' ? 'bg-white text-[#3D5A80] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Droplets className="w-4 h-4" /> Environment Only
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: UPLOAD & PREVIEW */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 flex flex-col h-[700px] sticky top-8">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
            
            {!previewUrl ? (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group"
              >
                <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Camera className="w-10 h-10 text-[#3D5A80]" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Tap to Capture</h3>
                <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest text-center px-4">
                  {scanMode === 'overall' ? 'or drop a photo of a crayfish' : 'or drop a photo of your tank/pond water'}
                </p>
              </div>
            ) : (
              <div className="flex-1 relative rounded-[2rem] overflow-hidden bg-black shadow-inner flex items-center justify-center">
                <img src={previewUrl} alt="Preview" className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isScanning ? 'opacity-40 blur-sm' : 'opacity-100'}`} />
                
                {isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                    <div className="bg-[#293241] text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest animate-pulse shadow-xl">
                      Analyzing {scanMode === 'overall' ? 'Target' : 'Water'}...
                    </div>
                  </div>
                )}
                
                {isScanning && (
                  <motion.div 
                    className={`absolute top-0 left-0 w-full h-1 ${scanMode === 'overall' ? 'bg-[#0FA958] shadow-[0_0_20px_#0FA958]' : 'bg-[#3D5A80] shadow-[0_0_20px_#3D5A80]'}`}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex gap-3 h-14">
              {previewUrl && !scanResult && !isScanning && (
                <>
                  <button onClick={resetScanner} className="px-6 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Retake
                  </button>
                  <button onClick={analyzeImage} className="flex-1 bg-[#3D5A80] hover:bg-[#293241] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#3D5A80]/20">
                    <ScanLine className="w-5 h-5" /> Run AI Analysis
                  </button>
                </>
              )}
              {scanResult && (
                <button onClick={resetScanner} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors">
                  <RefreshCw className="w-5 h-5" /> Scan Another
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: RESULTS DASHBOARD */}
          <div className="flex flex-col h-[700px]">
            {!scanResult ? (
              <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                  <Cpu className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Awaiting Data</h3>
                <p className="text-sm font-medium text-slate-400 mt-2 max-w-sm leading-relaxed">
                  {scanMode === 'overall' 
                    ? 'Upload an image and run the AI analysis to view morphometrics and water quality metrics here.'
                    : 'Upload a water sample image to instantly receive turbidity and algae concentration reports.'}
                </p>
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                
                {/* Custom Tabs */}
                <div className="flex p-2 bg-slate-50 border-b border-slate-100">
                  {scanMode === 'overall' && (
                    <button onClick={() => setActiveTab('specimen')} className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'specimen' ? 'bg-white text-[#293241] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Specimen</button>
                  )}
                  <button onClick={() => setActiveTab('environment')} className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'environment' ? 'bg-white text-[#293241] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Environment</button>
                  <button onClick={() => setActiveTab('metadata')} className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all ${activeTab === 'metadata' ? 'bg-white text-[#293241] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Metadata</button>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                  <AnimatePresence mode="wait">
                    
                    {/* --- SPECIMEN TAB --- */}
                    {activeTab === 'specimen' && scanMode === 'overall' && (
                      <motion.div key="specimen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        {!hasDetected ? (
                           <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-3xl p-8 text-center">
                             <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                             <h3 className="font-bold text-red-700 text-lg">No Crayfish Detected</h3>
                             <p className="text-sm text-red-500/80 mt-2">Please ensure the crayfish is clearly visible against a contrasting background.</p>
                           </div>
                        ) : (
                          <>
                            {/* Gender Banner */}
                            <div className={`p-5 rounded-3xl flex items-center justify-between border ${
                                scanResult.gender === 'Female' ? 'bg-pink-50 border-pink-100 text-pink-700' :
                                scanResult.gender === 'Male' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                scanResult.gender === 'Berried' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                               <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl font-black">
                                   {scanResult.gender === 'Female' ? '♀' : scanResult.gender === 'Male' ? '♂' : scanResult.gender === 'Berried' ? '🥚' : '?'}
                                 </div>
                                 <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Classification</p>
                                   <h3 className="text-xl font-black">{scanResult.gender}</h3>
                                 </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Confidence</p>
                                  <p className="text-lg font-bold">
                                    {scanResult.gender === "Not Defined" ? "--" : `${scanResult.genderConfidence}%`}
                                  </p>
                               </div>
                            </div>

                            {/* Sizing Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                  <Ruler className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Carapace Length</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl font-black text-[#293241]">{metrics.height_cm}</span>
                                  <span className="text-sm font-bold text-slate-400">cm</span>
                                </div>
                                <p className="text-xs font-medium text-slate-400 mt-1">approx {(metrics.height_cm / 2.54).toFixed(2)} inches</p>
                              </div>

                              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                  <Ruler className="w-4 h-4 rotate-90" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Carapace Width</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl font-black text-[#293241]">{metrics.width_cm}</span>
                                  <span className="text-sm font-bold text-slate-400">cm</span>
                                </div>
                                <p className="text-xs font-medium text-slate-400 mt-1">approx {(metrics.width_cm / 2.54).toFixed(2)} inches</p>
                              </div>
                            </div>

                            {/* Age Category */}
                            <div className="bg-[#F4F7F9] rounded-3xl p-5 border border-slate-200 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Est. Age Category</p>
                                <h4 className="text-lg font-black text-[#293241] mt-1">{ageInfo.class}</h4>
                              </div>
                              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                                <p className="text-sm font-bold text-[#3D5A80]">{ageInfo.months}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}

                    {/* --- ENVIRONMENT TAB --- */}
                    {activeTab === 'environment' && (
                      <motion.div key="env" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                         
                         {/* AI Textual Analysis */}
                         {scanResult.ai_environment_status && (
                           <div className="flex justify-between items-center p-5 rounded-2xl border border-blue-200 bg-blue-50 text-blue-800 shadow-sm">
                              <div className="flex gap-4 items-start">
                                 <div className="bg-blue-100 p-2 rounded-lg">
                                   <Zap className="w-5 h-5 text-blue-600" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-1">AI Water Analysis</p>
                                    <p className="text-sm font-semibold leading-relaxed">{scanResult.ai_environment_status}</p>
                                 </div>
                              </div>
                           </div>
                         )}

                         {/* Algae Section */}
                         <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Activity className="w-5 h-5" />
                                <h3 className="font-bold text-sm uppercase tracking-widest">Algae Concentration</h3>
                              </div>
                              <span className="text-xs font-black px-3 py-1 rounded-full" style={{ backgroundColor: algaeData.color + '20', color: algaeData.color }}>
                                {algaeData.label}
                              </span>
                            </div>
                            <GaugeChart levelIndex={scanResult.algae_level} />
                         </div>

                         {/* Turbidity Section */}
                         <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
                            <div className="flex items-center gap-2 text-slate-700 mb-2">
                              <Droplets className="w-5 h-5 text-blue-500" />
                              <h3 className="font-bold text-sm uppercase tracking-widest">Water Turbidity</h3>
                            </div>
                            <div className="flex items-end gap-2 mb-2">
                              <span className="text-4xl font-black text-[#293241]">{scanResult.turbidity_level}</span>
                              <span className="text-sm font-bold text-slate-400 mb-1">/ 10</span>
                            </div>
                            <TurbidityGraph level={scanResult.turbidity_level} />
                         </div>

                      </motion.div>
                    )}

                    {/* --- METADATA TAB --- */}
                    {activeTab === 'metadata' && (
                      <motion.div key="meta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                         
                         <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 shrink-0"><Fingerprint className="w-5 h-5" /></div>
                           <div className="min-w-0">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scan ID</p>
                             <p className="font-mono text-sm font-bold text-slate-700 truncate">{scanResult.generatedScanId}</p>
                           </div>
                         </div>

                         <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 shrink-0"><MapPin className="w-5 h-5" /></div>
                           <div className="min-w-0">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                             <p className="text-sm font-bold text-slate-700 truncate">{userLocation}</p>
                           </div>
                         </div>

                         <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 shrink-0"><Calendar className="w-5 h-5" /></div>
                           <div className="min-w-0">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</p>
                             <p className="text-sm font-bold text-slate-700 truncate">{new Date().toLocaleString()}</p>
                           </div>
                         </div>

                         <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 shrink-0"><Clock className="w-5 h-5" /></div>
                           <div className="min-w-0">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Time</p>
                             <p className="text-sm font-bold text-slate-700 truncate">{scanResult.actualProcessingTime}s</p>
                           </div>
                         </div>

                         <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 shrink-0"><Cpu className="w-5 h-5" /></div>
                           <div className="min-w-0">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Version</p>
                             <p className="text-sm font-bold text-slate-700 truncate">v{scanResult.model_version || '1.0'}</p>
                           </div>
                         </div>

                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* Save Actions */}
                <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                  <button 
                    onClick={() => handleSaveScan('feed')}
                    disabled={isSaving}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" /> Post to Feed
                  </button>
                  <button 
                    onClick={() => handleSaveScan('profile')}
                    disabled={isSaving}
                    className="flex-1 py-3.5 bg-[#E76F51] hover:bg-[#D65A3E] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E76F51]/20 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isSaving ? 'Saving...' : 'Save to History'}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanPage;