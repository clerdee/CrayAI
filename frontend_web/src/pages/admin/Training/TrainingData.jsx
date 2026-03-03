import React, { useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout'; 
import { Image as ImageIcon, MessageSquare, Cpu } from 'lucide-react';

// Import the separated modes
import VisionMode from './VisionMode';
import ChatbotMode from './ChatbotMode';

const TrainingData = () => {
  // Default is 'vision', so it "lands" on Vision Classification
  const [trainingMode, setTrainingMode] = useState('vision'); 

  return (
    <AdminLayout title="AI Sandbox & Training">
      
      {/* --- PAGE HEADER --- */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-600" />
            AI Engine Control Center
        </h2>
        <p className="text-slate-500 text-sm mt-1">
            Test the live Vision classification model or manage the Chatbot's NLP training dataset.
        </p>
      </div>

      {/* --- MAIN TOGGLE (Segmented Control Design) --- */}
      <div className="flex mb-8">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner border border-slate-200">
            <button 
                onClick={() => setTrainingMode('vision')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    trainingMode === 'vision' 
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                <ImageIcon className="w-4 h-4" /> Live Vision Tester
            </button>
            <button 
                onClick={() => setTrainingMode('chatbot')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    trainingMode === 'chatbot' 
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                <MessageSquare className="w-4 h-4" /> Chatbot NLP Dataset
            </button>
        </div>
      </div>

      {/* --- CONDITIONAL RENDER --- */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {trainingMode === 'vision' ? (
            <VisionMode />
        ) : (
            <ChatbotMode />
        )}
      </div>

    </AdminLayout>
  );
};

export default TrainingData;