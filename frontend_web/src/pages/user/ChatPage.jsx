import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Send, User, Clock, CheckCircle2, 
  MoreVertical, Image as ImageIcon, MessageSquare,
  AlertCircle, Loader2, XCircle, Check, Inbox, ChevronLeft
} from 'lucide-react';
import axios from 'axios';
import chatActions from '../../api/chatActions';
import client from '../../api/client';

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState('mutual'); 
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const location = useLocation();
  
  // Image Upload States
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); 
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const formatSidebarDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const msgDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (msgDateOnly.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (msgDateOnly.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const isMyId = (id) => {
    if (!id) return false;
    const currentId = currentUser?._id || currentUser?.id;
    const targetId = typeof id === 'object' ? (id._id || id.id) : id;
    return String(targetId) === String(currentId);
  };

  // Helper variables for filtering chats
  const mutualChats = chats.filter(c => 
    c.status === 'accepted' || (c.status === 'pending' && isMyId(c.initiator))
  );

  const requestChats = chats.filter(c => 
    c.status === 'pending' && !isMyId(c.initiator)
  );

  const displayedChats = activeTab === 'mutual' ? mutualChats : requestChats;

  // 1. Initial Load & Polling for Sidebar Chats (Every 10s)
  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchInitialData, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. Poll for Active Chat Messages (Every 10s)
  useEffect(() => {
    let messageInterval;
    
    if (selectedChat && selectedChat._id !== 'new_chat_temp') {
      fetchMessages();
      
      messageInterval = setInterval(() => {
        fetchMessages();
      }, 10000);
    }
    
    return () => {
      if (messageInterval) clearInterval(messageInterval);
    };
  }, [selectedChat]);

  // 3. 🚨 NEW: Handle Incoming Routing State from Profile Page
  useEffect(() => {
    if (location.state?.targetUser && currentUser && !isLoading) {
      const target = location.state.targetUser;
      const targetId = String(target.uid);

      const existingChat = mutualChats.find(c => 
        c.participants.some(p => String(p._id || p.id) === targetId)
      );
      const existingRequest = requestChats.find(c => 
        c.participants.some(p => String(p._id || p.id) === targetId)
      );

      if (existingChat) {
        setActiveTab('mutual');
        setSelectedChat(existingChat);
      } else if (existingRequest) {
        setActiveTab('requests');
        setSelectedChat(existingRequest);
      } else {
        // Create a temporary "new" chat state so the user can send the first message
        setActiveTab('mutual');
        setSelectedChat({
          _id: 'new_chat_temp',
          status: 'new',
          participants: [
            currentUser, 
            { _id: targetId, firstName: target.name.split(' ')[0], lastName: target.name.split(' ')[1] || '', profilePic: target.profilePic } 
          ]
        });
        setMessages([]); // Clear out any previous messages
      }
      
      // Clear the location state so it doesn't trigger repeatedly
      window.history.replaceState({}, document.title);
    }
  }, [location.state, currentUser, isLoading, mutualChats, requestChats]);

  // 4. Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchInitialData = async () => {
    try {
      const userRes = await client.get('/auth/profile');
      const me = userRes.data.user;
      setCurrentUser(me);
      
      const chatRes = await chatActions.getUserChats();
      if (chatRes.data.success) {
        setChats(chatRes.data.chats);
        
        if (selectedChat && selectedChat._id !== 'new_chat_temp') {
          const updated = chatRes.data.chats.find(c => c._id === selectedChat._id);
          if (updated && updated.status !== selectedChat.status) {
            setSelectedChat(updated);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load chat data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    const partner = selectedChat.participants.find(p => !isMyId(p._id || p.id));
    if (!partner) return;

    try {
      const res = await chatActions.getMessages(partner._id || partner.id);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Error fetching message history:", err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file); 
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setSelectedImage(reader.result); 
      };
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !selectedChat) return;
    
    setIsSending(true);
    const partner = selectedChat.participants.find(p => !isMyId(p._id || p.id));
    
    try {
      let finalImageUrl = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('upload_preset', 'CrayAI');
        formData.append('cloud_name', 'dvdrak5wl'); 

        const cloudinaryRes = await axios.post(
          'https://api.cloudinary.com/v1_1/dvdrak5wl/image/upload',
          formData
        );
        finalImageUrl = cloudinaryRes.data.secure_url;
      }

      const res = await chatActions.sendMessage(partner._id || partner.id, newMessage, finalImageUrl);
      
      if (res.data.success) {
        setMessages([...messages, res.data.message]);
        setNewMessage('');
        setSelectedImage(null);
        setSelectedFile(null); 
        if (fileInputRef.current) fileInputRef.current.value = ""; 
        
        // 🚨 NEW: If this was a brand new chat, fetch the official chat data to replace the temporary state
        if (selectedChat._id === 'new_chat_temp') {
          await fetchInitialData();
          // Find the newly created chat with this user
          const newOfficialChat = chats.find(c => c.participants.some(p => String(p._id || p.id) === String(partner._id || partner.id))) 
                               || res.data.chat; 
          
          if (newOfficialChat) setSelectedChat(newOfficialChat);
        } else {
          // Refresh sidebar instantly for existing chats
          setChats(prev => prev.map(c => 
            c._id === selectedChat._id 
              ? { ...c, lastMessage: finalImageUrl ? '📷 Image' : newMessage, lastMessageTime: new Date() } 
              : c
          ));
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptRequest = async (chatId) => {
    try {
      const res = await chatActions.acceptChatRequest(chatId);
      if (res.data.success) {
        await fetchInitialData();
        setActiveTab('mutual');
        setSelectedChat(prev => ({ ...prev, status: 'accepted' }));
      }
    } catch (err) {
      console.error("Failed to accept message request:", err);
    }
  };

  const handleDeclineRequest = async (chatId) => {
    if (!window.confirm("Are you sure you want to decline this request?")) return;
    try {
      const res = await chatActions.declineChatRequest(chatId);
      if (res.data.success) {
        setSelectedChat(null);
        await fetchInitialData();
      }
    } catch (err) {
      console.error("Failed to decline message request:", err);
    }
  };

  if (isLoading && !currentUser) {
    return (
      <div className="flex h-full items-center justify-center bg-white rounded-[2.5rem]">
        <Loader2 className="w-8 h-8 text-[#3D5A80] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-80 border-r border-slate-50 flex flex-col bg-white">
        <div className="p-6">
          <h1 className="text-xl font-black text-[#293241] mb-6">Messages</h1>
          
          <div className="flex bg-[#F4F7F9] p-1.5 rounded-2xl mb-6">
            <button 
              onClick={() => { setActiveTab('mutual'); setSelectedChat(null); }}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === 'mutual' ? 'bg-white text-[#3D5A80] shadow-sm' : 'text-slate-400'
              }`}
            >
              Chats
            </button>
            <button 
              onClick={() => { setActiveTab('requests'); setSelectedChat(null); }}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative ${
                activeTab === 'requests' ? 'bg-white text-[#E76F51] shadow-sm' : 'text-slate-400'
              }`}
            >
              Requests
              {requestChats.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E76F51] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black">
                  {requestChats.length}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input type="text" placeholder="Search chats..." className="w-full bg-[#F4F7F9] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none border-2 border-transparent focus:border-[#E0FBFC]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
          {displayedChats.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Inbox className="w-10 h-10 text-slate-100 mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                No {activeTab === 'mutual' ? 'conversations' : 'requests'}
              </p>
            </div>
          ) : (
            displayedChats.map(chat => {
              const partner = chat.participants.find(p => !isMyId(p._id || p.id));
              const isActive = selectedChat?._id === chat._id;
              
              return (
                <button
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all mb-2 group ${
                    isActive ? 'bg-[#E0FBFC]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                    <img src={partner?.profilePic || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`text-sm font-black truncate ${isActive ? 'text-[#3D5A80]' : 'text-[#293241]'}`}>
                        {partner?.firstName}
                      </h4>
                      <span className={`text-[9px] font-bold uppercase ml-2 whitespace-nowrap ${isActive ? 'text-[#3D5A80]/60' : 'text-slate-400'}`}>
                        {formatSidebarDate(chat.lastMessageTime || chat.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {chat.status === 'pending' && isMyId(chat.initiator) && (
                            <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-black uppercase flex-shrink-0">Sent</span>
                        )}
                        <p className="text-[11px] font-bold text-slate-400 truncate opacity-70">
                            {chat.lastMessage || 'Start a conversation'}
                        </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT VIEW */}
      <div className="flex-1 flex flex-col bg-[#F8FAFB]">
        {selectedChat ? (
          <>
            <div className="bg-white p-5 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-[#F4F7F9]">
                  <img src={selectedChat.participants.find(p => !isMyId(p._id || p.id))?.profilePic} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#293241]">
                    {selectedChat.participants.find(p => !isMyId(p._id || p.id))?.firstName} {selectedChat.participants.find(p => !isMyId(p._id || p.id))?.lastName}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedChat.status === 'new' ? 'New Message' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
              <button className="p-2.5 text-slate-300 hover:text-[#293241]"><MoreVertical size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
              
              {/* ACCEPT UI FOR INCOMING REQUESTS */}
              {selectedChat.status === 'pending' && !isMyId(selectedChat.initiator) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center max-w-md mx-auto mb-6"
                >
                  <AlertCircle className="w-8 h-8 text-[#E76F51] mx-auto mb-4" />
                  <h4 className="text-sm font-black text-[#293241] uppercase tracking-widest mb-2">Message Request</h4>
                  <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed px-4">
                    This researcher wants to collaborate with you. Accept to start sharing research data and reply to messages.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleDeclineRequest(selectedChat._id)}
                      className="flex-1 py-3.5 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => handleAcceptRequest(selectedChat._id)}
                      className="flex-1 py-3.5 bg-[#3D5A80] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#293241] transition-all shadow-lg"
                    >
                      Accept
                    </button>
                  </div>
                </motion.div>
              )}

              {selectedChat.status === 'pending' && isMyId(selectedChat.initiator) && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-center mb-4 max-w-xs mx-auto">
                   <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                      Invitation Sent. Waiting for response...
                   </p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isMe = isMyId(msg.sender?._id || msg.sender);
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex flex-col gap-1.5 max-w-[75%]">
                      <div className={`p-4 rounded-[2rem] text-sm font-bold shadow-sm ${
                        isMe ? 'bg-[#3D5A80] text-white rounded-tr-none' : 'bg-white text-[#293241] rounded-tl-none border border-slate-100'
                      }`}>
                        {msg.image && (
                          <img 
                            src={msg.image} 
                            alt="Attached" 
                            className="w-full max-w-[240px] h-auto object-cover rounded-xl mb-2 border border-black/10 shadow-sm"
                          />
                        )}
                        {msg.text && <span className="leading-relaxed">{msg.text}</span>}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest text-slate-300 px-2 ${isMe ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className={`p-6 bg-white border-t border-slate-100 sticky bottom-0 ${
              (selectedChat.status === 'pending' && !isMyId(selectedChat.initiator)) ? 'opacity-30 pointer-events-none grayscale' : ''
            }`}>
              <form onSubmit={handleSendMessage} className="flex items-end gap-4">
                
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                />

                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 mb-1 text-slate-400 hover:text-[#3D5A80] hover:bg-[#F4F7F9] rounded-2xl transition-all"
                >
                  <ImageIcon size={22} />
                </button>

                {/* Input Container */}
                <div className="flex-1 flex flex-col bg-[#F4F7F9] rounded-[1.5rem] p-2 border-2 border-transparent focus-within:border-[#E0FBFC]">
                  {/* Image Preview Container */}
                  {selectedImage && (
                    <div className="relative w-20 h-20 mb-2 ml-3 mt-2">
                      <img 
                        src={selectedImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm" 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setSelectedImage(null);
                          setSelectedFile(null);
                          if(fileInputRef.current) fileInputRef.current.value = "";
                        }} 
                        className="absolute -top-2 -right-2 bg-[#E76F51] text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}

                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedChat.status === 'pending' && isMyId(selectedChat.initiator) ? "Wait for response..." : "Type your message..."}
                    className="w-full bg-transparent px-6 py-3 text-sm font-bold outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedImage) || isSending}
                  className="p-5 mb-1 bg-[#3D5A80] text-white rounded-2xl hover:bg-[#293241] shadow-xl disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {isSending ? <Loader2 className="w-[22px] h-[22px] animate-spin" /> : <Send size={22} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <MessageSquare className="text-[#3D5A80]/20 w-16 h-16 mb-6" />
            <h3 className="text-lg font-black text-[#293241] uppercase tracking-widest mb-3">Your Inbox</h3>
            <p className="text-sm text-slate-400 font-bold max-w-xs">Select a researcher to start collaborating.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;