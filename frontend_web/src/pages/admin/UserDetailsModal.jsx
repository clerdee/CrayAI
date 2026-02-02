import React from 'react';
import { X, BadgeCheck, Phone, MapPin, Globe, User, Calendar, Users, Hash } from 'lucide-react';

const UserDetailsModal = ({ user, onClose, onDeactivate }) => {
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

  // Helper: Get Full Name
  const fullName = `${user.firstName} ${user.lastName}`;

  // Helper: Get Address
  const fullAddress = [user.street, user.city, user.country].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* 1. Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">User Profile</h2>
                <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* 2. Body (Scrollable) */}
            <div className="p-6 overflow-y-auto">
                
                {/* --- Identity Section --- */}
                <div className="flex items-center gap-5 mb-6">
                    {/* Profile Picture */}
                    <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
                        {user.profilePic ? (
                            <img src={user.profilePic} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl">
                                {getInitials()}
                            </div>
                        )}
                    </div>
                    
                    {/* Name & Badges */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            {fullName}
                            {user.isVerified && <BadgeCheck className="w-6 h-6 text-teal-500 fill-teal-50" />}
                        </h3>
                        <p className="text-slate-500 font-medium">{user.email}</p>
                        <div className="flex gap-2 mt-2">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {user.role}
                            </span>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                user.accountStatus === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                                {user.accountStatus}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- Social Stats Row --- */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase">Followers</p>
                        <p className="text-lg font-bold text-slate-800">{user.followers?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase">Following</p>
                        <p className="text-lg font-bold text-slate-800">{user.following?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase">Joined</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">{formatDate(user.createdAt)}</p>
                    </div>
                </div>

                {/* --- Details Grid --- */}
                <div className="space-y-4">
                    
                    {/* Contact Info */}
                    <div className="flex gap-4 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Phone Number</p>
                            <p className="text-sm font-medium text-slate-900 font-mono">
                                {user.phone || 'Not provided'}
                            </p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex gap-4 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Location</p>
                            <p className="text-sm font-medium text-slate-900">
                                {fullAddress || 'No address provided'}
                            </p>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="flex gap-4 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <User className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Bio</p>
                            {user.bio ? (
                                <p className="text-sm text-slate-700 italic leading-relaxed">"{user.bio}"</p>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No bio available.</p>
                            )}
                        </div>
                    </div>

                    {/* System ID (Optional, usually good for admins) */}
                    <div className="flex gap-4 items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <Hash className="w-5 h-5 text-slate-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">User ID</p>
                            <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">
                                {user._id}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 mt-auto">
                <button onClick={onClose} className="flex-1 py-2.5 font-bold text-slate-600 hover:text-slate-900 transition-colors">
                    Close
                </button>
                {user.accountStatus === 'Active' ? (
                     <button 
                        onClick={() => { onDeactivate(user._id); onClose(); }} 
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        Deactivate User
                    </button>
                ) : (
                    <button 
                        onClick={() => { alert('Activated!'); onClose(); }} 
                        className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                    >
                        Activate User
                    </button>
                )}
            </div>

        </div>
    </div>
  );
};

export default UserDetailsModal;