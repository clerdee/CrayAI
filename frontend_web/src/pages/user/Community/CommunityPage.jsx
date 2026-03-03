import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, LayoutGrid, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom'; 
import client from '../../../api/client';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import PostDetailModal from './PostDetailModal';
import EditPostModal from './EditPostModal';

const CommunityPage = () => {
  const location = useLocation(); 
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postToEdit, setPostToEdit] = useState(null);
  
  const [preFilledData, setPreFilledData] = useState(null); 
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (location.state?.newPostText || location.state?.newPostImage) {
        setPreFilledData({
            content: location.state.newPostText,
            image: location.state.newPostImage
        });
        setIsCreateOpen(true);
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    fetchData();
    
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 10000); 

    return () => clearInterval(refreshInterval); 
  }, []);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('token');
      const userRes = await client.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (userRes.data?.success) setCurrentUser(userRes.data.user);

      const postRes = await client.get('/posts/feed', { headers: { Authorization: `Bearer ${token}` } });
      if (postRes.data?.success) {
        setPosts(postRes.data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch community data:", error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    await fetchData();
    showToast("Feed refreshed!", "success");
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  const handlePostCreated = (newPost) => {
    const completePost = { ...newPost, user: currentUser };
    setPosts([completePost, ...posts]);
    showToast("Post created successfully!", "success");
    setPreFilledData(null); 
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p));
    if (selectedPost && selectedPost._id === updatedPost._id) {
        setSelectedPost({ ...selectedPost, ...updatedPost });
    }
    showToast("Post updated successfully!", "success");
  };

  const handleLikeUpdate = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p._id === postId) {
        const hasLiked = p.likes.includes(currentUser._id);
        const updatedLikes = hasLiked 
            ? p.likes.filter(id => id !== currentUser._id) 
            : [...p.likes, currentUser._id];
        return { ...p, likes: updatedLikes };
      }
      return p;
    }));
    
    if (selectedPost && selectedPost._id === postId) {
        const hasLiked = selectedPost.likes.includes(currentUser._id);
        const updatedLikes = hasLiked 
            ? selectedPost.likes.filter(id => id !== currentUser._id) 
            : [...selectedPost.likes, currentUser._id];
        setSelectedPost({ ...selectedPost, likes: updatedLikes });
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await client.delete(`/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data?.success) {
        setPosts(prev => prev.filter(p => p._id !== postId));
        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(null);
        }
        showToast("Post deleted successfully", "success");
      }
    } catch (error) {
      showToast("Failed to delete post. Please try again.", "error");
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'For Sale') return post.isForSale;
    if (filter === 'General') return !post.isForSale;
    return true; 
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7F9]">
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-2xl font-black text-[#293241] tracking-widest uppercase">
          Loading<span className="text-[#98C1D9]">Feed</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] font-sans pb-24 relative">
      
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold tracking-wider uppercase text-xs backdrop-blur-md ${
              toast.type === 'success' ? 'bg-[#293241]/95' : 'bg-[#E76F51]/95'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#0FA958]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[90rem] mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#293241] tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-[#3D5A80]" /> Community Feed
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Connect, Share, and Trade</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* ✅ REFRESH BUTTON */}
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-[#293241] px-4 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing' : 'Refresh'}
            </button>

            <button 
              onClick={() => { setIsCreateOpen(true); setPreFilledData(null); }}
              className="flex items-center gap-2 bg-[#E76F51] hover:bg-[#D65A3E] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-colors shadow-md shadow-[#E76F51]/20"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-2 mb-8 bg-white w-fit p-1.5 rounded-2xl shadow-sm border border-slate-100">
          {['All', 'General', 'For Sale'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filter === tab ? 'bg-[#293241] text-white shadow-md' : 'text-slate-500 hover:text-[#293241]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
              <LayoutGrid className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-[#293241] uppercase tracking-wider mb-2">It's quiet here</h3>
            <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Be the first to create a post!</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredPosts.map(post => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  currentUser={currentUser} 
                  onLike={handleLikeUpdate}
                  onClick={setSelectedPost}
                  onDelete={handleDeletePost}
                  onEdit={setPostToEdit}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <CreatePostModal 
        isOpen={isCreateOpen} 
        onClose={() => { setIsCreateOpen(false); setPreFilledData(null); }} 
        onPostCreated={handlePostCreated} 
        initialData={preFilledData}
      />

      <PostDetailModal 
        post={selectedPost} 
        currentUser={currentUser}
        isOpen={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
        onDelete={handleDeletePost} 
        onEdit={setPostToEdit}
      />

      <EditPostModal 
        isOpen={!!postToEdit}
        post={postToEdit}
        onClose={() => setPostToEdit(null)}
        onPostUpdated={handlePostUpdated}
      />

    </div>
  );
};

export default CommunityPage;