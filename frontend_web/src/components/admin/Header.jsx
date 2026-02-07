import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Bell, Check, UserPlus, MessageSquare, ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const CHATBOT_API_URL = 'http://localhost:5001/api/training/chatbot';

const Header = ({ title }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // --- LOCAL STORAGE: READ STATUS ONLY ---
  const getStoredReadIds = () => JSON.parse(localStorage.getItem('read_notifications') || '[]');

  // --- 1. FETCH & UNSTACK NOTIFICATIONS ---
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [usersRes, modRes, botRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/auth/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/auth/admin/moderation`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${CHATBOT_API_URL}/stats`)
      ]);

      const readIds = getStoredReadIds();
      let rawNotifs = [];

      // A. NEW USERS
      if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentUsers = usersRes.value.data.users.filter(u => new Date(u.createdAt) > oneDayAgo);
        
        recentUsers.forEach(u => {
          rawNotifs.push({
            id: `user-${u._id}`,
            type: 'user',
            title: 'New User Registered',
            message: `${u.firstName} ${u.lastName} joined the platform.`,
            time: u.createdAt,
            link: '/admin/users' 
          });
        });
      }

      // B. MODERATION ALERTS (With "Key" Fix)
      if (modRes.status === 'fulfilled' && modRes.value.data.success) {
        const pendingItems = modRes.value.data.items.filter(i => i.status !== 'Resolved');
        
        pendingItems.forEach((item, index) => {
            const contentPreview = item.content 
                ? (item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content)
                : 'Content requires review';

            // FALLBACK KEY: Use index if _id is missing to prevent errors
            const uniqueKey = item._id ? `mod-${item._id}` : `mod-fallback-${index}`;

            rawNotifs.push({
                id: uniqueKey, 
                type: 'moderation',
                title: `Review Needed: ${item.type || 'Post'}`,
                message: `"${contentPreview}"`,
                time: item.createdAt || new Date().toISOString(),
                link: '/admin/moderation' 
            });
        });
      }

      // C. CHATBOT ALERTS (New Count = New ID = New Notification)
      if (botRes.status === 'fulfilled' && botRes.value.data) {
        const failedCount = botRes.value.data.failed_count;
        if (failedCount > 0) {
          const notifId = `bot-alert-count-${failedCount}`;

          rawNotifs.push({
            id: notifId,
            type: 'chatbot',
            title: 'Unanswered Bot Queries',
            message: `${failedCount} queries need training data.`,
            time: new Date().toISOString(), // Updates time to stay fresh
            link: '/admin/dataset' 
          });
        }
      }

      // PROCESS: Apply Read Status -> Sort by Date
      const processedNotifs = rawNotifs
        .map(n => ({
            ...n,
            isRead: readIds.includes(n.id)
        }))
        .sort((a, b) => new Date(b.time) - new Date(a.time));

      setNotifications(processedNotifs);

    } catch (error) {
      console.error("Notification Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. AUTO-REFRESH LOGIC ---
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); 
    return () => clearInterval(interval); 
  }, []);

  // --- 3. HANDLERS ---
  const markAsRead = (id) => {
    const currentReadIds = getStoredReadIds();
    if (!currentReadIds.includes(id)) {
        const updatedIds = [...currentReadIds, id];
        localStorage.setItem('read_notifications', JSON.stringify(updatedIds));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    const currentReadIds = getStoredReadIds();
    const newIds = notifications.map(n => n.id);
    const updatedIds = [...new Set([...currentReadIds, ...newIds])];
    localStorage.setItem('read_notifications', JSON.stringify(updatedIds));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- 4. GROUPING LOGIC ---
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const newNotifications = notifications.filter(n => !n.isRead);
  const earlierNotifications = notifications.filter(n => n.isRead);

  return (
    <header className="flex justify-between items-center bg-white px-8 py-5 border-b border-slate-100 sticky top-0 z-50">
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>

      <div className="flex items-center gap-6">

        {/* --- NOTIFICATION BELL CONTAINER --- */}
        <div className="relative" ref={dropdownRef}>
            
            {/* Bell Button */}
            <div 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    showNotifications ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
            </div>

            {/* 🔴 POP UP BADGE (Outside container to prevent clipping) */}
            {unreadCount > 0 && (
                <div 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in duration-300 px-1 cursor-pointer z-10"
                >
                    {unreadCount > 9 ? '9+' : unreadCount}
                </div>
            )}

            {/* --- DROPDOWN MODAL --- */}
            {showNotifications && (
                <div className="absolute right-0 top-14 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                    
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 transition-colors">
                                <Check className="w-3 h-3" /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* List Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Checking for updates...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <Bell className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">No notifications</p>
                                <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <>
                                {/* --- NEW SECTION --- */}
                                {newNotifications.length > 0 && (
                                    <div>
                                        <div className="px-5 py-2 bg-slate-50/80 backdrop-blur-sm text-[10px] font-bold text-teal-600 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-50">
                                            New ({newNotifications.length})
                                        </div>
                                        {newNotifications.map((notif) => (
                                            <NotificationItem 
                                                key={notif.id} 
                                                item={notif} 
                                                onClick={() => {
                                                    markAsRead(notif.id);
                                                    setShowNotifications(false);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* --- EARLIER SECTION --- */}
                                {earlierNotifications.length > 0 && (
                                    <div>
                                        <div className="px-5 py-2 bg-slate-50/80 backdrop-blur-sm text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-50">
                                            Earlier
                                        </div>
                                        {earlierNotifications.map((notif) => (
                                            <NotificationItem 
                                                key={notif.id} 
                                                item={notif} 
                                                onClick={() => setShowNotifications(false)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-3 border-t border-slate-50 bg-slate-50/30 text-center">
                        <Link 
                            to="/admin/notifications" 
                            onClick={() => setShowNotifications(false)}
                            className="text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
                        >
                            View Full History
                        </Link>
                    </div>
                </div>
            )}
        </div>

        {/* --- PROFILE --- */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">{user.firstName || 'Admin'} {user.lastName}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role || 'Super Admin'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-100 border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-teal-100 transition-all">
                <img 
                    src={user.profilePic || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0D9488&color=fff`} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                />
            </div>
        </div>
      </div>
    </header>
  );
};

// --- SUB-COMPONENT: Notification Item ---
const NotificationItem = ({ item, onClick }) => {
    const getIcon = () => {
        switch(item.type) {
            case 'user': return <UserPlus className="w-4 h-4 text-blue-600" />;
            case 'moderation': return <ShieldAlert className="w-4 h-4 text-orange-600" />;
            case 'chatbot': return <MessageSquare className="w-4 h-4 text-purple-600" />;
            default: return <Bell className="w-4 h-4 text-slate-600" />;
        }
    };

    const getBg = () => {
        switch(item.type) {
            case 'user': return 'bg-blue-100';
            case 'moderation': return 'bg-orange-100';
            case 'chatbot': return 'bg-purple-100';
            default: return 'bg-slate-100';
        }
    };

    return (
        <Link 
            to={item.link} 
            onClick={onClick}
            className={`px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 items-start group relative border-b border-slate-50 last:border-0 ${
                !item.isRead ? 'bg-teal-50/10 hover:bg-teal-50/20' : ''
            }`}
        >
            <div className={`w-8 h-8 rounded-full ${getBg()} flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform shadow-sm`}>
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0 pr-2">
                <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-sm ${!item.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                        {item.title}
                    </h4>
                    {!item.isRead && <span className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 flex-shrink-0 shadow-sm shadow-teal-200 animate-pulse"></span>}
                </div>
                <p className={`text-xs mt-0.5 line-clamp-2 ${!item.isRead ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                    {item.message}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1">
                    {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </Link>
    );
};

export default Header;