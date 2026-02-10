import React, { useState } from 'react';
import { 
  X, BadgeCheck, Phone, MapPin, User, Hash, 
  Ban, CheckCircle, AlertTriangle, Shield, Clock
} from 'lucide-react';

const UserDetailsModal = ({ user, onClose, onDeactivate, onReactivate }) => {
  if (!user) return null;

  // Helper: Format Date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper: Get Initials
  const getInitials = () => {
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  };

  const fullName = `${user.firstName} ${user.lastName}`;
  const fullAddress = [user.street, user.city, user.country].filter(Boolean).join(', ');

  // Local state for deactivation reason input
  const [reason, setReason] = useState('');
  const [showDeactivateInput, setShowDeactivateInput] = useState(false);

  const handleDeactivateSubmit = () => {
    if (onDeactivate) {
      onDeactivate(user._id, reason);
      setShowDeactivateInput(false);
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* 1. Header */}
            <div className="flex justify-between items-center p-8 pb-4">
                <h2 className="text-xl font-bold text-slate-900">User Profile</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* 2. Body (Scrollable) */}
            <div className="p-8 pt-2 overflow-y-auto space-y-8 scrollbar-hide">
                
                {/* --- Identity Section --- */}
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
                        {user.profilePic ? (
                            <img src={user.profilePic} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-3xl bg-slate-50">
                                {getInitials()}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {fullName}
                            {user.isVerified && <BadgeCheck className="w-6 h-6 text-teal-500 fill-teal-50" />}
                        </h3>
                        <p className="text-slate-500 font-medium">{user.email}</p>
                        
                        <div className="flex gap-2 mt-3">
                             <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {user.role}
                            </span>
                             <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                user.accountStatus === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                            }`}>
                                {user.accountStatus || 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- SUSPENSION ALERT (Shows Reason) --- */}
                {(user.accountStatus === 'Inactive' || user.accountStatus === 'Deactivated') && (
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-4 items-start animate-in slide-in-from-top-2 duration-300">
                        <div className="p-2 bg-white rounded-xl shadow-sm flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-1">Account Suspended</h4>
                            <p className="text-sm text-orange-900 font-medium leading-relaxed">
                                Reason: <span className="font-bold underline decoration-orange-300">{user.deactivationReason || 'Violation of terms.'}</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* --- Social Stats Row --- */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Followers</p>
                        <p className="text-xl font-bold text-slate-800">{user.followers?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Following</p>
                        <p className="text-xl font-bold text-slate-800">{user.following?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Joined</p>
                        <p className="text-xs font-bold text-slate-800 mt-1.5">{formatDate(user.createdAt)}</p>
                    </div>
                </div>

                {/* --- Detailed Info Grid --- */}
                <div className="grid grid-cols-1 gap-1">
                    <InfoRow icon={<Phone />} label="Phone" value={user.phone || 'Not provided'} mono />
                    <InfoRow icon={<MapPin />} label="Location" value={fullAddress || 'No address provided'} />
                    <InfoRow icon={<User />} label="Bio" value={user.bio} italic />
                    <InfoRow icon={<Hash />} label="System ID" value={user._id} mono small />
                </div>

                {/* --- Action Buttons (Admin Only) --- */}
                <div className="pt-4 border-t border-slate-100">
                    {user.accountStatus === 'Active' ? (
                        !showDeactivateInput ? (
                            <button 
                                onClick={() => setShowDeactivateInput(true)}
                                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Ban className="w-4 h-4" /> Deactivate Account
                            </button>
                        ) : (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                <textarea 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                    placeholder="Reason for deactivation..."
                                    rows="2"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowDeactivateInput(false)}
                                        className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleDeactivateSubmit}
                                        className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg text-sm hover:bg-red-700"
                                    >
                                        Confirm Deactivation
                                    </button>
                                </div>
                            </div>
                        )
                    ) : (
                        <button 
                            onClick={() => onReactivate && onReactivate(user._id)}
                            className="w-full py-3 bg-green-50 hover:bg-green-100 text-green-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" /> Reactivate Account
                        </button>
                    )}
                </div>

            </div>
        </div>
    </div>
  );
};

// --- Helper Component for Rows ---
const InfoRow = ({ icon, label, value, mono, italic, small }) => (
    <div className="flex gap-4 items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
        <div className="text-slate-400 group-hover:text-teal-600 transition-colors">
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <div className="overflow-hidden w-full">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`text-sm font-semibold truncate ${
                mono ? 'font-mono text-slate-600' : 'text-slate-800'
            } ${italic ? 'italic font-normal text-slate-500' : ''} ${small ? 'text-xs' : ''}`}>
                {value || `No ${label} provided`}
            </p>
        </div>
    </div>
);

export default UserDetailsModal;