import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, Camera, ScanLine, AlertCircle, 
  Loader2, Save, RefreshCw, Ruler, Droplets, Activity,
  Info, Calendar, MapPin, Fingerprint, Cpu, Clock, Share2
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom'; // <--- ADDED useLocation
import client from '../../api/client';

const ALGAE_LEVELS = [
  { label: "Low", color: "#0FA958" },
  { label: "Moderate", color: "#FFE600" },
  { label: "High", color: "#E11A22" },
  { label: "Critical", color: "#A61016" }
];

// --- 1. & 3. AGE CLASSIFICATION LOGIC WITH MONTHS ---
const getAgeCategory = (lengthCm) => {
  if (!lengthCm) return { class: 'Unknown', months: '--' };
  if (lengthCm < 3) return { class: 'Crayling', months: '< 1 month' };
  if (lengthCm < 7) return { class: 'Juvenile', months: '1-3 months' };
  if (lengthCm < 11) return { class: 'Sub-Adult', months: '3-6 months' };
  return { class: 'Adult / Breeder', months: '> 6 months' };
};

// --- 📊 SVG GAUGE CHART ---
const GaugeChart = ({ levelIndex }) => {
  const needleRotations = [-67.5, -22.5, 22.5, 67.5];
  const rotation = needleRotations[levelIndex] || -67.5;
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <svg width="240" height="140" viewBox="0 0 200 120">
        <path d="M 20 100 A 80 80 0 0 1 43.43 43.43" fill="none" stroke="#0FA958" strokeWidth="25" strokeLinecap="round" />
        <path d="M 43.43 43.43 A 80 80 0 0 1 100 20" fill="none" stroke="#FFE600" strokeWidth="25" />
        <path d="M 100 20 A 80 80 0 0 1 156.57 43.43" fill="none" stroke="#E11A22" strokeWidth="25" />
        <path d="M 156.57 43.43 A 80 80 0 0 1 180 100" fill="none" stroke="#A61016" strokeWidth="25" strokeLinecap="round" />
        <line x1="100" y1="100" x2="43.43" y2="43.43" stroke="#FFF" strokeWidth="4" />
        <line x1="100" y1="100" x2="100" y2="20" stroke="#FFF" strokeWidth="4" />
        <line x1="100" y1="100" x2="156.57" y2="43.43" stroke="#FFF" strokeWidth="4" />
        <g transform={`rotate(${rotation}, 100, 100)`} className="transition-transform duration-1000 ease-out">
          <polygon points="94,100 106,100 100,35" fill="#293241" />
          <circle cx="100" cy="100" r="10" fill="#293241" />
        </g>
      </svg>
    </div>
  );
};

