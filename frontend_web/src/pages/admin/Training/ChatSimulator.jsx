import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, X, Trash2, Sparkles, Loader2, AlertCircle } from 'lucide-react';

// 👇 Added 'onInteraction' prop
const ChatSimulator = ({ isOpen, onClose, onInteraction }) => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Hello! I am the CrayAI simulator. Test your training data here.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message
    const userMsg = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 2. Call Python AI Endpoint
      const response = await axios.post('http://localhost:5001/api/training/chatbot/ask', {
        question: userMsg.text
      });

      // 3. Add Bot Response
      const botMsg = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: response.data.response,
        topic: response.data.topic,
        confidence: response.data.confidence,
        isFlagged: response.data.is_flagged // Check if flagged
      };
      setMessages(prev => [...prev, botMsg]);

      // 👇 4. TRIGGER STATS REFRESH (Crucial Step)
      if (onInteraction) {
        onInteraction();
      }

    } catch (error) {
      const errorMsg = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: "Error: Could not connect to the AI brain. Is the Python server running?",
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ id: 1, type: 'bot', text: 'Chat cleared. Ready for new tests.' }]);
  };

  return (
    <>
      {/* Backdrop (Optional: clickable to close) */}
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90] transition-opacity" />
      )}

      {/* Slide-over Panel */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out border-l border-slate-100 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Simulator</h3>
              <p className="text-xs text-slate-500">Test AI responses live</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Clear Chat">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'}`}>
                {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] space-y-1`}>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.type === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : msg.isError || msg.isFlagged
                      ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-none'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                
                {/* Meta Data (Confidence/Topic) */}
                {msg.type === 'bot' && msg.confidence && (
                  <div className="flex gap-2 text-[10px] font-bold text-slate-400 px-1">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{msg.topic}</span>
                    <span>•</span>
                    <span className={msg.confidence === 'High' ? 'text-teal-500' : 'text-orange-500'}>
                      {msg.confidence} Confidence
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center shrink-0 text-teal-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
               </div>
               <div className="bg-slate-100 text-slate-500 text-xs px-3 py-2 rounded-2xl rounded-tl-none flex items-center">
                  Thinking...
               </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
          <div className="relative flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..." 
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="absolute right-2 p-2 bg-slate-900 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            This simulator uses the offline Python engine (Port 5001).
          </p>
        </form>

      </div>
    </>
  );
};

export default ChatSimulator;