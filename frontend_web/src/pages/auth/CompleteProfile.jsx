import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PH_CITIES } from '../../data/cities'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MOBILE_REGEX = /^9\d{9}$/;

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null); 
  
  const [mobileNumber, setMobileNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!MOBILE_REGEX.test(mobileNumber)) {
      return showToast("Mobile Number must be 10 digits and start with 9.", "error");
    }
    if (streetAddress.trim().length <= 5) {
      return showToast("Street Address must be more than 5 characters.", "error");
    }
    if (!city) {
      return showToast("Please select a City.", "error");
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_BASE_URL}/auth/profile/update`, 
        {
          phone: `+63${mobileNumber}`,
          street: streetAddress,
          city: city,
          country: 'Philippines'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        showToast("Profile completed! Please login...", "success");
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; 

  return (
    <div className="min-h-screen w-full bg-[#F6F9FC] flex items-center justify-center p-4 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* TOAST */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-white border-teal-100 text-teal-800' : 'bg-white border-red-100 text-red-800'}`}>
            <span className="font-bold text-sm">{toast.message}</span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-10 max-w-2xl w-full shadow-xl border border-slate-100 flex flex-col md:flex-row gap-10">
        
        {/* LEFT CONTAINER: Read-Only Social Info */}
        <div className="md:w-1/3 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-10">
          <div className="relative mb-4">
             <img 
               src={user.profilePic || 'https://via.placeholder.com/150'} 
               alt="Profile" 
               className="w-24 h-24 rounded-full object-cover border-4 border-teal-50 shadow-sm"
             />
             <div className="absolute bottom-0 right-0 bg-teal-500 text-white p-1 rounded-full text-[10px]">
               {user.provider?.includes('google') ? 'G' : 'GH'}
             </div>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{user.firstName} {user.lastName}</h2>
          <p className="text-xs text-slate-500 break-all">{user.email}</p>
          <div className="mt-4 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Account</span>
          </div>
        </div>

        {/* RIGHT CONTAINER: Editable Fields */}
        <div className="md:w-2/3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Complete Your Profile</h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            We've synced your account. Just add your contact details to finish.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">Mobile Number</label>
                <span className="absolute bottom-[13px] left-0 pl-4 flex items-center text-slate-500 font-bold text-sm border-r border-slate-300 pr-2 pointer-events-none">+63</span>
                <input type="tel" required maxLength="10" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-16 pr-4 font-medium text-slate-900 focus:outline-none focus:border-teal-500 transition-all" placeholder="9XX XXX XXXX" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">Street Address</label>
              <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-900 focus:outline-none focus:border-teal-500 transition-all" placeholder="Lot, Block, Street..." value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">City</label>
                  <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-900 cursor-pointer focus:outline-none focus:border-teal-500 transition-all" value={city} onChange={(e) => setCity(e.target.value)}>
                    <option value="" disabled>Select City</option>
                    {PH_CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold text-sm rounded-xl py-4 mt-4 hover:bg-teal-600 hover:shadow-lg transition-all disabled:opacity-70">
              {loading ? 'Saving details...' : 'Finalize Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;