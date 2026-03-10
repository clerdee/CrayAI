import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PH_CITIES } from '../../data/cities'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MOBILE_REGEX = /^9\d{9}$/;

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
        `${API_BASE_URL}/auth/profile`, 
        {
          phone: `+63${mobileNumber}`,
          street: streetAddress,
          city: city,
          country: 'Philippines'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update local storage with the complete user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        showToast("Profile completed! Redirecting...", "success");
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F9FC] flex items-center justify-center p-4 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* TOAST */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-white border-teal-100 text-teal-800' : 'bg-white border-red-100 text-red-800'}`}>
            <span className="font-bold text-sm">{toast.message}</span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-12 max-w-lg w-full shadow-xl border border-slate-100 relative overflow-hidden">
        {/* Decorative Background Blob */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-50 rounded-full blur-3xl opacity-60"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-2xl mb-6 border border-teal-100">🦞</div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Almost there!</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Since you signed in with a social account, we just need a few details about your location to sync your field data properly.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            
            <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">Mobile Number</label>
                <span className="absolute bottom-[13px] left-0 pl-4 flex items-center text-slate-500 font-bold text-sm border-r border-slate-300 pr-2 pointer-events-none">+63</span>
                <input type="tel" required maxLength="10" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-16 pr-4 font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all" placeholder="9XX XXX XXXX" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">Street Address</label>
              <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all" placeholder="Lot, Block, Street Name..." value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">City</label>
                  <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-900 cursor-pointer focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all" value={city} onChange={(e) => setCity(e.target.value)}>
                    <option value="" disabled>Select City</option>
                    {PH_CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">Country</label>
                  <input type="text" className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-500 cursor-not-allowed" value="Philippines" readOnly />
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold text-sm rounded-xl py-4 mt-4 hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-70 disabled:hover:bg-slate-900">
              {loading ? 'Saving details...' : 'Complete Profile'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;