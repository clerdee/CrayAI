import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Calendar, LayoutGrid, ChevronLeft, Edit2, ScanSearch } from 'lucide-react';
import client from '../../api/client';
import PostCard from './Community/PostCard';
import PostDetailModal from './Community/PostDetailModal';

const ProfilePage = () => {
  const { userId } = useParams(); 
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Data States
  const [userPosts, setUserPosts] = useState([]);
  const [userScans, setUserScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tab State: 'posts' | 'scans'
  const [activeTab, setActiveTab] = useState('posts'); 
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Fetch current logged-in user
      const myRes = await client.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      const me = myRes.data?.user;
      if (me) setCurrentUser(me);

      // 2. Fetch the target profile's info
      let targetUser = me;
      const targetId = userId || me?._id;

      if (userId && userId !== me?._id) {
        try {
          const userRes = await client.get(`/auth/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (userRes.data?.success) targetUser = userRes.data.user;
        } catch (e) {
          console.warn("Falling back to basic info from posts.");
          targetUser = { _id: userId, firstName: 'Community', lastName: 'Member' };
        }
      }
      setProfileUser(targetUser);

      // 3. 🌍 FETCH COMMUNITY POSTS (Public)
      try {
        const postRes = await client.get('/posts/feed', { headers: { Authorization: `Bearer ${token}` } });
        if (postRes.data?.success) {
          const filtered = postRes.data.posts.filter(p => 
            (p.userId?._id === targetId) || (p.userId === targetId)
          );
          setUserPosts(filtered);
          
          if (filtered.length > 0 && targetUser.firstName === 'Community') {
             setProfileUser(filtered[0].userId); 
          }
        }
      } catch (postErr) {
        console.error("Failed to fetch user posts", postErr);
      }

      // 4. 🔒 FETCH PRIVATE SCANS (Only if viewing your OWN profile)
      if (targetId === me?._id) {
        try {
          const scanRes = await client.get('/scans/me', { headers: { Authorization: `Bearer ${token}` } });

          console.log("👀 RAW SCAN DATA:", scanRes.data);
          
          if (scanRes.data?.success) {
            setUserScans(scanRes.data.records || []);
          } else if (Array.isArray(scanRes.data)) {
            setUserScans(scanRes.data);
          }
        } catch (scanErr) {
          console.warn("Could not fetch private scans:", scanErr);
        }
      }

    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeUpdate = (postId) => {
    setUserPosts(prev => prev.map(p => {
      if (p._id === postId) {
        const hasLiked = p.likes.includes(currentUser._id);
        const updatedLikes = hasLiked 
            ? p.likes.filter(id => id !== currentUser._id) 
            : [...p.likes, currentUser._id];
        return { ...p, likes: updatedLikes };
      }
      return p;
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7F9]">
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-2xl font-black text-[#293241] tracking-widest uppercase">
          Loading<span className="text-[#98C1D9]">Profile</span>
        </motion.div>
      </div>
    );
  }

  const isMyProfile = currentUser?._id === profileUser?._id;

  return (
    <div className="min-h-screen bg-[#F4F7F9] font-sans pb-24">
      {/* --- PROFILE HEADER --- */}
      <div className="bg-white border-b border-slate-100 shadow-sm pt-8 pb-12">
        <div className="max-w-[90rem] mx-auto px-4 md:px-8">
          
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-[#293241] font-bold text-sm uppercase tracking-widest mb-8 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#E0FBFC] border-4 border-white shadow-xl overflow-hidden flex-shrink-0 relative">
              {profileUser?.profilePic ? (
                <img src={profileUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-8 text-[#3D5A80]" />
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left pt-2">
              <h1 className="text-4xl font-black text-[#293241] tracking-tight mb-2">
                {profileUser?.firstName} {profileUser?.lastName}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> 
                  {profileUser?.location || 'Philippines'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> 
                  Joined {new Date(profileUser?.createdAt || Date.now()).getFullYear()}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start gap-8">
                <div className="text-center">
                  <span className="block text-2xl font-black text-[#3D5A80]">{userPosts.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posts</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-black text-[#3D5A80]">{profileUser?.followers?.length || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Followers</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-black text-[#3D5A80]">{profileUser?.following?.length || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Following</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {isMyProfile ? (
                <button 
                  onClick={() => alert("Edit Profile component coming soon!")} 
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-[#293241] font-black uppercase tracking-widest text-xs rounded-full transition-colors shadow-sm"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <button className="px-8 py-3 bg-[#3D5A80] hover:bg-[#293241] text-white font-black uppercase tracking-widest text-xs rounded-full transition-colors shadow-lg shadow-[#3D5A80]/20">
                  Follow
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 md:px-8 py-8">
        
        {/* --- TABS --- */}
        <div className="flex gap-8 border-b border-slate-200 mb-8">
          <button 
            onClick={() => setActiveTab('posts')} 
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'posts' ? 'text-[#E76F51] border-b-2 border-[#E76F51]' : 'text-slate-400 hover:text-[#293241]'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Community Posts
          </button>
          
          {isMyProfile && (
            <button 
              onClick={() => setActiveTab('scans')} 
              className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'scans' ? 'text-[#E76F51] border-b-2 border-[#E76F51]' : 'text-slate-400 hover:text-[#293241]'}`}
            >
              <ScanSearch className="w-4 h-4" /> My Scans
            </button>
          )}
        </div>

        {/* --- PUBLIC POSTS GRID --- */}
        {activeTab === 'posts' && (
          userPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <LayoutGrid className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">No posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {userPosts.map(post => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    currentUser={currentUser} 
                    onLike={handleLikeUpdate}
                    onClick={setSelectedPost}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        )}

        {/* --- PRIVATE SCANS GRID --- */}
        {activeTab === 'scans' && isMyProfile && (
          userScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <ScanSearch className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">No private scans yet.</p>
              <p className="text-xs text-slate-400 mt-2">Your AI measurements will appear here securely.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {userScans.map(scan => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={scan._id} 
                    className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer"
                  >
                    {/* Scan Image */}
                    <div className="w-full h-40 bg-[#E0FBFC] rounded-2xl overflow-hidden relative border border-slate-50">
                       <img 
                          src={scan.imageUrl || scan.image || '/crayfish.png'} 
                          alt="Crayfish Scan" 
                          className="w-full h-full object-cover" 
                       />
                       <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 rounded-full">
                          {scan.gender || 'Unknown'}
                       </div>
                    </div>
                    
                    {/* Scan Header */}
                    <div>
                        <h4 className="font-black text-[#293241] truncate">Red Claw Record</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {new Date(scan.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Scan Metrics */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <div className="flex flex-col">
                           <span className="text-[10px] text-slate-400 uppercase font-black">Weight</span>
                           <span className="text-sm font-bold text-[#E76F51]">
                              {scan.weight ? `${scan.weight} g` : '--'}
                           </span>
                        </div>
                        <div className="flex flex-col text-right">
                           <span className="text-[10px] text-slate-400 uppercase font-black">Length</span>
                           <span className="text-sm font-bold text-[#3D5A80]">
                              {scan.length ? `${scan.length} cm` : '--'}
                           </span>
                        </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        )}
      </div>

      <PostDetailModal 
        post={selectedPost} 
        currentUser={currentUser}
        isOpen={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
      />
    </div>
  );
};

export default ProfilePage;