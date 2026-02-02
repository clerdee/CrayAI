import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  Search, Users, BadgeCheck, Shield, Eye, Ban, 
  Loader, ShieldCheck, AlertTriangle, X, UserX, Trash2,
  CheckCircle, XCircle 
} from 'lucide-react';
import UserDetailsModal from './UserDetailsModal'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const UserManagement = () => {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- NOTIFICATION STATE ---
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // --- MODAL STATES ---
  const [selectedUser, setSelectedUser] = useState(null);      // View Details
  const [promotingUser, setPromotingUser] = useState(null);    // Make Admin
  const [deactivatingUser, setDeactivatingUser] = useState(null); // Deactivate
  const [deletingUser, setDeletingUser] = useState(null);      // Delete

  // --- HELPER: SHOW TOAST ---
  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
    }, 3000); // Auto-hide after 3 seconds
  };

  // --- 1. FETCH USERS FROM API ---
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/auth/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showToast("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- 2. PROMOTE TO ADMIN ACTION ---
  const confirmPromotion = async () => {
    if (!promotingUser) return;

    try {
      const token = localStorage.getItem('token');
      // Backend API Call Placeholder:
      // await axios.put(`${API_BASE_URL}/auth/admin/users/${promotingUser._id}/make-admin`, {}, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      // Optimistic Update
      setUsers(users.map(u => 
        u._id === promotingUser._id ? { ...u, role: 'admin' } : u
      ));

      setPromotingUser(null); 
      showToast(`${promotingUser.firstName} is now an Admin!`, 'success');

    } catch (error) {
      console.error(error);
      showToast("Failed to promote user.", "error");
    }
  };

  // --- 3. DEACTIVATE USER ACTION ---
  const confirmDeactivation = async () => {
    if (!deactivatingUser) return;
    try {
      const token = localStorage.getItem('token');
      // Backend API Call Placeholder:
      // await axios.put(`${API_BASE_URL}/auth/admin/users/${deactivatingUser._id}/status`, { status: 'Inactive' }, { 
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      setUsers(users.map(u => 
        u._id === deactivatingUser._id ? { ...u, accountStatus: 'Inactive' } : u
      ));

      setDeactivatingUser(null); 
      showToast("User account deactivated.", "success");

    } catch (error) {
      console.error(error);
      showToast("Failed to deactivate user.", "error");
    }
  };

  // --- 4. DELETE USER ACTION ---
  const confirmDelete = async () => {
    if (!deletingUser) return;

    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE_URL}/auth/admin/users/${deletingUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(users.filter(u => u._id !== deletingUser._id));
      setDeletingUser(null);
      showToast("User deleted permanently.", "success");

    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Failed to delete user.";
      showToast(errorMsg, "error");
    }
  };

  // --- HELPERS ---
  const getInitials = (first, last) => {
    const f = first ? first[0] : '';
    const l = last ? last[0] : '';
    return (f + l).toUpperCase() || 'U';
  };

  const totalUsers = users.length;
  const totalVerified = users.filter(u => u.isVerified).length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  if (loading) {
    return (
        <AdminLayout title="User Management">
            <div className="h-[600px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Loader className="w-8 h-8 animate-spin text-teal-600" />
                    <span className="text-sm font-bold">Loading Users...</span>
                </div>
            </div>
        </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management">
      
      {/* 1. STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Users className="w-6 h-6" /></div>
            <div><p className="text-slate-500 text-xs font-bold uppercase">Total Users</p><h4 className="text-2xl font-bold text-slate-800">{totalUsers}</h4></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600"><BadgeCheck className="w-6 h-6" /></div>
            <div><p className="text-slate-500 text-xs font-bold uppercase">Total Verified Users</p><h4 className="text-2xl font-bold text-slate-800">{totalVerified}</h4></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Shield className="w-6 h-6" /></div>
            <div><p className="text-slate-500 text-xs font-bold uppercase">Total Admins</p><h4 className="text-2xl font-bold text-slate-800">{totalAdmins}</h4></div>
        </div>
      </div>

      {/* 2. MAIN TABLE AREA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* User Table */}
        <div className="overflow-visible flex-1">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold">
                        <th className="p-6 pl-8">User Profile</th>
                        <th className="p-6">Role</th>
                        <th className="p-6">Status / Verified</th>
                        <th className="p-6 text-right pr-8">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
                            
                            {/* Profile Column */}
                            <td className="p-6 pl-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                        {user.profilePic ? (
                                            <img src={user.profilePic} alt={user.firstName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-sm">
                                                {getInitials(user.firstName, user.lastName)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                            </td>

                            {/* Role Column */}
                            <td className="p-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                    user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                    'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                    {user.role}
                                </span>
                            </td>

                            {/* Status Column */}
                            <td className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${user.accountStatus === 'Active' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                        <span className={`text-sm font-medium ${user.accountStatus === 'Active' ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {user.accountStatus || 'Inactive'}
                                        </span>
                                    </div>
                                    {user.isVerified && (
                                        <div className="flex items-center gap-1 bg-teal-50 border border-teal-100 text-teal-700 px-2 py-0.5 rounded-md" title="Verified User">
                                            <BadgeCheck className="w-3.5 h-3.5 fill-teal-100" />
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Verified</span>
                                        </div>
                                    )}
                                </div>
                            </td>

                            {/* Actions Column */}
                            <td className="p-6 pr-8 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    
                                    {user.role !== 'admin' && (
                                        <button 
                                            onClick={() => setPromotingUser(user)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors tooltip"
                                            title="Promote to Admin"
                                        >
                                            <ShieldCheck className="w-5 h-5" />
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => setSelectedUser(user)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors tooltip"
                                        title="View Details"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>

                                    <button 
                                        onClick={() => setDeactivatingUser(user)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors tooltip"
                                        title="Deactivate Account"
                                    >
                                        <Ban className="w-5 h-5" />
                                    </button>

                                    <button 
                                        onClick={() => setDeletingUser(user)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors tooltip"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>

                                </div>
                            </td>

                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" className="p-8 text-center text-slate-400">
                                No users found matching your search.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MODAL 1: VIEW DETAILS --- */}
      <UserDetailsModal 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
        onDeactivate={() => { 
            setDeactivatingUser(selectedUser);
            setSelectedUser(null);
        }} 
      />

      {/* --- MODAL 2: PROMOTE ADMIN (PURPLE) --- */}
      {promotingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-0 animate-in zoom-in-95 duration-200 flex flex-col">
                
                <div className="relative bg-purple-50 p-8 flex flex-col items-center justify-center border-b border-purple-100">
                    <button onClick={() => setPromotingUser(null)} className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-purple-300 hover:text-purple-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-20 h-20 rounded-full bg-white shadow-xl shadow-purple-200 flex items-center justify-center text-purple-600 mb-4 ring-4 ring-purple-100">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-purple-900 text-center">Grant Admin Access</h3>
                    <p className="text-purple-600/80 text-sm text-center mt-1">Make this user a system administrator?</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-sm">
                             {promotingUser.profilePic ? (
                                <img src={promotingUser.profilePic} alt={promotingUser.firstName} className="w-full h-full object-cover" />
                             ) : (
                                <span>{getInitials(promotingUser.firstName, promotingUser.lastName)}</span>
                             )}
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="font-bold text-slate-900 truncate">{promotingUser.firstName} {promotingUser.lastName}</h4>
                            <p className="text-sm text-slate-500 truncate">{promotingUser.email}</p>
                        </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h5 className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-1">Security Warning</h5>
                            <p className="text-xs text-orange-700 leading-relaxed">
                                This user will gain <strong>full control</strong> over user management, system health, and datasets. This action cannot be easily undone by non-admins.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <button onClick={() => setPromotingUser(null)} className="flex-1 py-3 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button onClick={confirmPromotion} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95">
                        Confirm Access
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 3: DEACTIVATE USER (ORANGE) --- */}
      {deactivatingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-0 animate-in zoom-in-95 duration-200 flex flex-col">
                
                <div className="relative bg-orange-50 p-8 flex flex-col items-center justify-center border-b border-orange-100">
                    <button onClick={() => setDeactivatingUser(null)} className="absolute top-4 right-4 p-2 text-orange-300 hover:text-orange-600 transition-colors"><X className="w-5 h-5" /></button>
                    <div className="w-20 h-20 rounded-full bg-white shadow-xl shadow-orange-100 flex items-center justify-center text-orange-500 mb-4 ring-4 ring-orange-100"><Ban className="w-10 h-10" /></div>
                    <h3 className="text-xl font-bold text-orange-900 text-center">Deactivate Account</h3>
                    <p className="text-orange-600/80 text-sm text-center mt-1">Temporarily suspend access?</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-sm">
                             {deactivatingUser.profilePic ? <img src={deactivatingUser.profilePic} alt="profile" className="w-full h-full object-cover" /> : getInitials(deactivatingUser.firstName, deactivatingUser.lastName)}
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="font-bold text-slate-900 truncate">{deactivatingUser.firstName} {deactivatingUser.lastName}</h4>
                            <p className="text-sm text-slate-500 truncate">{deactivatingUser.email}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 flex gap-3 items-start border border-slate-100">
                        <AlertTriangle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Deactivating this account will prevent the user from logging in and performing any scans. You can reactivate them later from the system settings.
                        </p>
                    </div>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <button onClick={() => setDeactivatingUser(null)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                    <button onClick={confirmDeactivation} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200">Deactivate</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 4: DELETE PERMANENTLY (RED) --- */}
      {deletingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-0 animate-in zoom-in-95 duration-200 flex flex-col">
                
                <div className="relative bg-red-50 p-8 flex flex-col items-center justify-center border-b border-red-100">
                    <button onClick={() => setDeletingUser(null)} className="absolute top-4 right-4 p-2 text-red-300 hover:text-red-600 transition-colors"><X className="w-5 h-5" /></button>
                    <div className="w-20 h-20 rounded-full bg-white shadow-xl shadow-red-100 flex items-center justify-center text-red-600 mb-4 ring-4 ring-red-100"><Trash2 className="w-10 h-10" /></div>
                    <h3 className="text-xl font-bold text-red-900 text-center">Delete Permanently</h3>
                    <p className="text-red-600/80 text-sm text-center mt-1">Remove user and all data?</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-red-50 rounded-xl p-4 flex gap-3 items-start border border-red-100">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 leading-relaxed font-bold">
                            Warning: This action is irreversible. The user profile and all associated data will be wiped from the database.
                        </p>
                    </div>
                    <p className="text-sm text-center text-slate-500">Deleting: <span className="font-bold text-slate-900">{deletingUser.email}</span></p>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <button onClick={() => setDeletingUser(null)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200">Delete Permanently</button>
                </div>
            </div>
        </div>
      )}

      {/* --- GLOBAL TOAST NOTIFICATION --- */}
      <div className={`fixed bottom-6 right-6 z-[150] transition-all duration-300 transform ${notification.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
            notification.type === 'success' 
            ? 'bg-white border-teal-100 text-teal-800' 
            : 'bg-white border-red-100 text-red-800'
        }`}>
            {notification.type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-teal-500" />
            ) : (
                <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div>
                <h4 className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                <p className="text-xs opacity-80">{notification.message}</p>
            </div>
        </div>
      </div>

    </AdminLayout>
  );
};

export default UserManagement;