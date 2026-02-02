import React from 'react';
import { X, MapPin, Download, Flag, AlertTriangle } from 'lucide-react';

const ScanDetailsModal = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Scan Details</h2>
            <p className="text-sm text-slate-500">ID: {log.id} • {log.date}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Image & Basic Info */}
            <div className="space-y-6">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group bg-black">
                <img src={log.image} alt="Full Scan" className="w-full h-64 object-contain" />
                
                <div className="absolute top-4 right-4 flex gap-2">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                        log.status === 'Verified' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                        log.status === 'Flagged' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                        {log.status}
                    </span>
                </div>

                {log.health !== 'Healthy' && log.health !== 'Unknown' && (
                    <div className="absolute bottom-4 left-4 bg-red-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg">
                        <AlertTriangle className="w-4 h-4" /> Disease Detected
                    </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-500" /> Location Data
                 </h3>
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Pond ID:</span>
                        <span className="font-medium text-slate-900">{log.pond}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">GPS Coordinates:</span>
                        <span className="font-mono text-slate-700 bg-white px-2 rounded border border-slate-200">{log.location || 'N/A'}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Right Column: AI Analysis */}
            <div className="space-y-6">
               
               {/* User Info */}
               <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                   <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-lg">
                      {log.user.charAt(0)}
                   </div>
                   <div>
                      <p className="font-bold text-slate-900">{log.user}</p>
                      <p className="text-xs text-slate-500">Authorized Researcher</p>
                   </div>
                   <button className="ml-auto text-xs font-bold text-teal-600 border border-teal-100 px-3 py-1.5 rounded-lg hover:bg-teal-50">
                      View Profile
                   </button>
               </div>

                {/* AI Result Grid */}
                <div>
                <h3 className="font-bold text-slate-900 mb-3">AI Analysis Result</h3>
                <div className="grid grid-cols-2 gap-4">
                    
                    {/* Species */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Species</p>
                        <p className="font-bold text-slate-800 italic">{log.species}</p>
                    </div>

                    {/* Confidence */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Confidence</p>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{log.confidence}%</span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500" style={{width: `${log.confidence}%`}}></div>
                            </div>
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Gender</p>
                        <p className="font-bold text-slate-800">{log.gender}</p>
                    </div>

                    {/* Health */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Health Status</p>
                        <p className={`font-bold ${log.health === 'Healthy' ? 'text-green-600' : 'text-red-600'}`}>
                            {log.health}
                        </p>
                    </div>

                    {/* --- NEW FIELDS ADDED HERE --- */}
                    
                    {/* Size */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Estimated Size</p>
                        <p className="font-bold text-slate-800">{log.size || '--'}</p>
                    </div>

                    {/* Age */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Estimated Age</p>
                        <p className="font-bold text-slate-800">{log.age || '--'}</p>
                    </div>

                </div>
                </div>

               {/* Action Buttons */}
               <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <Flag className="w-4 h-4" /> Flag as Incorrect
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-slate-200">
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