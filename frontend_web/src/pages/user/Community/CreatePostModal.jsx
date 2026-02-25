import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Tag, Loader } from 'lucide-react';
import client from '../../../api/client';

const CreatePostModal = ({ isOpen, onClose, onPostCreated, initialData }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null); // File Object (for new uploads)
  const [imagePreview, setImagePreview] = useState(null); // URL for display
  const [existingImage, setExistingImage] = useState(null); // String URL (from History)
  
  const [isForSale, setIsForSale] = useState(false);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Populate form when modal opens with initialData
  useEffect(() => {
    if (isOpen && initialData) {
        setContent(initialData.content || '');
        // If image is passed (URL string)
        if (initialData.image) {
            setImagePreview(initialData.image);
            setExistingImage(initialData.image);
        }
    } else if (isOpen && !initialData) {
        // Reset if opened empty
        setContent('');
        setImage(null);
        setImagePreview(null);
        setExistingImage(null);
        setIsForSale(false);
        setPrice('');
    }
  }, [isOpen, initialData]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setExistingImage(null); // Clear existing if new one picked
      setImagePreview(URL.createObjectURL(file));
    }
  };

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
    if (!content.trim() && !image && !existingImage) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let mediaArray = [];
      
      // Case A: New File Uploaded
      if (image) {
        const base64String = await convertToBase64(image);
        mediaArray = [{ uri: base64String, mediaType: image.type }];
      } 
      // Case B: Shared from History (Existing URL)
      else if (existingImage) {
        // We send the URL directly. Backend needs to handle this or we treat it as URI.
        // Assuming your backend/Cloudinary setup handles URLs or you just store it.
        // If your backend strictly uploads to Cloudinary, passing a URL might fail unless handled.
        // However, most image logic treats 'uri' as the source.
        mediaArray = [{ uri: existingImage, mediaType: 'image/jpeg' }]; 
      }

      const payload = {
        content: content,
        media: mediaArray,
        isForSale: isForSale,
        price: isForSale ? Number(price) : 0
      };

      const res = await client.post('/posts/create', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        onPostCreated(res.data.post);
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
                onClick={() => { setImage(null); setExistingImage(null); setImagePreview(null); }}
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
            disabled={loading || (!content.trim() && !image && !existingImage)}
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