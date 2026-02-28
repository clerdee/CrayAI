import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Tag, Heart, MessageCircle, ChevronLeft, ChevronRight, Image as ImageIcon, MoreHorizontal, Trash2, Pencil, CheckCircle } from 'lucide-react';
import client from '../../../api/client';

const formatWebImage = (url) => {
  if (!url) return null;
  if (url.includes('cloudinary.com') && url.toLowerCase().endsWith('.heic')) return url.replace(/\.heic$/i, '.jpg');
  return url;
};

const PostDetailModal = ({ post, currentUser, isOpen, onClose, onDelete, onEdit, onLike }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  // States for Editing, Deleting Comments & Notifications
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState(null); 
  const [notification, setNotification] = useState(null); 

  // Optimistic UI States for Liking
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const postAuthorId = post?.userId?._id || post?.userId;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isMyPost = postAuthorId === currentUserId;
  
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      setComments(post.commentsData || []);
      setCurrentImageIndex(0);
      setShowOptions(false);
      setIsFollowing(currentUser?.following?.includes(postAuthorId));
      setEditingCommentId(null);
      setEditCommentText('');
      setCommentToDelete(null);
      setNotification(null);
    }
  }, [isOpen, post?._id]);

  useEffect(() => {
    setIsLiked(post?.likes?.includes(currentUserId) || false);
    setLikesCount(post?.likes?.length || 0);
  }, [post?.likes, currentUserId]);

  if (!isOpen || !post) return null;

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000); 
  };

  const handleLikeClick = async (e) => {
    e.preventDefault();
    
    const newlyLiked = !isLiked;
    setIsLiked(newlyLiked);
    setLikesCount(prev => newlyLiked ? prev + 1 : prev - 1);

    try {
      const token = localStorage.getItem('token');
      await client.post(`/posts/${post._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onLike) onLike(post._id); 
    } catch (error) {
      console.error("Failed to like post", error);
      // Revert if API fails
      setIsLiked(!newlyLiked);
      setLikesCount(prev => newlyLiked ? prev - 1 : prev + 1);
    }
  };

  const handleFollowClick = async (e) => {
    e.stopPropagation();
    try {
      setIsFollowing(!isFollowing);
      const token = localStorage.getItem('token');
      const res = await client.post(`/auth/follow/${postAuthorId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setIsFollowing(res.data.isFollowing);
    } catch (error) {
      setIsFollowing(!isFollowing);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
        onDelete(post._id);
        onClose(); 
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setShowOptions(false);
    if (onEdit) {
      onEdit(post);
      onClose();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await client.post(`/posts/${post._id}/comment`, { text: commentText }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.data.success) {
        const newComment = res.data.newComment || {
            _id: Date.now().toString(),
            text: commentText,
            user: `${currentUser.firstName} ${currentUser.lastName}`,
            userId: currentUserId,
            userAvatar: currentUser.profilePic,
            createdAt: new Date()
        };
        setComments([...comments, newComment]);
        setCommentText('');
        showNotification("Comment posted!");
      }
    } catch (error) {
      console.error("Failed to add comment", error);
    } finally {
      setLoading(false);
    }
  };

  const executeDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await client.delete(`/posts/${post._id}/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setComments(comments.filter(c => c._id !== commentId));
        showNotification("Comment deleted."); 
        setCommentToDelete(null); 
      }
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
  };

  const handleEditCommentSubmit = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await client.put(`/posts/${post._id}/comment/${commentId}`, 
        { text: editCommentText }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setComments(comments.map(c => c._id === commentId ? { ...c, text: editCommentText } : c));
        setEditingCommentId(null);
        setEditCommentText('');
        showNotification("Comment updated!"); 
      }
    } catch (error) {
      console.error("Failed to edit comment", error);
    }
  };

  const authorName = post.userId ? `${post.userId.firstName} ${post.userId.lastName}` : (post.user || 'Unknown User');
  
  let profilePicUrl = post.userId?.profilePic || post.userAvatar;
  if (profilePicUrl && typeof profilePicUrl !== 'string') profilePicUrl = profilePicUrl.url || profilePicUrl.uri || profilePicUrl.src;
  profilePicUrl = formatWebImage(profilePicUrl);

  const getValidImages = () => {
    let urls = [];
    if (post.media && Array.isArray(post.media)) {
      post.media.forEach(m => {
        if (!m) return;
        let link = typeof m === 'string' ? m : (m.uri || m.url || m.src || m.link);
        if (link && !link.startsWith('file://')) urls.push(formatWebImage(link));
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

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % validImageUrls.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? validImageUrls.length - 1 : prev - 1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-sm" onClick={onClose}>
          <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>

          <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white md:rounded-[2rem] w-full h-full md:h-[85vh] max-w-5xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative cursor-default">
            
            {/* LEFT SIDE: MEDIA */}
            {validImageUrls.length > 0 ? (
              <div className="flex-1 bg-slate-900 flex items-center justify-center relative min-h-[40vh] md:min-h-0 group">
                <img src={validImageUrls[currentImageIndex]} alt="Post Attachment" className="w-full h-full object-contain transition-opacity duration-300" />
                {validImageUrls.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={nextImage} className="absolute right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"><ChevronRight className="w-6 h-6" /></button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      {validImageUrls.map((_, idx) => <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />)}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 bg-gradient-to-br from-[#3D5A80] to-[#293241] flex flex-col items-center justify-center p-10 relative min-h-[40vh] md:min-h-0">
                <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
                {post.media && post.media.length > 0 && (
                   <div className="absolute top-10 flex flex-col items-center opacity-60">
                      <ImageIcon className="w-10 h-10 text-white mb-2" />
                      <span className="text-white text-xs font-bold uppercase tracking-widest text-center px-4">Image unavailable on Web</span>
                   </div>
                )}
                <h2 className="text-2xl md:text-3xl font-black text-white text-center leading-relaxed drop-shadow-md relative z-10 max-w-lg">{post.content}</h2>
              </div>
            )}

            {/* RIGHT SIDE: AUTHOR & COMMENTS */}
            <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-white border-l border-slate-100 flex-shrink-0 h-full max-h-[60vh] md:max-h-full relative">
              
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E0FBFC] border border-slate-200 overflow-hidden flex-shrink-0">
                    {profilePicUrl ? <img src={profilePicUrl} alt={authorName} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-[#3D5A80]" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#293241] leading-none">{authorName}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1 truncate max-w-[200px]">{post.userId?.email || 'Researcher Account'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isMyPost ? (
                    <div className="relative">
                      <button className="text-slate-400 hover:text-[#293241] transition-colors p-1 rounded-full hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}>
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      <AnimatePresence>
                        {showOptions && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 shadow-xl rounded-xl z-20 overflow-hidden flex flex-col">
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
                    <button onClick={handleFollowClick} className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${isFollowing ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-[#3D5A80] text-white hover:bg-[#293241]'}`}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  <button onClick={onClose} className="md:hidden p-1.5 text-slate-400 hover:text-[#E76F51]"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 bg-slate-50/30">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E0FBFC] overflow-hidden flex-shrink-0 border border-slate-200 mt-1">
                    {profilePicUrl ? <img src={profilePicUrl} alt={authorName} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-[#3D5A80]" />}
                  </div>
                  <div>
                    <p className="text-sm text-[#293241] leading-relaxed"><span className="font-black mr-2 hover:underline cursor-pointer">{authorName}</span>{post.content}</p>
                    
                    {post.isForSale && (
                      <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${post.isSold ? 'bg-slate-200 text-slate-500' : 'bg-[#0FA958]/10 text-[#0FA958]'}`}>
                        <Tag className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-black uppercase tracking-widest">
                           {post.isSold ? 'SOLD' : `₱${post.price}`}
                        </span>
                      </div>
                    )}

                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-70">
                    <MessageCircle className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No comments yet</p>
                    <p className="text-xs text-slate-400 mt-1">Start the conversation.</p>
                  </div>
                ) : (
                  comments.map((c, idx) => {
                    let cAvatar = c.userAvatar || c.userId?.profilePic;
                    if (cAvatar && typeof cAvatar !== 'string') cAvatar = cAvatar.url || cAvatar.uri;
                    cAvatar = formatWebImage(cAvatar);
                    const cName = c.user || (c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'Unknown');
                    
                    const isMyComment = c.userId === currentUserId || c.userId?._id === currentUserId;

                    return (
                      <div key={c._id || idx} className="flex gap-3 group relative">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 mt-1">
                          {cAvatar ? <img src={cAvatar} alt="User" className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-slate-400" />}
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-8">
                          {editingCommentId === c._id ? (
                            <div className="flex flex-col gap-2 mt-1">
                              <input
                                className="w-full bg-white border border-slate-200 shadow-inner rounded-xl px-3 py-2 text-sm outline-none focus:border-[#3D5A80] transition-colors"
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleEditCommentSubmit(c._id)} className="text-[10px] font-black uppercase tracking-widest text-white bg-[#3D5A80] hover:bg-[#293241] transition-colors px-3 py-1.5 rounded-lg">Save</button>
                                <button onClick={() => setEditingCommentId(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-200 hover:bg-slate-300 transition-colors px-3 py-1.5 rounded-lg">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-slate-700 leading-relaxed"><span className="font-black text-[#293241] mr-2 hover:underline cursor-pointer">{cName}</span>{c.text}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          )}
                        </div>

                        {/* Hover Actions for My Comments */}
                        {isMyComment && editingCommentId !== c._id && (
                          <div className="absolute right-0 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-50/90 backdrop-blur-sm px-2 py-1 rounded-xl border border-slate-100">
                            <button 
                              onClick={() => { setEditingCommentId(c._id); setEditCommentText(c.text); }} 
                              className="p-1.5 text-slate-400 hover:text-[#3D5A80] bg-white rounded-lg shadow-sm transition-colors"
                              title="Edit Comment"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setCommentToDelete(c._id)} 
                              className="p-1.5 text-slate-400 hover:text-[#E76F51] bg-white rounded-lg shadow-sm transition-colors"
                              title="Delete Comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Notification Toast */}
              <AnimatePresence>
                {notification && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 10, x: '-50%' }}
                    className="absolute bottom-[90px] left-1/2 flex items-center gap-2 bg-[#293241] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl z-50 whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4 text-[#0FA958]" />
                    {notification}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white border-t border-slate-100 flex-shrink-0 relative z-20">
                <button 
                  onClick={handleLikeClick} 
                  className="w-full px-5 py-3 border-b border-slate-50 flex items-center gap-2 hover:bg-slate-50 transition-colors outline-none"
                >
                  <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'text-[#E76F51] fill-current scale-110' : 'text-slate-400 hover:scale-110'}`} />
                  <span className="text-sm font-black text-[#293241]">{likesCount} likes</span>
                </button>

                <form onSubmit={handleAddComment} className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-full bg-[#E0FBFC] overflow-hidden flex-shrink-0 border border-slate-200">
                    {currentUser?.profilePic ? (
                      <img src={formatWebImage(typeof currentUser.profilePic === 'string' ? currentUser.profilePic : (currentUser.profilePic.url || currentUser.profilePic.uri))} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-1.5 text-[#3D5A80]" />
                    )}
                  </div>
                  <input type="text" placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="flex-1 bg-transparent outline-none text-sm text-[#293241] placeholder:text-slate-400" />
                  <button type="submit" disabled={!commentText.trim() || loading} className="text-[#3D5A80] hover:text-[#293241] disabled:text-slate-300 font-black text-sm uppercase tracking-widest transition-colors flex-shrink-0">
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </form>
              </div>

              {/* Custom Delete Comment Confirmation Modal */}
              <AnimatePresence>
                {commentToDelete && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md md:rounded-r-[2rem]">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="bg-white rounded-3xl w-full max-w-[280px] shadow-2xl border border-slate-100 overflow-hidden p-6 text-center"
                    >
                      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                        <Trash2 className="w-6 h-6 text-[#E76F51]" />
                      </div>
                      <h3 className="text-lg font-black text-[#293241] mb-1">Delete Comment?</h3>
                      <p className="text-xs font-bold text-slate-400 mb-6">This action cannot be undone.</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setCommentToDelete(null)}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs uppercase tracking-widest font-black rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => executeDeleteComment(commentToDelete)}
                          className="flex-1 py-2.5 bg-[#E76F51] hover:bg-red-600 text-white text-xs uppercase tracking-widest font-black rounded-xl transition-colors shadow-lg shadow-[#E76F51]/20"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PostDetailModal;