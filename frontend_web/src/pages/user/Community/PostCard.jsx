import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Tag, MoreHorizontal, User, ChevronLeft, ChevronRight, Image as ImageIcon, Trash2, Pencil, Send } from 'lucide-react'; // 🚨 Added Send icon for messages
import { useNavigate } from 'react-router-dom';
import client from '../../../api/client';

const formatWebImage = (url) => {
  if (!url) return null;
  if (url.includes('cloudinary.com') && url.toLowerCase().endsWith('.heic')) {
    return url.replace(/\.heic$/i, '.jpg');
  }
  return url;
};

const PostCard = ({ post, currentUser, onLike, onClick, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const hasLiked = post.likes?.includes(currentUser?._id);
  const postAuthorId = post.userId?._id || post.userId;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isMyPost = postAuthorId === currentUserId;
  
  const [isFollowing, setIsFollowing] = useState(currentUser?.following?.includes(postAuthorId));

  const handleLikeClick = async (e) => {
    e.stopPropagation(); 
    try {
      const token = localStorage.getItem('token');
      await client.post(`/posts/${post._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onLike(post._id); 
    } catch (error) {
      console.error("Failed to like post", error);
    }
  };

  const handleFollowClick = async (e) => {
    e.stopPropagation();
    try {
      setIsFollowing(!isFollowing);
      const token = localStorage.getItem('token');
      const res = await client.post(`/auth/follow/${postAuthorId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIsFollowing(res.data.isFollowing);
      }
    } catch (error) {
      setIsFollowing(!isFollowing); 
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowOptions(false);
    setShowDeleteConfirm(true); 
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setShowOptions(false);
    if (onEdit) onEdit(post);
  };

  const authorName = post.userId?.firstName ? `${post.userId.firstName} ${post.userId.lastName}` : (post.user || 'Unknown User');

  let profilePicUrl = post.userId?.profilePic || post.userAvatar;
  if (profilePicUrl && typeof profilePicUrl !== 'string') {
    profilePicUrl = profilePicUrl.url || profilePicUrl.uri || profilePicUrl.src;
  }
  profilePicUrl = formatWebImage(profilePicUrl);

  // 🚨 NEW: Handle Message Click (Redirects to ChatPage with State)
  const handleMessageClick = (e) => {
    e.stopPropagation(); // Prevent opening the post details modal
    navigate('/chats', { 
      state: { 
        targetUser: {
          uid: postAuthorId,
          name: authorName,
          profilePic: profilePicUrl
        } 
      } 
    });
  };

  const getValidImages = () => {
    let urls = [];
    if (post.media && Array.isArray(post.media)) {
      post.media.forEach(m => {
        if (!m) return;
        let link = typeof m === 'string' ? m : (m.uri || m.url || m.src || m.link);
        if (link && !link.startsWith('file://') && !link.startsWith('blob:')) urls.push(formatWebImage(link));
      });
    } else if (typeof post.media === 'string') {
      if (!post.media.startsWith('file://')) urls.push(formatWebImage(post.media));
    }
    if (urls.length === 0 && post.image) {
      let imgLink = typeof post.image === 'string' ? post.image : (post.image.url || post.image.uri);
      if (imgLink && !imgLink.startsWith('file://')) urls.push(formatWebImage(imgLink));
    }
    return urls;
  };

  const validImageUrls = getValidImages();
  const commentCount = post.commentsCount || post.commentsData?.length || 0;

  const safeImageIndex = currentImageIndex >= validImageUrls.length ? Math.max(0, validImageUrls.length - 1) : currentImageIndex;

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((safeImageIndex + 1) % validImageUrls.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((safeImageIndex === 0 ? validImageUrls.length - 1 : safeImageIndex - 1));
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={() => onClick(post)} 
      className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 cursor-pointer flex flex-col transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-full min-h-[250px]"
    >
      <div className="flex justify-between items-start mb-4 relative">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${postAuthorId}`); 
          }}
        >
          <div className="w-10 h-10 rounded-full bg-[#E0FBFC] overflow-hidden flex-shrink-0 border border-slate-100 shadow-inner group-hover:border-[#98C1D9] transition-colors">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-2 text-[#3D5A80]" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-black text-[#293241] leading-none group-hover:text-[#E76F51] transition-colors truncate max-w-[120px]">
              {authorName}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {isMyPost ? (
          <div className="relative">
            <button 
              className="text-slate-400 hover:text-[#293241] transition-colors p-1 rounded-full hover:bg-slate-50" 
              onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showOptions && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 shadow-xl rounded-xl z-20 overflow-hidden flex flex-col"
                >
                  <button onClick={handleEditClick} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-[#3D5A80] hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <Pencil className="w-4 h-4" /> Edit Post
                  </button>
                  <button onClick={handleDeleteClick} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-[#E76F51] hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete Post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* 🚨 NEW: Message Action Button */}
            <button 
              onClick={handleMessageClick}
              className="p-1.5 text-slate-400 hover:text-[#3D5A80] hover:bg-[#F4F7F9] rounded-full transition-colors"
              title={`Message ${authorName}`}
            >
              <Send className="w-4 h-4" />
            </button>

            <button 
              onClick={handleFollowClick} 
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                isFollowing 
                  ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                  : 'bg-[#3D5A80] text-white hover:bg-[#293241]'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-600 mb-4 leading-relaxed whitespace-pre-wrap line-clamp-4">
        {post.content}
      </p>

      {validImageUrls.length > 0 && (
        <div className="w-full rounded-2xl overflow-hidden mb-4 bg-slate-100 border border-slate-200 mt-auto shadow-sm relative group h-48 flex items-center justify-center">
          <img 
            src={validImageUrls[safeImageIndex]} 
            alt="Post Media" 
            className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity" 
            onError={(e) => console.error("Web failed to load:", e.target.src)}
          />
          {validImageUrls.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                {validImageUrls.map((_, idx) => <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === safeImageIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`} />)}
              </div>
            </>
          )}
        </div>
      )}

      {post.media && post.media.length > 0 && validImageUrls.length === 0 && (
        <div className="w-full rounded-2xl mb-4 bg-[#F4F7F9] mt-auto shadow-inner border border-slate-100 h-24 flex flex-col items-center justify-center text-slate-400">
           <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Image unavailable on Web</span>
        </div>
      )}

      <div className={`pt-4 border-t border-slate-50 flex justify-between items-center ${validImageUrls.length === 0 ? 'mt-auto' : ''}`}>
        <div className="flex items-center gap-6">
          <button onClick={handleLikeClick} className={`flex items-center gap-2 text-sm font-bold transition-colors ${hasLiked ? 'text-[#E76F51]' : 'text-slate-400 hover:text-[#E76F51]'}`}>
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current scale-110' : ''} transition-transform`} />
            {post.likes?.length || 0}
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick(post);
            }} 
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#3D5A80] transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {commentCount}
          </button>
        </div>

        {post.isForSale && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${post.isSold ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-[#0FA958]/10 text-[#0FA958] border-[#0FA958]/20'}`}>
            <Tag className="w-3.5 h-3.5" />
            <span className="text-[11px] font-black uppercase tracking-widest">
              {post.isSold ? 'SOLD' : `₱${post.price}`}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#293241]/60 backdrop-blur-sm cursor-default" 
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-8 h-8 text-[#E76F51]" />
              </div>
              <h3 className="text-xl font-black text-[#293241] mb-2">Delete Post?</h3>
              <p className="text-sm text-slate-500 mb-6 px-2 leading-relaxed">
                Are you sure you want to permanently delete this post? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                    if (onDelete) onDelete(post._id); 
                  }}
                  className="flex-1 py-3.5 bg-[#E76F51] hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#E76F51]/20"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostCard;