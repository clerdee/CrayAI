import React from 'react';
import { ScanEye } from 'lucide-react';
import VisionSimulator from './VisionSimulator';

const VisionMode = () => {
  return (
    <div className="space-y-4">
      
      {/* Context Banner */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
          <ScanEye className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-900">Vision System Simulator</h3>
          <p className="text-xs text-indigo-700/80 mt-0.5 leading-relaxed max-w-4xl">
            Upload an image here to bypass the mobile app and ping the Python AI backend directly. 
            This simulates exactly what researchers experience when scanning crayfish demographics and water conditions in the field.
          </p>
        </div>
      </div>

      {/* Direct render of the Simulator */}
      <VisionSimulator />

    </div>
  );
};

export default VisionMode;