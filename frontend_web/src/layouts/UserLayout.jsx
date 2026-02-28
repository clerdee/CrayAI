import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';
import Header from '../components/user/Header';
import Sidebar from '../components/user/Sidebar';
import client from '../api/client';

const UserLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- 1. CrayBot Chat State ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const initialMessage = { sender: 'bot', text: 'Hi! I am CrayBot. Ask me anything about Australian Red Claw crayfish!' };
  const [messages, setMessages] = useState([initialMessage]);
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await client.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) setUser(res.data.user);
      } catch (error) {
        console.error("Failed to fetch user context for layout", error);
      }
    };
    fetchUser();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setIsBotTyping(true);

    try {
      const CHATBOT_URL = import.meta.env.VITE_CHATBOT_API_URL;
      const response = await axios.post(`${CHATBOT_URL}/ask`, { question: userMsg });

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: response.data.response || "Sorry, I couldn't process that."
      }]);
    } catch (error) {
      console.error("CrayBot Error:", error);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "Oops! My cloud brain is disconnected right now. Please try again later."
      }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const confirmReset = () => {
    setMessages([initialMessage]);
    setShowClearConfirm(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F7F9] overflow-hidden">
      
      {/* Sidebar Component */}
      <Sidebar user={user} isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative transition-all duration-300 md:pl-20 pl-0">
        <Header user={user} toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
          {children}
        </main>
      </div>

      {/* --- CRAYBOT CHAT WINDOW MODAL --- */}
      {isChatOpen && (
        /* FIXED BUG: Removed the conflicting 'relative' tag so it acts purely as a floating fixed overlay */
        <div className="fixed bottom-24 right-6 z-[60] w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* CUSTOM CONFIRMATION OVERLAY */}
          {showClearConfirm && (
            <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
              <div className="bg-white p-5 rounded-2xl shadow-xl w-3/4 mx-4 animate-in zoom-in-95 duration-200">
                <h4 className="text-slate-800 font-bold mb-2">Clear Chat?</h4>
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                  This will delete your current conversation. Are you sure?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReset}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/30 rounded-xl transition-all active:scale-95"
                  >
                    Clear Chat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Header */}
          <div className="bg-[#E76F51] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center p-1">
                <img src="/crayfish.png" alt="CrayBot" className="w-full h-full object-contain filter brightness-0 invert" />
              </div>
              <div>
                <h3 className="font-bold text-sm">CrayBot</h3>
                <p className="text-[10px] opacity-90">AI Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowClearConfirm(true)}
                title="Clear Conversation"
                className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsChatOpen(false)} 
                title="Close Chat"
                className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Messages Area */}
          <div className="flex-1 p-4 h-80 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#3D5A80] text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isBotTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 p-3 rounded-2xl rounded-bl-none shadow-sm text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#E76F51]" /> typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Modal Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center relative z-10">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E76F51] transition-colors"
              disabled={showClearConfirm} 
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isBotTyping || showClearConfirm}
              className="bg-[#E76F51] text-white p-2.5 rounded-xl hover:bg-[#D65A3E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* --- FLOATING CRAYBOT LOGO BUTTON --- */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-[60] bg-white p-3 rounded-full shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group border border-slate-100 ring-4 ring-[#E76F51]/20"
      >
        <img 
          src="/crayfish.png" 
          alt="CrayBot" 
          className="w-10 h-10 object-contain drop-shadow-sm" 
        />
        
        {!isChatOpen && (
          <div className="absolute right-full mr-4 bg-white text-[#293241] text-xs font-bold px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-100">
            Ask CrayBot!
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white rotate-45 -translate-y-1/2 border-t border-r border-slate-100"></div>
          </div>
        )}
      </button>
      
    </div>
  );
};

export default UserLayout;