import React, { useState, useEffect } from 'react';
import { Menu, HelpCircle, AlertCircle, X, User, Bell, Heart, MessageSquare, UserPlus, Info, CheckCheck, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import notificationActions from '../../api/notificationActions';

const Header = ({ user, toggleMobileMenu }) => {
  const navigate = useNavigate();
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Notification states
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const faqs = [
    { q: 'How do I start scanning?', a: 'Navigate to the Dashboard and click "New Scan", or use the Camera tab.' },
    { q: 'Where are my results?', a: 'Your recent scans are saved automatically in the History section.' },
    { q: 'How do I post?', a: 'Go to the Community page and click "New Post" to share your findings.' }
  ];

  // Fetch notifications for the dropdown and badge
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationActions.getNotifications();
      if (res.data.success) {
        const notifs = res.data.notifications;
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications for header", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [user]);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      const res = await notificationActions.markAllRead();
      if (res.data.success) {f
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Mark all read failed:", err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      const res = await notificationActions.markOneRead(id);
      if (res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare className="text-blue-500" size={14} />;
      case 'like': return <Heart className="text-pink-500" size={14} />;
      case 'follow': return <UserPlus className="text-teal-500" size={14} />;
      default: return <Info className="text-slate-400" size={14} />;
    }
  };

  return (
    <>
      <header className="bg-[#3D5A80] border-b-[3px] border-[#98C1D9] z-30 shadow-sm flex-shrink-0 w-full relative">
        <div className="flex justify-between items-center px-4 md:px-8 h-20">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden p-2 bg-[#293241] text-[#E0FBFC] rounded-lg hover:bg-[#293241]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#98C1D9]/50"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black text-white hidden sm:block tracking-wide">
              CRAYFISH <span className="text-[#98C1D9]">AI</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            
            {/* Notification Bell & Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`relative p-2.5 rounded-full transition-colors shadow-sm focus:outline-none ${showNotifDropdown ? 'bg-[#293241] text-white' : 'text-[#E0FBFC] bg-[#293241]/40 hover:bg-[#293241]'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E76F51] text-white text-[9px] font-black flex items-center justify-center rounded-full border-[1.5px] border-[#3D5A80]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifDropdown(false)} 
                    />
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-12 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col"
                    >
                      <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-[#293241]">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#E76F51] bg-red-50 px-2.5 py-1 rounded-full">
                              {unreadCount} New
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold text-[#3D5A80] hover:text-[#293241] flex items-center gap-1 transition-colors"
                          >
                            <CheckCheck size={14} /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="px-5 py-10 text-center">
                            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400">No new notifications</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((noti) => (
                            <div 
                              key={noti._id} 
                              className={`flex items-start gap-3 p-4 border-b border-slate-50 transition-colors group cursor-pointer ${
                                noti.isRead 
                                  ? 'bg-white opacity-70 hover:bg-slate-50/80' 
                                  : 'bg-[#E0FBFC]/50 hover:bg-[#E0FBFC]/80'
                              }`}
                              onClick={() => {
                                if (!noti.isRead) handleMarkOneRead(noti._id); 
                                setShowNotifDropdown(false);
                                navigate('/notifications');
                              }}
                            >
                              <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-slate-100 shadow-sm flex-shrink-0 relative">
                                {noti.sender?.profilePic ? (
                                  <img src={noti.sender.profilePic} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-[#3D5A80] font-black text-sm">
                                    {noti.sender?.firstName?.charAt(0) || '?'}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#293241] leading-relaxed">
                                  <span className="font-black mr-1">{noti.sender?.firstName} {noti.sender?.lastName}</span>
                                  {noti.text || 'interacted with you'}
                                </p>
                                <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                                  {new Date(noti.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="flex flex-col items-center gap-2 flex-shrink-0 mt-1">
                                {!noti.isRead && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkOneRead(noti._id);
                                    }}
                                    className="p-1 text-[#3D5A80] bg-white rounded-full shadow-sm hover:bg-[#3D5A80] hover:text-white transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check size={12} strokeWidth={3} />
                                  </button>
                                )}
                                <div className="p-1.5 bg-white/60 rounded-lg">
                                  {getIcon(noti.type)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-3 bg-white border-t border-slate-50">
                        <button 
                          onClick={() => {
                            setShowNotifDropdown(false);
                            navigate('/notifications');
                          }}
                          className="w-full py-2.5 text-xs font-black uppercase tracking-widest text-[#3D5A80] hover:text-white hover:bg-[#3D5A80] rounded-xl transition-all"
                        >
                          See all notifications
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowHelpModal(true)}
              className="p-2.5 text-[#E0FBFC] bg-[#293241]/40 hover:bg-[#293241] rounded-full transition-colors shadow-sm"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Profile Link */}
            <Link 
              to={`/profile/${user?._id || ''}`}
              className="flex items-center gap-2 p-1.5 pr-4 bg-[#293241] rounded-full border border-[#98C1D9]/30 hover:border-[#98C1D9] transition-all focus:outline-none shadow-sm"
            >
              <div className="w-9 h-9 rounded-full bg-[#E0FBFC] overflow-hidden">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-2 text-[#3D5A80]" />
                )}
              </div>
              <span className="text-sm font-bold text-white hidden md:block max-w-[120px] truncate">
                {user?.firstName || 'Profile'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* --- HELP / FAQ MODAL --- */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#293241]/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[#293241]">Help & FAQs</h2>
                <button onClick={() => setShowHelpModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${idx % 2 === 0 ? 'bg-[#3D5A80] text-white' : 'bg-[#E76F51] text-white'}`}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#3D5A80] mb-1.5">{faq.q}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-full mt-8 py-3.5 bg-[#3D5A80] hover:bg-[#293241] text-white font-bold rounded-2xl transition-colors tracking-wide"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;