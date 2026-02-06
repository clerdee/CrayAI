// src/pages/admin/Training/TrainingData.jsx
import React, { useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout'; 
import { Image as ImageIcon, MessageSquare } from 'lucide-react';

// Import the separated modes
import VisionMode from './VisionMode';
import ChatbotMode from './ChatbotMode';

const TrainingData = () => {
  // Default is 'vision', so it "lands" on Vision Classification
  const [trainingMode, setTrainingMode] = useState('vision'); 

  return (
    <AdminLayout title="AI Training Center">
      
      {/* 1. MAIN TOGGLE (The "Controller") */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 inline-flex">
            <button 
                onClick={() => setTrainingMode('vision')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    trainingMode === 'vision' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
                <ImageIcon className="w-4 h-4" /> Vision (Classification)
            </button>
            <button 
                onClick={() => setTrainingMode('chatbot')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    trainingMode === 'chatbot' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
                <MessageSquare className="w-4 h-4" /> Chatbot (NLP)
            </button>
        </div>
      </div>

      {/* 2. CONDITIONAL RENDER (Swaps the component based on toggle) */}
      {trainingMode === 'vision' ? (
          <VisionMode />
      ) : (
          <ChatbotMode />
      )}

    </AdminLayout>
  );
};

export default TrainingData;