import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCircle, MessageSquare, Heart, 
  UserPlus, Info, Loader2, MoreVertical, CheckCheck 
} from 'lucide-react';
import notificationActions from '../../api/notificationActions';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for filtering and pagination
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    // 1. Initial fetch (shows the loading spinner)
    fetchNotifications(true);

    // 2. AUTO-CLEANUP SYNC: 
    const intervalId = setInterval(() => {
      fetchNotifications(false); 
    }, 10000);

    // 3. Cleanup the interval when the user leaves the page
    return () => clearInterval(intervalId);
  }, []);

  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await notificationActions.getNotifications();
      if (res.data.success) {
        // This will automatically drop deleted notifications from the UI
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationActions.markAllRead();
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
      }
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare className="text-blue-500" size={18} />;
      case 'like': return <Heart className="text-pink-500" size={18} />;
      case 'follow': return <UserPlus className="text-teal-500" size={18} />;
      default: return <Info className="text-slate-400" size={18} />;
    }
  };

  // Calculate total unread count for the badge
  const unreadCount = notifications.filter(noti => !noti.isRead).length;

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(noti => {
    if (filter === 'unread') return !noti.isRead;
    return true;
  });

  // Limit displayed notifications based on visibleCount
  const displayedNotifications = filteredNotifications.slice(0, visibleCount);

  // Load more handler
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#293241] tracking-tight">Notifications</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Research updates and interactions</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Tabs for All & Unread */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => { setFilter('all'); setVisibleCount(10); }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                filter === 'all' 
                  ? 'bg-white text-[#3D5A80] shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setFilter('unread'); setVisibleCount(10); }}
              className={`relative px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                filter === 'unread' 
                  ? 'bg-white text-[#3D5A80] shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Unread
              {/* Unread Count Badge */}
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-[#E76F51] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </button>
          </div>

          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#3D5A80] hover:bg-[#F8FAFB] transition-all shadow-sm"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
          <Loader2 className="w-10 h-10 text-[#3D5A80] animate-spin mb-4" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading alerts...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* AnimatePresence handles the smooth fading out of deleted notifications automatically */}
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 text-center px-6">
                <div className="w-20 h-20 bg-[#F4F7F9] rounded-full flex items-center justify-center mb-6">
                  <Bell className="text-slate-300 w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-[#293241] uppercase tracking-widest mb-2">No new alerts</h3>
                <p className="text-sm text-slate-400 font-bold max-w-xs leading-relaxed">
                  {filter === 'unread' ? "You have no unread notifications." : "You're all caught up with your research notifications."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((noti) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={noti._id}
                  onClick={() => !noti.isRead && handleMarkOneRead(noti._id)}
                  className={`group relative bg-white p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-4 ${
                    noti.isRead ? 'border-slate-50 opacity-60' : 'border-[#E0FBFC] shadow-lg shadow-[#3D5A80]/5'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    {noti.sender?.profilePic ? (
                      <img src={noti.sender.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#E0FBFC] text-[#3D5A80] font-black text-lg">
                        {noti.sender?.firstName?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#293241]">
                      <span className="font-black text-[#3D5A80]">
                        {noti.sender?.firstName} {noti.sender?.lastName}
                      </span>
                      {" "}{noti.text || 'performed an action'}
                    </p>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 block">
                      {new Date(noti.createdAt).toLocaleDateString()} at {new Date(noti.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {!noti.isRead && (
                      <div className="w-2 h-2 bg-[#E76F51] rounded-full animate-pulse" />
                    )}
                    <div className="p-2 bg-slate-50 rounded-xl">
                      {getIcon(noti.type)}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Load More Button */}
          {filteredNotifications.length > visibleCount && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mt-6 pt-4"
            >
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-[#3D5A80] hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
              >
                See Previous Notifications
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;