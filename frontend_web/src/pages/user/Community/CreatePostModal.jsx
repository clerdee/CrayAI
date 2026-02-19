import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Tag, Loader } from 'lucide-react';
import client from '../../../api/client';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isForSale, setIsForSale] = useState(false);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Helper to convert image to Base64 so the backend can accept it as a string URI
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Convert the image to a string format if it exists
      let mediaArray = [];
      if (image) {
        const base64String = await convertToBase64(image);
        // Matches the exact backend schema: { uri: String, mediaType: String }
        mediaArray = [{ uri: base64String, mediaType: image.type }];
      }

      // 2. Create the exact JSON payload your backend postController expects
      const payload = {
        content: content,
        media: mediaArray,
        isForSale: isForSale,
        price: isForSale ? Number(price) : 0
      };

      // 3. Send as standard JSON (Removed FormData)
      const res = await client.post('/posts/create', payload, {
        headers: { 
          Authorization: `Bearer ${token}`
          // Axios automatically sets Content-Type to application/json
        }
      });

      if (res.data.success) {
        onPostCreated(res.data.post);
        setContent('');
        setImage(null);
        setImagePreview(null);
        setIsForSale(false);
        setPrice('');
        onClose();
      }
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#293241]/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-black text-[#293241] uppercase tracking-[0.2em]">Create Post</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-[#E76F51] bg-white rounded-full shadow-sm transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <textarea
            placeholder="What's on your mind? Share updates, tips, or items for sale..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[120px] p-4 bg-[#F4F7F9] border-transparent rounded-2xl focus:border-[#3D5A80] focus:ring-0 text-sm resize-none outline-none transition-all placeholder:text-slate-400"
          />

          {imagePreview && (
            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center h-48 border border-slate-200 shadow-inner">
              <img src={imagePreview} alt="Preview" className="h-full w-auto object-cover" />
              <button 
                type="button"
                onClick={() => { setImage(null); setImagePreview(null); }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-[#E76F51] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-[#3D5A80] hover:text-[#293241] transition-colors">
                <div className="p-2 bg-[#E0FBFC] rounded-xl"><ImageIcon className="w-5 h-5" /></div>
                <span>Add Media</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-[#0FA958] hover:text-[#0C8A47] transition-colors">
                <input type="checkbox" checked={isForSale} onChange={(e) => setIsForSale(e.target.checked)} className="rounded text-[#0FA958] focus:ring-[#0FA958] w-4 h-4" />
                <Tag className="w-5 h-5" /> For Sale
              </label>
            </div>

            <AnimatePresence>
              {isForSale && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 font-bold">₱</span>
                    <input 
                      type="number" 
                      placeholder="Price" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-20 outline-none text-sm font-bold text-[#293241]"
                      required={isForSale}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            type="submit" 
            disabled={loading || (!content.trim() && !image)}
            className="w-full py-4 bg-[#3D5A80] hover:bg-[#293241] disabled:bg-slate-300 text-white font-black uppercase tracking-widest rounded-2xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-[#3D5A80]/20"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Post to Community'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;