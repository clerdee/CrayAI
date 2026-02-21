import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Save, Loader, Phone, Globe, Mail, 
  User, MapPin, AlignLeft, Camera 
} from 'lucide-react';
import client from '../../api/client';

const EditProfileModal = ({ isOpen, onClose, user, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '', // Read-only
    phone: '',
    country: '',
    street: '',
    city: '',
    bio: '',
    profilePic: ''
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '', 
        phone: user.phone || '',
        country: user.country || '',
        street: user.street || '',
        city: user.city || '',
        bio: user.bio || '',
        profilePic: user.profilePic || ''
      });
    }
  }, [user]);

  // Handle image upload and update the URL state
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate upload or handle actual upload logic here
    // For now, we create a preview URL to update the read-only input
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profilePic: reader.result }));
    };
    reader.readAsDataURL(file);

    // If you have a direct upload to Cloudinary/S3, do it here and 
    // update profilePic with the returned secure_url
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { email, ...updateData } = formData;
      
      const res = await client.put('/auth/profile/update', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        onProfileUpdated(res.data.user);
        onClose();
      }
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#293241]/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-sm font-black text-[#293241] uppercase tracking-widest">Update Profile Settings</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-[#E76F51] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex flex-col gap-6">
          
          {/* Profile Image Column */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="relative group">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full overflow-hidden bg-[#E0FBFC] border-4 border-[#F4F7F9] cursor-pointer relative"
              >
                {formData.profilePic ? (
                  <img src={formData.profilePic} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-6 text-[#3D5A80]" />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white w-6 h-6" />
                </div>
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-[#3D5A80] text-white rounded-full hover:bg-[#293241] transition-all shadow-lg"
              >
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="w-full">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 mb-2">
                <Camera className="w-3 h-3" /> Profile Picture URL (Read-Only)
              </label>
              <input 
                type="text" 
                value={formData.profilePic}
                readOnly
                placeholder="Upload an image to update URL..."
                className="w-full p-4 bg-[#F8FAFB] rounded-2xl outline-none text-[12px] font-bold border border-slate-100 text-slate-400 cursor-not-allowed italic overflow-hidden text-ellipsis"
              />
            </div>
          </div>

          {/* Names Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                <User className="w-3 h-3" /> First Name
              </label>
              <input 
                type="text" 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full p-4 bg-[#F4F7F9] rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-[#3D5A80]/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                <User className="w-3 h-3" /> Last Name
              </label>
              <input 
                type="text" 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full p-4 bg-[#F4F7F9] rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-[#3D5A80]/10"
              />
            </div>
          </div>

          {/* Email (READ ONLY) & Phone Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Address (Locked)
              </label>
              <input 
                type="email" 
                value={formData.email}
                readOnly
                className="w-full p-4 bg-[#F8FAFB] text-slate-400 rounded-2xl outline-none text-sm font-bold cursor-not-allowed border border-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                <Phone className="w-3 h-3" /> Mobile Number
              </label>
              <input 
                type="text" 
                value={formData.phone}
                placeholder="+63 944 751 2503"
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-4 bg-[#F4F7F9] rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-[#3D5A80]/10"
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Street
              </label>
              <input 
                type="text" 
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                className="w-full p-4 bg-[#F4F7F9] rounded-2xl outline-none text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                <MapPin className="w-3 h-3" /> City
              </label>
              <input 
                type="text" 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full p-4 bg-[#F4F7F9] rounded-2xl outline-none text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                <Globe className="w-3 h-3" /> Country
              </label>
              <input 
                type="text" 
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full p-4 bg-[#F4F7F9] rounded-2xl outline-none text-sm font-bold"
              />
            </div>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
              <AlignLeft className="w-3 h-3" /> Professional Bio
            </label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full p-4 bg-[#F4F7F9] rounded-2xl outline-none text-sm font-bold min-h-[100px] resize-none focus:ring-2 focus:ring-[#3D5A80]/10"
            />
          </div>

          {/* Action Button */}
          <div className="pt-4 sticky bottom-0 bg-white">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-[#3D5A80] hover:bg-[#293241] text-white font-black uppercase tracking-widest rounded-2xl transition-all flex justify-center items-center gap-3 shadow-xl active:scale-[0.98]"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Confirm & Save Changes</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;