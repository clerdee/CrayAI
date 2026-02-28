import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Bot, Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GeminiTab = ({ searchQuery, onConvertToQa }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            // Fetch only the logs marked as Gemini successes
            const res = await axios.get(`${import.meta.env.VITE_CHATBOT_API_URL}/logs?status=Success%20(Gemini)`);
            setLogs(res.data);
        } catch (error) {
            console.error("Error fetching Gemini logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_CHATBOT_API_URL}/logs/${id}`);
            setLogs(logs.filter(log => log._id !== id));
            toast.success("Log removed");
        } catch (error) {
            toast.error("Failed to delete log");
        }
    };

    const filteredLogs = logs.filter(log =>
        (log.query || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.response || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-purple-500" />
                <p className="text-sm">Fetching Gemini's memory...</p>
            </div>
        );
    }

    if (filteredLogs.length === 0) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Bot className="w-8 h-8 mb-3 opacity-20 text-purple-500" />
                    <p className="text-sm">No Gemini logs found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 overflow-y-auto max-h-[600px]">
            <div className="grid gap-4">
                {filteredLogs.map(log => (
                    <div key={log._id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="flex gap-4 items-start">
                            <div className="mt-1 min-w-[32px]"><MessageSquare className="w-6 h-6 text-slate-300" /></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800 mb-2">{log.query}</p>
                                <div className="bg-purple-50 text-purple-800 p-3 rounded-xl text-sm border border-purple-100 mb-3">
                                    <div className="flex items-center gap-2 font-bold mb-1 text-xs uppercase opacity-70">
                                        <Bot className="w-3 h-3" /> Gemini Answered:
                                    </div>
                                    {log.response || "No response recorded. (Update Python Backend!)"}
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(log.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onConvertToQa(log)} className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-purple-600 transition-colors">
                                    <Plus className="w-3 h-3" /> Learn This
                                </button>
                                <button onClick={() => handleDelete(log._id)} className="flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GeminiTab;