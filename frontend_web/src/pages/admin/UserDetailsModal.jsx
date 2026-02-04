import React from 'react';
import { 
  X, BadgeCheck, Phone, MapPin, User, Hash, 
  Ban, CheckCircle, AlertTriangle, Shield, Clock
} from 'lucide-react';

const UserDetailsModal = ({ user, onClose, onDeactivate, onReactivate }) => {
  if (!user) return null;

  // Helper: Format Date (e.g., "Jan 28, 2026")
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
            <div className="p-8 pt-2 overflow-y-auto space-y-8">
                
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

                {/* --- Suspension Reason Alert --- */}
                {user.accountStatus === 'Inactive' && (
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-4 items-start animate-in slide-in-from-top-2 duration-300">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-1">Account Suspended</h4>
                            <p className="text-sm text-orange-900 font-medium leading-relaxed">
                                Reason: <span className="font-bold underline decoration-orange-300">{user.deactivationReason || 'No specific reason provided.'}</span>
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
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Member Since</p>
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
            </div>

            {/* 3. Footer Actions (Synced with Parent Logic) */}
            {/* <div className="p-8 pt-4 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <button onClick={onClose} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white rounded-2xl border border-slate-200">
                    Close Details
                </button>
                
                {user.accountStatus === 'Active' ? (
                     <button 
                        onClick={() => { onDeactivate(user); onClose(); }} 
                        className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                    >
                        <Ban className="w-4 h-4" /> Deactivate
                    </button>
                ) : (
                    <button 
                        onClick={() => { onReactivate(user); onClose(); }} 
                        className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" /> Reactivate
                    </button>
                )}
            </div> */}
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
        <div className="overflow-hidden">
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