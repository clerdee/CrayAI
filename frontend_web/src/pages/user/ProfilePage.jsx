import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, MapPin, Calendar, LayoutGrid, ChevronLeft, 
  Edit2, ScanSearch, MessageSquare, AlignLeft,
  X, Activity, Ruler, Cpu, Clock, Droplets, Share2, Trash2,
  CheckCircle, AlertTriangle
} from 'lucide-react';
import client from '../../api/client';
import PostCard from './Community/PostCard';
import PostDetailModal from './Community/PostDetailModal';
import EditProfileModal from './EditProfileModal'; 

const ProfilePage = () => {
  const { userId } = useParams(); 
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userScans, setUserScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); 
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 

  // --- NEW: MODAL & NOTIFICATION STATE ---
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanToDelete, setScanToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const myRes = await client.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      const me = myRes.data?.user;
      if (me) setCurrentUser(me);

      let targetUser = me;
      const targetId = userId || me?._id || me?.id;

      if (userId && userId !== String(me?._id || me?.id)) {
        try {
          const userRes = await client.get(`/auth/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (userRes.data?.success) targetUser = userRes.data.user;
        } catch (e) {
          console.warn("Falling back to basic info from posts.");
          targetUser = { _id: userId, firstName: 'Community', lastName: 'Member' };
        }
      }
      setProfileUser(targetUser);

      if (me && String(targetId) !== String(me._id || me.id)) {
         const myFollowing = me.following || [];
         setIsFollowing(myFollowing.some(id => String(id) === String(targetId)));
      }

      const postRes = await client.get('/posts/feed', { headers: { Authorization: `Bearer ${token}` } });
      if (postRes.data?.success) {
        const targetStr = String(targetId);
        const filtered = postRes.data.posts.filter(p => {
          const authorId = String(p.userId?._id || p.userId?.id || p.userId);
          return authorId === targetStr;
        });
        setUserPosts(filtered);
      }

      if (String(targetId) === String(me?._id || me?.id)) {
        const scanRes = await client.get('/scans/me', { headers: { Authorization: `Bearer ${token}` } });
        if (scanRes.data?.success) {
          setUserScans(scanRes.data.records || []);
        }
      }

    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowClick = async () => {
    try {
      const token = localStorage.getItem('token');
      const targetId = String(profileUser._id || profileUser.id);
      const myId = String(currentUser._id || currentUser.id);
      const wasFollowing = isFollowing;
      
      setIsFollowing(!wasFollowing);

      setProfileUser(prev => {
        if (!prev) return prev;
        const currentFollowers = prev.followers || [];
        const newFollowers = wasFollowing
          ? currentFollowers.filter(id => String(id) !== myId)
          : [...currentFollowers, myId];
        return { ...prev, followers: newFollowers };
      });

      setCurrentUser(prev => {
        if (!prev) return prev;
        const currentFollowing = prev.following || [];
        const newFollowing = wasFollowing
          ? currentFollowing.filter(id => String(id) !== targetId) 
          : [...currentFollowing, targetId]; 
        return { ...prev, following: newFollowing };
      });

      const res = await client.post(`/auth/follow/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setIsFollowing(res.data.isFollowing);
      }
    } catch (error) {
      console.error("Failed to follow/unfollow user", error);
      setIsFollowing(isFollowing); 
    }
  };

  // Navigates to chat/message route
  const handleMessageClick = () => {
    navigate('/chats', { 
      state: { 
        targetUser: {
          uid: profileUser._id || profileUser.id,
          name: profileName,
          profilePic: profileUser.profilePic
        } 
      } 
    });
  };

  // --- POST MODAL ACTIONS ---
  const handleDeletePost = async (id) => {
    const postId = typeof id === 'object' ? id._id : id;
    if (!postId) return;

    try {
      const token = localStorage.getItem('token');
      // Execute the database deletion just in case the child component only triggers the event
      await client.delete(`/posts/${postId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
    } catch (err) {
      // If it returns 404, it means the child component already deleted it, which is fine
      if (err.response && err.response.status !== 404) {
        console.error("Failed to delete post:", err);
        setNotification({ type: 'error', message: "Failed to delete post. Please try again." });
        setTimeout(() => setNotification(null), 4000);
        return;
      }
    }

    // Update UI State
    setUserPosts(prev => prev.filter(p => p._id !== postId));
    
    if (selectedPost && selectedPost._id === postId) {
      setSelectedPost(null);
    }
    
    setNotification({ type: 'success', message: 'Post deleted permanently.' });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- SCAN MODAL ACTIONS ---
  const formatScanForModal = (r) => ({
    id: r.scanId || r._id,
    dbId: r._id, 
    date: new Date(r.createdAt),
    image: r.image?.url || r.image || 'https://via.placeholder.com/400x300?text=No+Image',
    species: 'Australian Red Claw',
    gender: r.gender || 'Unknown',
    confidence: typeof r.gender_confidence === 'number' ? r.gender_confidence : 0,
    age: r.morphometrics?.estimated_age || 'Unknown',
    width_cm: parseFloat(r.morphometrics?.width_cm || 0),
    height_cm: parseFloat(r.morphometrics?.height_cm || 0),
    algae: r.environment?.algae_label || 'Low',
    turbidity: r.environment?.turbidity_level || 1,
    health: (['High', 'Critical'].includes(r.environment?.algae_label) || r.environment?.turbidity_level > 6) ? 'Risk' : 'Healthy',
    location: r.location || 'Unknown Location',
    model: r.model_version || 'CrayAI v1.0',
    processingTime: r.processing_time || 'N/A'
  });

  const promptDeleteScan = (scan) => {
    setScanToDelete(scan);
  };

  const confirmDeleteScan = async () => {
    if (!scanToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await client.delete(`/scans/${scanToDelete.dbId}/hard-delete`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setUserScans(prev => prev.filter(r => r._id !== scanToDelete.dbId));
      
      const deletedId = scanToDelete.id;
      setScanToDelete(null);
      setSelectedScan(null);
      
      setNotification({ type: 'success', message: `Scan ${deletedId} deleted permanently.` });
      setTimeout(() => setNotification(null), 4000);

    } catch (err) {
      console.error("Delete failed:", err);
      setScanToDelete(null);
      setNotification({ type: 'error', message: "Failed to delete scan. Please try again." });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handlePostToFeed = (scan) => {
    const caption = `Shared from my history! 🕰️\n\nFound a ${scan.gender} Crayfish 🦞\nID: ${scan.id}\n📏 Size: ${scan.width_cm}cm W x ${scan.height_cm}cm H\n🎂 Age: ${scan.age}\n💧 Water Turbidity: Level ${scan.turbidity}\n🌿 Algae: ${scan.algae}`;
    navigate('/community', { 
      state: { 
        newPostImage: scan.image,
        newPostText: caption
      } 
    });
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

  const isMyProfile = String(currentUser?._id || currentUser?.id) === String(profileUser?._id || profileUser?.id);
  const profileName = profileUser?.fullName || `${profileUser?.firstName || ''} ${profileUser?.lastName || ''}`.trim() || 'Unknown User';
  const displayLocation = [profileUser?.city, profileUser?.country].filter(Boolean).join(', ') || 'Location not set';

  return (
    <div className="min-h-screen bg-[#F4F7F9] font-sans pb-24">
      <div className="bg-white border-b border-slate-100 shadow-sm pt-8 pb-12">
        <div className="max-w-[90rem] mx-auto px-4 md:px-8">
          
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-[#293241] font-bold text-sm uppercase tracking-widest mb-8 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#E0FBFC] border-4 border-white shadow-xl overflow-hidden flex-shrink-0 relative">
              {profileUser?.profilePic ? (
                <img src={profileUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-8 text-[#3D5A80]" />
              )}
            </div>

            <div className="flex-1 text-center md:text-left pt-2">
              <h1 className="text-4xl font-black text-[#293241] tracking-tight mb-2">
                {profileName}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> 
                  {displayLocation}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> 
                  Joined {new Date(profileUser?.createdAt || Date.now()).getFullYear()}
                </span>
              </div>

              {/* BIO SECTION */}
              <div className="max-w-xl mb-6">
                <p className="text-slate-600 italic leading-relaxed">
                   {profileUser?.bio ? `"${profileUser.bio}"` : "No bio provided yet."}
                </p>
              </div>

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

            <div className="pt-2 flex flex-col gap-3">
              {isMyProfile ? (
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-[#293241] font-black uppercase tracking-widest text-xs rounded-full transition-colors shadow-sm"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleFollowClick}
                    className={`px-8 py-3 font-black uppercase tracking-widest text-xs rounded-full transition-colors shadow-lg ${
                      isFollowing 
                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-none' 
                        : 'bg-[#3D5A80] hover:bg-[#293241] text-white shadow-[#3D5A80]/20'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  
                  {/* MESSAGE BUTTON FOR OTHERS */}
                  <button 
                    onClick={handleMessageClick}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#3D5A80] text-[#3D5A80] hover:bg-[#3D5A80] hover:text-white font-black uppercase tracking-widest text-xs rounded-full transition-all shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 md:px-8 py-8">
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
                    onLike={fetchProfileData}
                    onClick={() => setSelectedPost(post)}
                    onDelete={handleDeletePost}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        )}

        {activeTab === 'scans' && isMyProfile && (
          userScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <ScanSearch className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">No private scans yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {userScans.map(scan => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={scan._id} 
                    onClick={() => setSelectedScan(formatScanForModal(scan))}
                    className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer"
                  >
                    <div className="w-full h-40 bg-[#E0FBFC] rounded-2xl overflow-hidden relative border border-slate-50">
                       <img 
                          src={scan.image?.url || scan.image || '/crayfish.png'} 
                          alt="Crayfish Scan" 
                          className="w-full h-full object-cover" 
                       />
                       <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 rounded-full">
                          {scan.environment?.algae_label || 'Normal'}
                       </div>
                    </div>
                    <div>
                        <h4 className="font-black text-[#293241] truncate">{scan.scanId || 'Scan Record'}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <div className="flex flex-col">
                           <span className="text-[10px] text-slate-400 uppercase font-black">Dimensions</span>
                           <span className="text-sm font-bold text-[#E76F51]">
                              {scan.morphometrics?.width_cm || 0}W × {scan.morphometrics?.height_cm || 0}H
                           </span>
                        </div>
                        <div className="flex flex-col text-right">
                           <span className="text-[10px] text-slate-400 uppercase font-black">Est. Age</span>
                           <span className="text-sm font-bold text-[#3D5A80]">
                              {scan.morphometrics?.estimated_age || '--'}
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

      {/* --- NOTIFICATION TOAST --- */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl bg-slate-800 text-white min-w-[300px]"
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="text-sm font-bold tracking-wide flex-1">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)} 
              className="ml-2 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DETAIL MODALS --- */}
      <PostDetailModal 
        post={selectedPost} 
        currentUser={currentUser}
        isOpen={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
        onDelete={handleDeletePost}
      />

      <AnimatePresence>
        {selectedScan && (
          <UserScanDetailModal 
            scan={selectedScan} 
            onClose={() => setSelectedScan(null)} 
            onDelete={() => promptDeleteScan(selectedScan)}
            onPost={() => handlePostToFeed(selectedScan)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scanToDelete && (
          <DeleteConfirmModal
            scan={scanToDelete}
            onClose={() => setScanToDelete(null)}
            onConfirm={confirmDeleteScan}
          />
        )}
      </AnimatePresence>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={currentUser} 
        onProfileUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          setProfileUser(updatedUser);
        }}
      />
    </div>
  );
};

// --- SUB-COMPONENT: USER SCAN DETAIL MODAL ---
const UserScanDetailModal = ({ scan, onClose, onDelete, onPost }) => {
  const widthIn = (scan.width_cm / 2.54).toFixed(2);
  const heightIn = (scan.height_cm / 2.54).toFixed(2);
  const displaySize = `${scan.width_cm}cm x ${scan.height_cm}cm`;
  const displaySizeIn = `(${widthIn}" x ${heightIn}")`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#293241]/60 backdrop-blur-sm"
      onClick={onClose} 
    >
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
      >
        {/* Left: Image */}
        <div className="w-full md:w-2/5 bg-black relative min-h-[300px] md:min-h-full group">
          <img src={scan.image} alt="Full Scan" className="absolute inset-0 w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
          
          <button onClick={onClose} className="absolute top-4 left-4 md:hidden bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors z-20">
            <X className="w-5 h-5" />
          </button>
  
          <div className="absolute bottom-6 left-6 right-6">
              <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 backdrop-blur-md ${
                  scan.health === 'Healthy' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
              }`}>
                 {scan.health} Status
              </span>
              <h2 className="text-2xl font-black text-white leading-tight">{scan.species}</h2>
              <p className="text-white/70 text-xs font-medium mt-1 flex items-center gap-2">
                  ID: <span className="font-mono text-white tracking-wider">{scan.id}</span>
              </p>
          </div>
        </div>
  
        {/* Right: Details */}
        <div className="w-full md:w-3/5 p-8 overflow-y-auto bg-white relative flex flex-col">
          <button onClick={onClose} className="hidden md:block absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
          </button>
  
          <div className="flex-1">
              <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Morphometrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <DetailBox label="Gender" value={scan.gender} icon={<User className="w-5 h-5 text-blue-500" />} />
                      <DetailBox label="Est. Age" value={scan.age} icon={<Activity className="w-5 h-5 text-orange-500" />} />
                      
                      <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                              <Ruler className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Size (WxH)</p>
                              <p className="text-sm font-black text-slate-800 truncate">{displaySize}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{displaySizeIn}</p>
                          </div>
                      </div>

                      <DetailBox label="Location" value={scan.location} icon={<MapPin className="w-5 h-5 text-red-500" />} />
                  </div>
              </div>
  
              <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">System Data</h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                  <Cpu className="w-4 h-4"/>
                              </div>
                              <div>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">AI Model</p>
                                  <p className="font-bold text-slate-700 text-xs">{scan.model}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-700">{scan.processingTime}s</span>
                              </div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Process Time</p>
                          </div>
                      </div>

                      <div className="h-px bg-slate-200 w-full" />

                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                                  <Droplets className="w-4 h-4"/>
                              </div>
                              <div>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Turbidity</p>
                                  <p className="font-bold text-slate-700">Lvl {scan.turbidity}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="text-right">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Algae</p>
                                  <p className="font-bold text-slate-700">{scan.algae}</p>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                  <Activity className="w-4 h-4"/>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
  
          <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
              <button 
                  onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-100 transition-colors"
              >
                  <Trash2 className="w-4 h-4" /> Delete Log
              </button>
              <button 
                  onClick={onPost}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#3D5A80] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#293241] shadow-lg shadow-[#3D5A80]/20 transition-all"
              >
                  <Share2 className="w-4 h-4" /> Post to Community
              </button>
          </div>
  
        </div>
      </motion.div>
    </div>
  );
};

// --- SUB-COMPONENT: CUSTOM DELETE CONFIRMATION MODAL ---
const DeleteConfirmModal = ({ scan, onClose, onConfirm }) => {
return (
  <div 
    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#293241]/70 backdrop-blur-md"
    onClick={onClose}
  >
    <motion.div 
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center"
    >
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Trash2 className="w-8 h-8" />
      </div>
      
      <h3 className="text-xl font-black text-slate-800 mb-2">Delete Scan Log?</h3>
      <p className="text-sm font-medium text-slate-500 mb-8">
        Are you sure you want to permanently delete <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded">{scan.id}</span>? This action cannot be undone.
      </p>

      <div className="flex gap-3">
        <button 
          onClick={onClose}
          className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
        >
          Yes, Delete
        </button>
      </div>
    </motion.div>
  </div>
);
};

const DetailBox = ({ label, value, icon }) => (
<div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
    {icon}
  </div>
  <div className="min-w-0">
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm font-black text-slate-800 truncate">{value}</p>
  </div>
</div>
);

export default ProfilePage;