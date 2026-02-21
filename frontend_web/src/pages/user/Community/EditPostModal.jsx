import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Loader, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import client from '../../../api/client';

const formatWebImage = (url) => {
  if (!url) return null;
  if (url.includes('cloudinary.com') && url.toLowerCase().endsWith('.heic')) {
    return url.replace(/\.heic$/i, '.jpg');
  }
  return url;
};

// Helper to convert new images to Base64 for the backend
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
  const [content, setContent] = useState('');
  const [isForSale, setIsForSale] = useState(false);
  const [price, setPrice] = useState('');
  const [isSold, setIsSold] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Stores objects: { original: rawData, url: string, isNew: boolean, file?: File }
  const [mediaItems, setMediaItems] = useState([]); 

  useEffect(() => {
    if (post) {
      setContent(post.content || '');
      setIsForSale(post.isForSale || false);
      setPrice(post.price ? String(post.price) : '');
      setIsSold(post.isSold || false);

      let items = [];
      if (post.media && Array.isArray(post.media)) {
        post.media.forEach(m => {
          if (!m) return;
          let link = typeof m === 'string' ? m : (m.uri || m.url || m.src || m.link);
          if (link && !link.startsWith('file://') && !link.startsWith('blob:')) {
            items.push({ original: m, url: formatWebImage(link), isNew: false });
          }
        });
      } else if (typeof post.media === 'string') {
        if (!post.media.startsWith('file://')) items.push({ original: post.media, url: formatWebImage(post.media), isNew: false });
      }
      
      if (items.length === 0 && post.image) {
        let imgLink = typeof post.image === 'string' ? post.image : (post.image.url || post.image.uri);
        if (imgLink && !imgLink.startsWith('file://')) items.push({ original: post.image, url: formatWebImage(imgLink), isNew: false });
      }
      
      setMediaItems(items);
    }
  }, [post]);

  // Handle adding new images
  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const newItems = files.map(file => ({
      isNew: true,
      file: file, // Keep the raw file to convert later
      url: URL.createObjectURL(file) // Temporary local preview
    }));

    setMediaItems(prev => [...prev, ...newItems]);
    e.target.value = null; // Reset input so the user can select the same file again if they deleted it
  };

  const handleRemoveImage = (indexToRemove) => {
    setMediaItems(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaItems.length === 0) return; 
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Process media: Keep existing as-is, convert new ones to Base64
      const processedMedia = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.isNew) {
            const base64String = await convertToBase64(item.file);
            return { uri: base64String, mediaType: item.file.type };
          }
          return item.original; // It's an existing image, send it back as-is
        })
      );

      const payload = {
        content: content,
        isForSale: isForSale,
        price: isForSale ? Number(price) : 0,
        isSold: isSold,
        media: processedMedia // Contains both old strings and new Base64 objects
      };

      const res = await client.put(`/posts/${post._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        onPostUpdated(res.data.post);
        onClose();
      }
    } catch (error) {
      console.error("Failed to update post", error);
      alert("Failed to update post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#293241]/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-black text-[#293241] uppercase tracking-[0.2em]">Edit Post</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-[#E76F51] bg-white rounded-full shadow-sm transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          {/* Editable Image Previews */}
          {mediaItems.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              <AnimatePresence>
                {mediaItems.map((item, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, width: 0 }}
                    className="relative w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group"
                  >
                    <img src={item.url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#E76F51] transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <textarea
            placeholder="Update your post content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[120px] p-4 bg-[#F4F7F9] border-transparent rounded-2xl focus:border-[#3D5A80] focus:ring-0 text-sm resize-none outline-none transition-all placeholder:text-slate-400"
          />

          <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            
            {/* Action Row: Add Media & For Sale */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Add Media Button */}
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-[#3D5A80] hover:text-[#293241] transition-colors">
                  <div className="p-2 bg-[#E0FBFC] rounded-xl"><ImageIcon className="w-5 h-5" /></div>
                  <span>Add Media</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageAdd} className="hidden" />
                </label>

                {/* For Sale Toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-[#0FA958] hover:text-[#0C8A47] transition-colors">
                  <input type="checkbox" checked={isForSale} onChange={(e) => { setIsForSale(e.target.checked); if (!e.target.checked) setIsSold(false); }} className="rounded text-[#0FA958] focus:ring-[#0FA958] w-4 h-4" />
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

            <AnimatePresence>
              {isForSale && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-200 pt-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-500 hover:text-[#293241] transition-colors">
                    <input type="checkbox" checked={isSold} onChange={(e) => setIsSold(e.target.checked)} className="rounded text-[#E76F51] focus:ring-[#E76F51] w-4 h-4" />
                    <CheckCircle2 className="w-5 h-5" /> Mark as Sold
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            type="submit" 
            disabled={loading || (!content.trim() && mediaItems.length === 0)}
            className="w-full py-4 bg-[#3D5A80] hover:bg-[#293241] disabled:bg-slate-300 text-white font-black uppercase tracking-widest rounded-2xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-[#3D5A80]/20"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Update Post'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default EditPostModal;