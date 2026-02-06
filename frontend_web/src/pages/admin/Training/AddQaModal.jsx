import React, { useState, useEffect } from 'react';
import { X, Save, Bot, User, Hash, AlertCircle, Sparkles, CheckCircle2, LayoutGrid, Pencil } from 'lucide-react';

const AddQaModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    query: '',
    response: '',
    topic: 'General',
    status: 'Approved'
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData); 
      } else {
        setFormData({ query: '', response: '', topic: 'General', status: 'Approved' }); 
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isEditMode = !!initialData;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/20 flex flex-col max-h-[90vh]">
        
        {/* Header - Dynamic Title */}
        <div className="relative bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {isEditMode ? (
                    <Pencil className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                ) : (
                    <Sparkles className="w-5 h-5 text-teal-500 fill-teal-500/20" />
                )}
                {isEditMode ? 'Edit Knowledge Pair' : 'New Knowledge Pair'}
             </h3>
             <p className="text-slate-500 text-xs mt-1">
                {isEditMode ? 'Modify existing chatbot logic.' : 'Teach the AI how to respond to specific queries.'}
             </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* LEFT PANEL: Editor */}
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="relative group">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    <User className="w-4 h-4 text-blue-500" /> User Asks (Trigger)
                </label>
                <input 
                  type="text" 
                  name="query"
                  value={formData.query}
                  onChange={handleChange}
                  placeholder="e.g. How often do I feed them?" 
                  className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  required
                />
            </div>
            
            <div className="flex pl-6 -my-2 opacity-20">
                <div className="h-6 w-0.5 bg-slate-400 rounded-full"></div>
            </div>

            <div className="relative group flex-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    <Bot className="w-4 h-4 text-teal-500" /> AI Responds
                </label>
                <textarea 
                  name="response"
                  value={formData.response}
                  onChange={handleChange}
                  rows="8" 
                  placeholder="e.g. You should feed adult Red Claw crayfish every 2-3 days..." 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium resize-none leading-relaxed h-full min-h-[160px]"
                  required
                ></textarea>
            </div>
          </div>

          {/* RIGHT PANEL: Sidebar */}
          <div className="w-full md:w-80 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 p-6 flex flex-col gap-6 shrink-0">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                <LayoutGrid className="w-4 h-4" /> Configuration
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Topic Category</label>
              <div className="relative">
                  <select 
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-teal-500 appearance-none cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
                  >
                    <option value="General">General</option>
                    <option value="Health">Health</option>
                    <option value="Water Quality">Water Quality</option>
                    <option value="Behavior">Behavior</option>
                    <option value="Feeding">Feeding</option>
                    <option value="Breeding">Breeding</option>
                  </select>
                  <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Deployment Status</label>
              <div className="relative">
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`w-full pl-3 pr-10 py-2.5 border rounded-xl text-sm font-bold focus:outline-none appearance-none cursor-pointer shadow-sm transition-all ${
                        formData.status === 'Approved' 
                        ? 'bg-teal-50 border-teal-200 text-teal-700 focus:border-teal-500' 
                        : 'bg-orange-50 border-orange-200 text-orange-700 focus:border-orange-500'
                    }`}
                  >
                    <option value="Approved">Approved (Live)</option>
                    <option value="Pending Review">Pending Review</option>
                  </select>
                  <CheckCircle2 className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${formData.status === 'Approved' ? 'text-teal-600' : 'text-orange-600'}`} />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-auto">
                <div className="flex gap-2 text-blue-800 font-bold text-xs mb-1">
                    <AlertCircle className="w-4 h-4" /> Pro Tip
                </div>
                <p className="text-[11px] text-blue-700/80 leading-relaxed">
                    "Approved" answers sync to offline devices immediately. Ensure accuracy before saving.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-white hover:text-slate-800 hover:border-slate-300 transition-all text-xs">
                    Cancel
                </button>
                <button type="submit" className={`px-4 py-2.5 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all text-xs flex justify-center items-center gap-2 ${
                    isEditMode ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-slate-900 hover:bg-teal-600 shadow-teal-500/30'
                }`}>
                    <Save className="w-3.5 h-3.5" /> {isEditMode ? 'Update Pair' : 'Save Pair'}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQaModal;