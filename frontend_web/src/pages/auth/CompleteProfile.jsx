import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PH_CITIES } from '../../data/cities';
import { CLOUDINARY_CONFIG } from '../../config/cloudinary';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tempData, setTempData] = useState(null);

  // Custom Toast State (Matching your AuthPage setup)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [mobileNumber, setMobileNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem('tempSocialData');
    if (!savedData) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(savedData);
    setTempData(parsed);

    if (parsed.profilePic) {
      setPreviewImage(parsed.profilePic);
    }
  }, [navigate]);

  // Toast Function (Matching your AuthPage setup)
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations using your custom toast
    if (!city) { showToast("Please select a city.", "error"); return; }
    if (mobileNumber.length < 10) { showToast("Mobile Number must be 10 digits.", "error"); return; }
    if (streetAddress.trim().length < 5) { showToast("Please provide a more detailed address.", "error"); return; }

    setLoading(true);

    try {
      let finalImageUrl = previewImage;

      // 1. Handle Image Upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        const uploadRes = await fetch(CLOUDINARY_CONFIG.apiUrl, { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.secure_url;
      }

      // 2. Prepare Payload (Matching your Backend Model)
      const finalPayload = {
        firebaseUid: tempData.firebaseUid || tempData.uid,
        email: tempData.email,
        firstName: tempData.firstName,
        lastName: tempData.lastName,
        provider: tempData.provider,
        phone: `+63${mobileNumber}`,
        street: streetAddress,
        city: city,
        country: 'Philippines',
        profilePic: finalImageUrl
      };

      // 3. Submit to Backend
      const response = await axios.post(`${API_BASE_URL}/auth/social-finalize`, finalPayload);

      if (response.data.success) {
        showToast("Profile completed successfully!", "success");
        
        localStorage.removeItem('tempSocialData');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Delay navigation so they can see the success toast
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error("Finalization Error:", error);
      const msg = error.response?.data?.message || "Failed to complete profile.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!tempData) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* CUSTOM TOAST (Matching your system) */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-white border-teal-100 text-teal-800' : 'bg-white border-red-100 text-red-800'}`}>
            <span className="font-bold text-sm">{toast.message}</span>
        </div>
      </div>

      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 border border-slate-100 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Almost there!</h1>
          <p className="text-slate-500 text-sm mt-2">We need a few more details for <br/><b className="text-slate-800">{tempData.email}</b></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
              <div className={`w-24 h-24 rounded-full border-4 ${previewImage ? 'border-teal-500' : 'border-slate-100'} overflow-hidden bg-slate-50 shadow-md flex items-center justify-center`}>
                {previewImage ? <img src={previewImage} className="w-full h-full object-cover" alt="Profile" /> : <span className="text-2xl opacity-50">📷</span>}
              </div>
              <div className="absolute bottom-1 right-1 bg-teal-600 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md">+</div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Mobile Number</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm border-r border-slate-200 pr-2">+63</span>
              <input 
                type="tel" 
                maxLength="10" 
                className="w-full pl-16 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium" 
                placeholder="9123456789"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">Street Address</label>
            <input 
              type="text" 
              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium" 
              placeholder="House No., Street Name, Brgy"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">City</label>
            <select 
              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium cursor-pointer"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            >
              <option value="">Select City</option>
              {PH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-teal-600 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-slate-200"
          >
            {loading ? "Saving Details..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;