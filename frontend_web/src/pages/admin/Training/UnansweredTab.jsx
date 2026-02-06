import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AlertCircle, ArrowRight, Trash2, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';

const UnansweredTab = ({ searchQuery, onConvertToQa }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // API URL
  const API_URL = 'http://localhost:5001/api/training/chatbot';

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Fetch only "Failed" logs
      const response = await axios.get(`${API_URL}/logs?status=Failed`);
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Could not load unanswered queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDismiss = async (id) => {
    try {
      await axios.delete(`${API_URL}/logs/${id}`);
      setLogs(prev => prev.filter(log => log._id !== id));
      toast.success("Log dismissed");
    } catch (error) {
      toast.error("Failed to delete log");
    }
  };

  // Filter based on parent's search query
  const filteredLogs = logs.filter(log => 
    log.query.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
      <p>Checking for unanswered questions...</p>
    </div>
  );

  if (filteredLogs.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl m-6">
      <CheckCircle2 className="w-10 h-10 mb-3 text-green-500/20" />
      <p className="font-semibold text-slate-600">All caught up!</p>
      <p className="text-sm">No unanswered queries found.</p>
    </div>
  );

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-4">
        {filteredLogs.map((log) => (
          <div key={log._id} className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-orange-200 transition-colors">
            
            {/* Left: Query Info */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm md:text-base">"{log.query}"</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Low Confidence</span>
                    {/* <span className="text-xs text-slate-400 flex items-center gap-1">
                        <ClockIcon /> {new Date(log.timestamp).toLocaleDateString()}
                    </span> */}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button 
                onClick={() => handleDismiss(log._id)}
                className="flex-1 md:flex-none px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              >
                Dismiss
              </button>
              
              <button 
                onClick={() => onConvertToQa(log)}
                className="flex-1 md:flex-none px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-teal-600 rounded-lg transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-3 h-3" /> Add Answer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper Icon
const ClockIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default UnansweredTab;