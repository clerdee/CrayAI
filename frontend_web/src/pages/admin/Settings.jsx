import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  User, Lock, Bell, BrainCircuit, Save, Shield, Camera, Loader, Store,
  UserPlus, ShieldAlert, MessageSquare, CheckCircle, ChevronLeft, ChevronRight,
  Eye, EyeOff, CheckCircle2, XCircle
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL;

const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- TOAST NOTIFICATION STATE ---
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  // --- STATE MANAGEMENT ---
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', email: '', phone: '', bio: '', profilePic: ''
  });
  
  const [settings, setSettings] = useState({
    marketplaceEnabled: true
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  // --- NOTIFICATION & PAGINATION STATE ---
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8; 

  // --- FETCH ALL DATA ON LOAD ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Profile & Global Settings
        const [profileRes, settingsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/auth/profile`, { headers }),
          axios.get(`${API_BASE_URL}/auth/admin/settings`, { headers }).catch(() => ({ data: {} }))
        ]);

        if (profileRes.data.success) {
          setProfile({
            firstName: profileRes.data.user.firstName || '',
            lastName: profileRes.data.user.lastName || '',
            email: profileRes.data.user.email || '',
            phone: profileRes.data.user.phone || '',
            bio: profileRes.data.user.bio || '',
            profilePic: profileRes.data.user.profilePic || ''
          });
        }

        if (settingsRes.data?.success && settingsRes.data?.settings) {
          setSettings({ marketplaceEnabled: settingsRes.data.settings.marketplaceEnabled });
        }

        // 2. Fetch Notification History
        const [usersRes, modRes, botRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/auth/admin/users`, { headers }),
          axios.get(`${API_BASE_URL}/auth/admin/moderation`, { headers }),
          axios.get(`${CHATBOT_API_URL}/stats`)
        ]);

        let rawNotifs = [];

        if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
          usersRes.value.data.users.forEach(u => {
            rawNotifs.push({
              id: `user-${u._id}`, type: 'user', title: 'New User Registered',
              message: `${u.firstName} ${u.lastName} joined the platform.`,
              time: u.createdAt
            });
          });
        }

        if (modRes.status === 'fulfilled' && modRes.value.data.success) {
          const pendingItems = modRes.value.data.items.filter(i => i.status !== 'Resolved');
          pendingItems.forEach((item, idx) => {
            rawNotifs.push({
              id: `mod-${item._id || idx}`, type: 'moderation', title: `Review Needed: ${item.type}`,
              message: `"${item.content ? item.content.substring(0, 50) + '...' : 'Content requires review'}"`,
              time: item.createdAt || new Date().toISOString()
            });
          });
        }

        if (botRes.status === 'fulfilled' && botRes.value.data) {
          const failedCount = botRes.value.data.failed_count;
          if (failedCount > 0) {
            rawNotifs.push({
              id: `bot-${failedCount}`, type: 'chatbot', title: 'Unanswered Bot Queries',
              message: `${failedCount} queries need training data.`,
              time: new Date().toISOString()
            });
          }
        }

        // Sort notifications newest first
        setNotifications(rawNotifs.sort((a, b) => new Date(b.time) - new Date(a.time)));

      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  // --- SAVE HANDLERS ---
  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (activeTab === 'General') {
        const res = await axios.put(`${API_BASE_URL}/auth/profile/update`, profile, { headers });
        if (res.data.success) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          showToast("Profile updated successfully!", "success");
        }

      } else if (activeTab === 'AI Config') {
        const res = await axios.put(`${API_BASE_URL}/auth/admin/settings`, settings, { headers });
        if (res.data.success) showToast("Marketplace settings updated!", "success");

      } else if (activeTab === 'Security') {
        if (!passwords.currentPassword || !passwords.newPassword) {
          showToast("Please fill in both current and new passwords.", "error");
          setIsSaving(false);
          return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
          showToast("New passwords do not match!", "error");
          setIsSaving(false);
          return;
        }

        const res = await axios.post(`${API_BASE_URL}/auth/change-password`, {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        }, { headers });

        if (res.data.success) {
          showToast("Password changed successfully!", "success");
          setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast(error.response?.data?.message || "Failed to save changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'General', label: 'General & Profile', icon: User },
    { id: 'AI Config', label: 'Configuration', icon: BrainCircuit },
    { id: 'Notifications', label: 'Notification History', icon: Bell },
    { id: 'Security', label: 'Security', icon: Shield },
  ];

  // Logic for slicing the notifications
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const currentNotifs = notifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return (
      <AdminLayout title="Settings">
        <div className="h-[60vh] flex items-center justify-center text-slate-400">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      
      {/* TOAST NOTIFICATION UI */}
      {toast.visible && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white transform transition-all duration-300 translate-y-0 opacity-100 ${toast.type === 'success' ? 'bg-teal-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] max-w-6xl">
        
        {/* 1. SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1); // Reset page when changing tabs
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="mb-8 border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
             <div>
                <h2 className="text-xl font-bold text-slate-800">{activeTab} Settings</h2>
                <p className="text-slate-500 text-sm mt-1">
                  {activeTab === 'Notifications' ? 'View all recent system alerts.' : `Manage your ${activeTab.toLowerCase()} preferences here.`}
                </p>
             </div>
             {/* Hide save button on notifications tab */}
             {activeTab !== 'Notifications' && (
               <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
                    isSaving ? 'bg-slate-400 text-white cursor-not-allowed shadow-none' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-200 hover:-translate-y-0.5'
                  }`}
               >
                  {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
               </button>
             )}
          </div>

          {/* TAB CONTENT */}
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 flex-1 overflow-y-auto pr-2 pb-10">
            
            {/* --- GENERAL TAB --- */}
            {activeTab === 'General' && (
              <Section title="Admin Profile" description="Update your public profile details.">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden">
                            <img 
                              src={profile.profilePic || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=0D9488&color=fff`} 
                              alt="Profile" 
                              className="w-full h-full object-cover" 
                            />
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full hover:bg-teal-600 transition-colors shadow-md cursor-not-allowed" title="Avatar upload coming soon">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-lg font-bold text-slate-900">{profile.firstName} {profile.lastName}</h4>
                        <p className="text-sm text-slate-500">Admin</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="First Name" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} />
                    <InputGroup label="Last Name" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} />
                    <InputGroup label="Email Address (Read Only)" value={profile.email} type="email" disabled />
                    <InputGroup label="Phone Number" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Bio</label>
                      <textarea 
                        rows="3"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                        value={profile.bio}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                        placeholder="Write a short bio about yourself..."
                      />
                    </div>
                  </div>
              </Section>
            )}

            {/* --- AI CONFIGURATION TAB --- */}
            {activeTab === 'AI Config' && (
              <Section title="Community Controls" description="Manage global features for the mobile app feed.">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                              <p className="font-bold text-slate-900">Enable Marketplace Features</p>
                              <p className="text-xs text-slate-500">Allows mobile users to toggle "List for sale" and view prices.</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.marketplaceEnabled}
                          onChange={() => setSettings({...settings, marketplaceEnabled: !settings.marketplaceEnabled})}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>
                  </div>
              </Section>
            )}

            {/* --- NOTIFICATIONS TAB (FULL HISTORY WITH PAGINATION) --- */}
            {activeTab === 'Notifications' && (
              <div className="flex flex-col h-full">
                <div className="space-y-4 flex-1">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <CheckCircle className="w-10 h-10 text-teal-200 mb-3" />
                      <p className="font-bold text-slate-600">No Notifications</p>
                      <p className="text-sm mt-1">You are all caught up on system alerts.</p>
                    </div>
                  ) : (
                    currentNotifs.map((notif) => (
                      <div key={notif.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm bg-slate-100">
                          {notif.type === 'user' && <UserPlus className="w-5 h-5 text-blue-600" />}
                          {notif.type === 'moderation' && <ShieldAlert className="w-5 h-5 text-orange-600" />}
                          {notif.type === 'chatbot' && <MessageSquare className="w-5 h-5 text-purple-600" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{notif.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-2 font-medium">
                            {new Date(notif.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* PAGINATION CONTROLS */}
                {notifications.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-100">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <span className="text-sm font-bold text-slate-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- SECURITY TAB --- */}
            {activeTab === 'Security' && (
              <Section title="Change Password" description="Update your admin login credentials.">
                  <div className="grid grid-cols-1 gap-5 max-w-md bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <InputGroup 
                        label="Current Password" 
                        type="password" 
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                        isPasswordToggleable={true}
                      />
                      <InputGroup 
                        label="New Password" 
                        type="password" 
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        isPasswordToggleable={true}
                      />
                      <InputGroup 
                        label="Confirm New Password" 
                        type="password" 
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        isPasswordToggleable={true}
                      />
                  </div>
              </Section>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// --- SUB-COMPONENTS ---

const Section = ({ title, description, children }) => (
    <div className="mb-6">
        <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        {children}
    </div>
);

const InputGroup = ({ label, type = "text", value, onChange, disabled, isPasswordToggleable }) => {
    const [showPassword, setShowPassword] = useState(false);
    
    // Determine the actual type of the input
    const inputType = isPasswordToggleable ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="flex flex-col gap-1.5 relative">
          <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
          <div className="relative">
              <input 
                  type={inputType} 
                  value={value}
                  onChange={onChange}
                  disabled={disabled}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-500 transition-all ${
                    disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
                  } ${isPasswordToggleable ? 'pr-12' : ''}`}
              />
              {/* EYE ICON TOGGLE */}
              {isPasswordToggleable && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              )}
          </div>
      </div>
    );
};

export default Settings;