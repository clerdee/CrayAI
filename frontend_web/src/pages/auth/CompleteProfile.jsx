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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city || mobileNumber.length < 10 || streetAddress.length < 5) {
      alert("Please fill all fields correctly.");
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = previewImage;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        const uploadRes = await fetch(CLOUDINARY_CONFIG.apiUrl, { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.secure_url;
      }

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

      const response = await axios.post(`${API_BASE_URL}/auth/social-finalize`, finalPayload);

      if (response.data.success) {
        // 4. Clean up and Log in
        localStorage.removeItem('tempSocialData');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Finalization Error:", error);
      alert(error.response?.data?.message || "Failed to complete profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!tempData) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Almost there!</h1>
          <p className="text-slate-500">We just need a few more details to set up your account for <b>{tempData.email}</b></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture Circle */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer">
              <input type="file" className="hidden" onChange={handleImageChange} />
              <div className="w-24 h-24 rounded-full border-4 border-teal-500 overflow-hidden bg-slate-100">
                {previewImage ? <img src={previewImage} className="w-full h-full object-cover" alt="Profile" /> : <div className="h-full flex items-center justify-center text-3xl">👤</div>}
              </div>
              <div className="absolute bottom-0 right-0 bg-teal-600 text-white p-1 rounded-full text-xs">Edit</div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mobile Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+63</span>
              <input 
                type="tel" 
                maxLength="10" 
                className="w-full pl-12 pr-4 py-3 border rounded-xl outline-teal-500" 
                placeholder="9123456789"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Street Address</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border rounded-xl outline-teal-500" 
              placeholder="House No., Street Name, Brgy"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
            <select 
              className="w-full px-4 py-3 border rounded-xl outline-teal-500"
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
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-teal-600 transition-all disabled:opacity-50"
          >
            {loading ? "Saving Profile..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;