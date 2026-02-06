import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Delete this Q&A Pair?</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            This action cannot be undone. This question will be immediately removed from the chatbot's knowledge base.
          </p>
        </div>

        <div className="flex border-t border-slate-100 bg-slate-50">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-4 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors border-r border-slate-100"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-4 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;