// --- 📊 TURBIDITY GRAPH ---
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
  const location = useLocation(); // <--- RECEIVE DATA FROM DASHBOARD
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState('specimen');
  const [userLocation, setUserLocation] = useState('Unknown Location');

  // --- 1. HANDLE INCOMING FILE FROM DASHBOARD ---
  useEffect(() => {
    if (location.state && location.state.uploadedFile) {
      const file = location.state.uploadedFile;
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      // Clear the state so refreshing doesn't reload the file (optional but good practice)
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // --- 2. LOCATION TRACKING ---
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
    setActiveTab('specimen');

    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const res = await axios.post('http://localhost:5001/api/measure', formData, {
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
        genderConfidence: res.data.genderConfidence || 0,
        generatedScanId: `CRY-${Math.floor(Date.now() / 1000)}`,
        actualProcessingTime: actualProcessingTime,
        markedImageBase64: aiMarkedImage
      });
      toast.success('Analysis complete!');
    } catch (error) {
      console.error("AI Error:", error);
      toast.error('Failed to communicate with AI brain.');
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
      uploadData.append('upload_preset', 'CrayAI');
      uploadData.append('cloud_name', 'dvdrak5wl');

      const cloudRes = await axios.post('https://api.cloudinary.com/v1_1/dvdrak5wl/image/upload', uploadData);
      
      const width = scanResult.measurements?.[0]?.width_cm || 0;
      const height = scanResult.measurements?.[0]?.height_cm || 0;
      const ageData = getAgeCategory(height);
      const algaeInfo = ALGAE_LEVELS[scanResult.algae_level] || ALGAE_LEVELS[0];

      const payload = {
        scanId: scanResult.generatedScanId,
        gender: scanResult.gender || "Not Defined",
        gender_confidence: scanResult.genderConfidence || 0, // Ensure web saves confidence too!
        image: {
          url: cloudRes.data.secure_url,
          public_id: cloudRes.data.public_id
        },
        morphometrics: {
          width_cm: width,
          height_cm: height,
          estimated_age: `${ageData.class} (${ageData.months})`
        },
        environment: {
          algae_label: algaeInfo.label,
          turbidity_level: scanResult.turbidity_level || 2
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
        const postText = `I just scanned a ${ageData.class} ${scanResult.gender !== "Not Defined" ? scanResult.gender : ""} Red Claw! Dimensions: ${width.toFixed(2)}cm x ${height.toFixed(2)}cm. Water Turbidity is Level ${scanResult.turbidity_level || 2} with ${algaeInfo.label} Algae traces.`;
        
        setTimeout(() => navigate('/community', { 
          state: { 
            newPostImage: cloudRes.data.secure_url,
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
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#293241] tracking-tight uppercase">AI Scanner</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Analyze sizing and water quality instantly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: UPLOAD & PREVIEW */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 flex flex-col h-[700px] sticky top-8">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
            {!previewUrl ? (
              <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="flex-1 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors group">
                <UploadCloud className="w-10 h-10 text-[#3D5A80] mb-4" />
                <h3 className="text-lg font-black text-[#293241]">Upload a Photo</h3>
                <p className="text-sm text-slate-400 font-bold">Center the crayfish for best results</p>
              </div>
            ) : (
              <div className="flex-1 relative rounded-[2rem] overflow-hidden bg-[#111] flex items-center justify-center">
                <img src={previewUrl} alt="Preview" className={`w-full h-full object-contain ${isScanning ? 'opacity-30 blur-sm' : 'opacity-100'} transition-all duration-500`} />
                {isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[#E76F51] animate-spin mb-4" />
                    <p className="text-white font-black uppercase tracking-widest text-sm">Analyzing Specimen...</p>
                  </div>
                )}
                {!isScanning && <button onClick={resetScanner} className="absolute top-4 right-4 bg-black/60 text-white p-3 rounded-full hover:bg-black/80"><RefreshCw className="w-5 h-5" /></button>}
              </div>
            )}
            <div className="mt-6"><button onClick={analyzeImage} disabled={!previewUrl || isScanning || scanResult} className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${!previewUrl || isScanning || scanResult ? 'bg-slate-100 text-slate-400' : 'bg-[#E76F51] text-white hover:bg-red-600 shadow-xl shadow-[#E76F51]/20'}`}><ScanLine className="w-5 h-5" /> Run AI Analysis</button></div>
          </div>

          {/* RIGHT: RESULTS PANEL */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex flex-col">
            <h2 className="text-xl font-black text-[#293241] mb-6 flex items-center gap-3"><Activity className="text-[#3D5A80]" /> Report Dashboard</h2>
            {!scanResult ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <ScanLine className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-400 max-w-xs uppercase tracking-widest">Upload and analyze an image to view results.</p>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col">
                  {!hasDetected ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4"><AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" /><div><h4 className="font-black text-amber-800 mb-1">No Crayfish Detected</h4><p className="text-sm text-amber-700 font-medium">Please ensure lighting is good and the subject is centered.</p></div></div>
                  ) : (
                    <>
                      <div className="flex border-b border-slate-100 mb-6">
                        {['specimen', 'env', 'details'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${activeTab === tab ? 'text-[#3D5A80] border-[#3D5A80]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                            {tab === 'env' ? 'Environment' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                        ))}
                      </div>

                      {activeTab === 'specimen' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                            <div className="flex items-center justify-between mb-4"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gender ID</span><Activity className="w-4 h-4 text-[#3D5A80]" /></div>
                            <h3 className="text-3xl font-black text-[#3D5A80] mb-2 uppercase">{scanResult.gender || "Not Defined"}</h3>
                            <p className="text-xs font-bold text-slate-400 italic">Australian Red Claw</p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <div className="flex justify-between items-center mb-3"><span className="text-[10px] font-black text-[#293241] uppercase tracking-widest">AI Confidence Score</span><span className="text-xs font-black text-[#3D5A80]">{scanResult.genderConfidence}%</span></div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-[#3D5A80] transition-all duration-1000" style={{ width: `${scanResult.genderConfidence}%` }} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                              <div className="flex items-center gap-2 text-slate-400 mb-2"><Ruler className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Size Estimation</span></div>
                              <span className="text-lg font-black text-[#293241] block">{metrics.width_cm.toFixed(2)}cm W x {metrics.height_cm.toFixed(2)}cm H</span>
                              <span className="text-[11px] font-bold text-[#E76F51] mt-1">{(metrics.width_cm / 2.54).toFixed(2)}in W x {(metrics.height_cm / 2.54).toFixed(2)}in H</span>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                              <div className="flex items-center gap-2 text-slate-400 mb-2"><Clock className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age Class</span></div>
                              <span className="text-lg font-black text-[#293241] block">{ageInfo.class}</span>
                              <span className="text-[11px] font-bold text-[#E76F51] mt-1">{ageInfo.months}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'env' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2 text-[#8B5A2B]"><Droplets className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Water Turbidity</span></div><span className="text-lg font-black text-[#8B5A2B]">Level {scanResult.turbidity_level || 2}</span></div>
                            <TurbidityGraph level={scanResult.turbidity_level || 2} />
                          </div>
                          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center"><div className="flex items-center justify-start gap-2 text-[#0FA958] mb-2"><Activity className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Algae Trace</span></div><GaugeChart levelIndex={scanResult.algae_level || 0} /><div className="text-center pb-2"><span className="text-2xl font-black uppercase tracking-widest block" style={{ color: algaeData.color }}>{algaeData.label} ALGAE</span><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Cyanobacteria Detection</p></div></div>
                        </motion.div>
                      )}

                      {activeTab === 'details' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 shadow-sm">
                            <div className="p-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Calendar className="w-5 h-5"/></div>
                              <div><p className="text-[10px] font-black text-slate-400 uppercase">Date & Time</p><p className="text-sm font-bold text-slate-800">{new Date().toLocaleString()}</p></div>
                            </div>
                            <div className="p-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><MapPin className="w-5 h-5"/></div>
                              <div><p className="text-[10px] font-black text-slate-400 uppercase">Location</p><p className="text-sm font-bold text-slate-800">{userLocation}</p></div>
                            </div>
                            <div className="p-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500"><Fingerprint className="w-5 h-5"/></div>
                              <div><p className="text-[10px] font-black text-slate-400 uppercase">Session ID</p><p className="text-sm font-bold text-slate-800">{scanResult.generatedScanId}</p></div>
                            </div>
                            <div className="p-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><Clock className="w-5 h-5"/></div>
                              <div><p className="text-[10px] font-black text-slate-400 uppercase">Actual Processing Time</p><p className="text-sm font-bold text-slate-800">{scanResult.actualProcessingTime}s</p></div>
                            </div>
                            <div className="p-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500"><Cpu className="w-5 h-5"/></div>
                              <div><p className="text-[10px] font-black text-slate-400 uppercase">Analysis Core</p><p className="text-sm font-bold text-slate-800">YOLOv8 v{scanResult.model_version || '1.0'}</p></div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                  
                  {/* --- ACTION BUTTONS (Save & Post) --- */}
                  <div className="mt-auto pt-6 flex gap-3">
                    <button 
                      onClick={() => handleSaveScan('profile')}
                      disabled={isSaving || !hasDetected}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save to Profile
                    </button>
                    
                    <button 
                      onClick={() => handleSaveScan('feed')}
                      disabled={isSaving || !hasDetected}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#3D5A80] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#293241] transition-all shadow-lg shadow-[#3D5A80]/20 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                      Post to Feed
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanPage;