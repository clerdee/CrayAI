import React from 'react';
import { X, MapPin, Download, Flag, AlertTriangle, User, Activity } from 'lucide-react';

const ScanDetailsModal = ({ log, onClose }) => {
  if (!log) return null;

  const formattedDate = new Date(log.date).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const hasWarning = log.algae === 'High' || log.algae === 'Critical' || log.turbidity > 6;

  // Determine Confidence Color
  const confidence = log.confidence || 0;
  const confColor = confidence > 80 ? 'bg-emerald-500' : confidence > 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Scan Details</h2>
            <p className="text-sm text-slate-500">ID: {log.id} • {formattedDate}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Column: Image & Basic Info (40% width) */}
            <div className="w-full lg:w-2/5 flex flex-col gap-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group bg-black flex-1 min-h-[250px]">
                <img src={log.image} alt="Full Scan" className="absolute inset-0 w-full h-full object-contain" />
                
                <div className="absolute top-4 right-4 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                        log.status === 'Verified' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                        log.status === 'Flagged' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                        {log.status}
                    </span>
                </div>

                {hasWarning && (
                    <div className="absolute bottom-4 left-4 bg-red-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg">
                        <AlertTriangle className="w-4 h-4" /> Environment Warning
                    </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
                 <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-500" /> Location Data
                 </h3>
                 <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500">Capture Location:</span>
                    <span className="font-medium text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                        {log.pond}
                    </span>
                 </div>
              </div>
            </div>

            {/* Right Column: AI Analysis (60% width) */}
            <div className="w-full lg:w-3/5 flex flex-col gap-6">
               
               {/* User Info Header with Email */}
               <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm shrink-0">
                   {log.userImage ? (
                       <img src={log.userImage} alt={log.user} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                   ) : (
                       <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-lg border border-teal-200">
                          <User className="w-5 h-5 text-teal-700" />
                       </div>
                   )}
                   <div>
                      <p className="font-bold text-slate-900">{log.user}</p>
                      <p className="text-xs text-slate-500">{log.userEmail}</p>
                   </div>
                   <button className="ml-auto text-xs font-bold text-teal-600 border border-teal-100 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors">
                      View Profile
                   </button>
               </div>

                {/* AI Result Grid */}
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-3">AI Analysis Result</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      
                      {/* Species */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Species</p>
                          <p className="font-bold text-slate-800 italic truncate">{log.species}</p>
                      </div>

                      {/* Confidence Level (UPDATED) */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            AI Confidence <Activity className="w-3 h-3" />
                          </p>
                          <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 text-lg">{confidence}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                                <div className={`h-full ${confColor} transition-all duration-500`} style={{ width: `${confidence}%` }}></div>
                          </div>
                      </div>

                      {/* Gender */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Gender</p>
                          <p className={`font-bold truncate ${log.gender?.includes('Female') ? 'text-pink-600' : log.gender?.includes('Male') ? 'text-blue-600' : log.gender?.includes('Berried') ? 'text-emerald-600' : 'text-slate-600'}`}>
                              {log.gender}
                          </p>
                      </div>

                      {/* Algae */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Blue-Green Algae</p>
                          <p className={`font-bold truncate ${log.algae === 'High' || log.algae === 'Critical' ? 'text-red-600' : log.algae === 'Moderate' ? 'text-yellow-600' : 'text-green-600'}`}>
                              {log.algae}
                          </p>
                      </div>

                      {/* Turbidity */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Water Turbidity</p>
                          <p className={`font-bold truncate ${log.turbidity > 6 ? 'text-orange-600' : 'text-blue-600'}`}>
                              Level {log.turbidity}
                          </p>
                      </div>

                      {/* Size */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Estimated Size</p>
                          <p className="font-bold text-slate-800 truncate">{log.sizeCm || '--'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{log.sizeIn}</p>
                      </div>

                      {/* Age */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 md:col-span-1 col-span-2">
                          <p className="text-xs text-slate-500 mb-1">Estimated Age</p>
                          <p className="font-bold text-slate-800 truncate">{log.age || '--'}</p>
                      </div>

                  </div>
                </div>

               {/* Action Buttons */}
               <div className="flex gap-4 pt-2 shrink-0">
                  <button className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <Flag className="w-4 h-4" /> Flag as Incorrect
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-slate-200">
                      <Download className="w-4 h-4" /> Download Report
                  </button>
               </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ScanDetailsModal;