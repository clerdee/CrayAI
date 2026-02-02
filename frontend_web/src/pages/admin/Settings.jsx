
import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  User, 
  Lock, 
  Bell, 
  BrainCircuit, 
  Save, 
  Globe, 
  Shield, 
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Camera,
  Mail
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(false);

  // Mock Save Handler
  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  const tabs = [
    { id: 'General', label: 'General & Profile', icon: User },
    { id: 'AI Config', label: 'AI Configuration', icon: BrainCircuit },
    { id: 'Notifications', label: 'Notifications', icon: Bell },
    { id: 'Security', label: 'Security', icon: Shield },
  ];

  return (
    <AdminLayout title="Settings">
      
      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
        
        {/* 1. SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
          
          {/* Header */}
          <div className="mb-8 border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
                <h2 className="text-xl font-bold text-slate-800">{activeTab} Settings</h2>
                <p className="text-slate-500 text-sm mt-1">Manage your {activeTab.toLowerCase()} preferences here.</p>
             </div>
             <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
             </button>
          </div>

          {/* TAB CONTENT */}
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* --- GENERAL TAB --- */}
            {activeTab === 'General' && (
              <>
                {/* Profile Section */}
                <Section title="Admin Profile" description="Update your public profile details.">
                   <div className="flex items-center gap-6 mb-8">
                      <div className="relative group">
                          <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden">
                              <img 
                                src="https://res.cloudinary.com/dvdrak5wl/image/upload/v1769603436/tmwgzaxe" 
                                alt="Profile" 
                                className="w-full h-full object-cover" 
                                onError={(e) => {e.target.src = 'https://ui-avatars.com/api/?name=Salve+Hipos&background=0D9488&color=fff'}}
                              />
                          </div>
                          <button className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full hover:bg-teal-600 transition-colors shadow-md">
                              <Camera className="w-4 h-4" />
                          </button>
                      </div>
                      <div className="space-y-1">
                          <h4 className="text-lg font-bold text-slate-900">Salve Hipos</h4>
                          <p className="text-sm text-slate-500">Super Admin • Iligan, Philippines</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputGroup label="First Name" defaultValue="Salve" />
                      <InputGroup label="Last Name" defaultValue="Hipos" />
                      <InputGroup label="Email Address" defaultValue="hipos@gmail.com" type="email" />
                      <InputGroup label="Phone Number" defaultValue="09443152688" />
                      <div className="md:col-span-2">
                        <InputGroup label="Bio" defaultValue="CrayAI Administrator" />
                      </div>
                   </div>
                </Section>

                <hr className="border-slate-100" />

                {/* System Mode */}
                <Section title="System Maintenance" description="Control global access to the application.">
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                              <Globe className="w-5 h-5" />
                          </div>
                          <div>
                              <p className="font-bold text-slate-900">Maintenance Mode</p>
                              <p className="text-xs text-slate-500">Disconnects all users except admins.</p>
                          </div>
                      </div>
                      <ToggleSwitch />
                   </div>
                </Section>
              </>
            )}

            {/* --- AI CONFIGURATION TAB --- */}
            {activeTab === 'AI Config' && (
              <>
                <Section title="Confidence Thresholds" description="Set the strictness of the AI model.">
                   <div className="space-y-6">
                      
                      {/* Threshold Slider */}
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex justify-between mb-2">
                             <label className="font-bold text-slate-700 text-sm">Auto-Verify Score</label>
                             <span className="font-bold text-teal-600">95%</span>
                          </div>
                          <input type="range" className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                          <p className="text-xs text-slate-500 mt-2">
                              Scans with confidence scores above <strong>95%</strong> will be automatically marked as "Verified".
                          </p>
                      </div>

                      {/* Flagging Rules */}
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex justify-between mb-2">
                             <label className="font-bold text-slate-700 text-sm">Low Confidence Flag</label>
                             <span className="font-bold text-red-500">&lt; 60%</span>
                          </div>
                          <input type="range" className="w-full accent-red-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                          <p className="text-xs text-slate-500 mt-2">
                              Scans below <strong>60%</strong> will be flagged as "Unverified" for human review.
                          </p>
                      </div>

                   </div>
                </Section>

                <Section title="Dataset Contribution" description="Rules for adding user data to training sets.">
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Auto-Add High Confidence Scans</p>
                            <p className="text-xs text-slate-500">Add 99%+ confidence images to pending dataset.</p>
                        </div>
                        <ToggleSwitch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Retain Metadata</p>
                            <p className="text-xs text-slate-500">Keep location data attached to training images.</p>
                        </div>
                        <ToggleSwitch />
                    </div>
                </Section>
              </>
            )}

            {/* --- NOTIFICATIONS TAB --- */}
            {activeTab === 'Notifications' && (
              <Section title="Email Alerts" description="Choose what updates you want to receive via email.">
                 <div className="space-y-4">
                    <NotificationItem 
                        icon={Mail}
                        label="New Disease Detected (High Priority)" 
                        description="Get emailed immediately when Shell Disease is found." 
                        defaultChecked 
                    />
                    <NotificationItem 
                        icon={User}
                        label="New User Registration" 
                        description="When a new researcher joins the platform." 
                    />
                    <NotificationItem 
                        icon={Shield}
                        label="System Downtime Alert" 
                        description="If API or Database goes offline." 
                        defaultChecked 
                    />
                    <NotificationItem 
                        icon={Bell}
                        label="Weekly Summary Report" 
                        description="Receive a PDF summary every Monday." 
                    />
                 </div>
              </Section>
            )}

            {/* --- SECURITY TAB --- */}
            {activeTab === 'Security' && (
              <>
                 <Section title="Change Password" description="Update your login credentials.">
                    <div className="grid grid-cols-1 gap-4 max-w-md">
                        <InputGroup label="Current Password" type="password" />
                        <InputGroup label="New Password" type="password" />
                        <InputGroup label="Confirm New Password" type="password" />
                    </div>
                 </Section>

                 <hr className="border-slate-100" />

                 <Section title="Two-Factor Authentication" description="Add an extra layer of security.">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                              <p className="font-bold text-slate-900">Authenticator App</p>
                              <p className="text-xs text-slate-500">Use Google Authenticator or Authy.</p>
                          </div>
                      </div>
                      <button className="text-sm font-bold text-teal-600 border border-teal-100 bg-white px-4 py-2 rounded-lg hover:bg-teal-50">
                          Setup
                      </button>
                   </div>
                 </Section>
              </>
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
        <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        {children}
    </div>
);

const InputGroup = ({ label, type = "text", defaultValue }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
        <input 
            type={type} 
            defaultValue={defaultValue}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
        />
    </div>
);

const ToggleSwitch = ({ defaultChecked }) => {
    const [checked, setChecked] = useState(defaultChecked || false);
    return (
        <button onClick={() => setChecked(!checked)} className={`transition-colors duration-200 ${checked ? 'text-teal-600' : 'text-slate-300'}`}>
            {checked ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
        </button>
    );
};

const NotificationItem = ({ icon: Icon, label, description, defaultChecked }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <Icon className="w-4 h-4" />
             </div>
             <div>
                <p className="font-bold text-slate-800 text-sm">{label}</p>
                <p className="text-xs text-slate-500">{description}</p>
             </div>
        </div>
        <ToggleSwitch defaultChecked={defaultChecked} />
    </div>
);

export default Settings;