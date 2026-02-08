import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  TextInput, Platform, StatusBar, FlatList, Dimensions, Keyboard, ScrollView, KeyboardAvoidingView, ActivityIndicator, Animated, Modal, TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API & Config
import client from '../api/client'; 
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

// Components
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';
import FloatingChatbot from '../components/FloatingChatbot';

// --- HELPER: TIME FORMATTER ---
const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9; 
const CARD_HEIGHT = height * 0.68; 

export default function CommunityScreen({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  
  // --- STATE ---
  const [postText, setPostText] = useState('');
  const [mediaList, setMediaList] = useState([]); 
  const [uploading, setUploading] = useState(false); 
  const [communityPosts, setCommunityPosts] = useState([]); 
  const [isGuest, setIsGuest] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // --- EDITING POST STATE ---
  const [editingPostId, setEditingPostId] = useState(null); 

  // --- MODAL STATES (NEW & EDIT COMMENT) ---
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [editCommentModalVisible, setEditCommentModalVisible] = useState(false); 
  
  const [activePostId, setActivePostId] = useState(null); // Post we are interacting with
  const [activeCommentId, setActiveCommentId] = useState(null); // Comment we are editing
  
  const [commentDraft, setCommentDraft] = useState(''); // New comment text
  const [editCommentDraft, setEditCommentDraft] = useState(''); // Edited comment text

  // --- MENUS & DELETE STATES ---
  const [optionsVisible, setOptionsVisible] = useState(false);        
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // For POSTS
  const [deleteCommentModalVisible, setDeleteCommentModalVisible] = useState(false); // For COMMENTS (NEW)
  
  const [selectedPostForOptions, setSelectedPostForOptions] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null); // Stores { post, commentId } for deletion

  // User Info
  const [currentUserInfo, setCurrentUserInfo] = useState({
    name: "Researcher",
    profilePic: null,
    uid: null,
    following: [] 
  });
  
  // --- TOAST STATE ---
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', body: '', type: 'info' });
  const toastAnim = useRef(new Animated.Value(-100)).current; 
  const scrollViewRef = useRef(); 

  // --- 1. KEYBOARD LISTENER ---
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardDidShowListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // --- 2. INITIAL LOAD ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setIsGuest(true);
          return;
        }
        setIsGuest(false);
        const userRes = await client.get('/auth/profile');
        if (userRes.data && userRes.data.user) {
          setCurrentUser(userRes.data.user);
          const realId = userRes.data.user._id || userRes.data.user.id;
          setCurrentUserInfo({
            name: userRes.data.user.firstName,
            profilePic: userRes.data.user.profilePic,
            uid: realId, 
            following: userRes.data.user.following || []
          });
        }
      } catch (error) { setIsGuest(true); }
    };
    fetchUser();
  }, []);

  // --- 3. FEED LISTENER ---
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await client.get('/posts/feed');
        if (res.data && res.data.posts) {
          const posts = res.data.posts.map(post => ({ ...post, showComments: true }));
          setCommunityPosts(posts);
        }
      } catch (error) { console.log('Error fetching feed:', error); }
    };
    fetchFeed();
    const interval = setInterval(fetchFeed, 10000); 
    return () => clearInterval(interval);
  }, []);

  // --- TOAST FUNCTION ---
  const showToast = (title, body, type = 'info') => {
    setToastMessage({ title, body, type });
    setToastVisible(true);
    Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }).start(() => setToastVisible(false));
    }, 3000);
  };

  const checkGuestAction = (actionName) => {
    if (isGuest) {
      showToast("Login Required", `Please log in to ${actionName}.`, 'error');
      return true; 
    }
    return false; 
  };

  // --- POST OPTIONS ---
  const openPostOptions = (post) => {
    setSelectedPostForOptions(post);
    setOptionsVisible(true);
  };

  const closePostOptions = () => {
    setOptionsVisible(false);
  };

  const handleOptionEdit = () => {
    if (selectedPostForOptions) {
      startEditPost(selectedPostForOptions);
    }
    closePostOptions();
    setSelectedPostForOptions(null);
  };

  const handleOptionDelete = () => {
    setOptionsVisible(false);
    setTimeout(() => {
      setDeleteModalVisible(true);
    }, 200);
  };

  const confirmDeletePost = () => {
    if (selectedPostForOptions) {
      handleDeletePost(selectedPostForOptions._id);
    }
    setDeleteModalVisible(false);
    setSelectedPostForOptions(null);
  };

  const cancelDeletePost = () => {
    setDeleteModalVisible(false);
    setSelectedPostForOptions(null);
  };

  // --- POST ACTIONS ---
  const handleDeletePost = async (postId) => {
    try {
      await client.delete(`/posts/${postId}`);
      setCommunityPosts(prev => prev.filter(p => p._id !== postId));
      showToast("Deleted", "Your post has been removed.", 'success');
    } catch (err) {
      showToast("Error", "Could not delete post.", 'error');
    }
  };

  const startEditPost = (post) => {
    setPostText(post.content);
    setMediaList(post.media || []); 
    setEditingPostId(post._id);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    showToast("Edit Mode", "Update your post at the top.", 'info');
  };

  const handleSubmitPost = async () => {
    if (checkGuestAction("post updates")) return;
    if (!postText.trim() && mediaList.length === 0) return;
    
    setUploading(true);
    Keyboard.dismiss();
    
    try {
      const mediaUrls = [];
      for (const asset of mediaList) {
        if (asset.uri && asset.uri.startsWith('http')) {
          mediaUrls.push(asset);
        } else {
          const uploaded = await uploadToCloudinary(asset);
          if (uploaded) mediaUrls.push(uploaded);
        }
      }
      
      if (editingPostId) {
        const res = await client.put(`/posts/${editingPostId}`, { content: postText, media: mediaUrls });
        if (res.data?.post) {
          setCommunityPosts(prev => prev.map(p => p._id === editingPostId ? { ...p, ...res.data.post, showComments: p.showComments } : p));
          showToast("Updated", "Post updated successfully.", 'success');
        }
      } else {
        const res = await client.post('/posts/create', { content: postText, media: mediaUrls });
        if (res.data?.post) {
          setCommunityPosts([{ ...res.data.post, showComments: true, commentsData: [] }, ...communityPosts]);
          showToast("Success", "Your post is live!", 'success');
        }
      }
      setPostText('');
      setMediaList([]);
      setEditingPostId(null);
    } catch (error) { 
      console.error(error); 
      showToast("Error", "Operation failed.", 'error'); 
    } finally { setUploading(false); }
  };

  // --- MEDIA HELPERS ---
  const pickMedia = async () => {
    if (checkGuestAction("upload photos")) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return showToast("Permission Required", "Gallery access needed.", 'error');
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, 
      allowsMultipleSelection: true, selectionLimit: 5, quality: 0.8,
    });
    if (!result.canceled) setMediaList(prev => [...prev, ...result.assets]);
  };

  const uploadToCloudinary = async (file) => {
    if (!CLOUDINARY_CONFIG?.cloudName) throw new Error("Cloudinary config missing");
    const formData = new FormData();
    const fileType = file.type === 'video' ? 'video/mp4' : 'image/jpeg';
    const fileName = file.type === 'video' ? 'upload.mp4' : 'upload.jpg';
    formData.append('file', { uri: file.uri, type: fileType, name: fileName });
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    const response = await fetch(CLOUDINARY_CONFIG.apiUrl, { method: 'POST', body: formData });
    const data = await response.json();
    return data.secure_url ? { uri: data.secure_url, mediaType: file.type } : null;
  };

  // --- SOCIAL ACTIONS ---
  const handleLike = async (post) => {
    if (checkGuestAction("like posts")) return;
    try {
      const res = await client.post(`/posts/${post._id}/like`);
      if (res.data?.post) {
        setCommunityPosts(prev => prev.map(p => p._id === post._id ? { ...p, likes: res.data.post.likes } : p));
      }
    } catch (error) { showToast("Error", "Could not like post.", 'error'); }
  };

  const handleFollow = async (targetUserId) => {
    if (checkGuestAction("follow users")) return;
    try {
      const res = await client.post(`/auth/follow/${targetUserId}`);
      if (res.data) {
        setCurrentUserInfo(prev => ({ ...prev, following: res.data.following || [] }));
        const isNowFollowing = res.data.isFollowing;
        showToast(isNowFollowing ? "Following" : "Unfollowed", isNowFollowing ? "You are now following this researcher." : "You unfollowed this user.", isNowFollowing ? 'success' : 'info');
      }
    } catch (error) { showToast("Error", "Could not update follow status.", 'error'); }
  };

  const handleMessageUser = (postItem) => {
    if (checkGuestAction("send messages")) return;
    const rawId = postItem.userId;
    const targetId = (rawId && typeof rawId === 'object') ? rawId._id : rawId;

    navigation.navigate('Chat', { 
      targetUser: { 
        uid: targetId, 
        name: postItem.user, 
        profilePic: postItem.userAvatar 
      } 
    });
  };

  // --- 1. NEW COMMENT LOGIC (MODAL) ---
  const openCommentModal = (postId) => {
    if (checkGuestAction("comment")) return;
    setActivePostId(postId);
    setCommentDraft('');
    setCommentModalVisible(true);
  };

  const closeCommentModal = () => {
    setCommentModalVisible(false);
    setActivePostId(null);
    setCommentDraft('');
    Keyboard.dismiss();
  };

  const submitCommentFromModal = async () => {
    if (!commentDraft.trim() || !activePostId) return;
    
    try {
      const res = await client.post(`/posts/${activePostId}/comment`, { text: commentDraft.trim() });
      if (res.data?.newComment) {
        setCommunityPosts(prev => prev.map(p => {
            if (p._id === activePostId) {
                return { ...p, commentsData: [...(p.commentsData || []), res.data.newComment] };
            }
            return p;
        }));
        closeCommentModal(); 
      }
    } catch (error) { showToast("Error", "Could not post comment.", 'error'); }
  };

  // --- 2. EDIT COMMENT LOGIC (MODAL) ---
  const openEditCommentModal = (post, comment) => {
    if (checkGuestAction("edit comment")) return;
    setActivePostId(post._id);
    setActiveCommentId(comment._id);
    setEditCommentDraft(comment.text);
    setEditCommentModalVisible(true);
  };

  const closeEditCommentModal = () => {
    setEditCommentModalVisible(false);
    setActivePostId(null);
    setActiveCommentId(null);
    setEditCommentDraft('');
    Keyboard.dismiss();
  };

  const submitEditCommentFromModal = async () => {
    if (!editCommentDraft.trim() || !activePostId || !activeCommentId) return;

    try {
      const res = await client.put(`/posts/${activePostId}/comment/${activeCommentId}`, { text: editCommentDraft.trim() });
      
      if (res.data?.comment) {
        setCommunityPosts(prev => prev.map(p => {
            if (p._id === activePostId) {
                return {
                    ...p,
                    commentsData: p.commentsData.map(c => 
                        c._id === activeCommentId ? { ...c, text: res.data.comment.text } : c
                    )
                };
            }
            return p;
        }));
        showToast("Updated", "Comment edited successfully.", 'success');
        closeEditCommentModal();
      }
    } catch (error) { showToast("Error", "Failed to edit comment.", 'error'); }
  };

  // --- 3. DELETE COMMENT LOGIC (WITH CONFIRMATION) ---
  const promptDeleteComment = (post, commentId) => {
    setCommentToDelete({ post, commentId });
    setDeleteCommentModalVisible(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    const { post, commentId } = commentToDelete;

    try {
      const res = await client.delete(`/posts/${post._id}/comment/${commentId}`);
      if (res.data?.success) {
        setCommunityPosts(prev => prev.map(p => {
            if (p._id === post._id) {
                return { ...p, commentsData: p.commentsData.filter(c => c._id !== commentId) };
            }
            return p;
        }));
        showToast("Deleted", "Comment removed.", 'success');
      }
    } catch (error) { showToast("Error", "Failed to delete comment.", 'error'); }
    
    // Close modal and reset state
    setDeleteCommentModalVisible(false);
    setCommentToDelete(null);
  };

  const cancelDeleteComment = () => {
    setDeleteCommentModalVisible(false);
    setCommentToDelete(null);
  };

  const toggleComments = (id) => {
    setCommunityPosts(prev => prev.map(p => p._id === id ? { ...p, showComments: !p.showComments } : p));
  };

  const handleProfileClick = (targetUserId) => {
    if (checkGuestAction("view profiles")) return;
    if (String(targetUserId) === String(currentUserInfo.uid)) navigation.navigate('Profile'); 
    else navigation.navigate('Profile', { userId: targetUserId });
  };

  // --- RENDER POST CARD ---
  const renderCard = ({ item }) => {
    const rawUserId = item.userId;
    const postUserId = (rawUserId && typeof rawUserId === 'object') ? rawUserId._id : rawUserId;
    const postUserIdString = String(postUserId);
    const currentUidString = currentUserInfo.uid ? String(currentUserInfo.uid) : '';
    const isLiked = item.likes?.some(id => String(id) === currentUidString);
    const isMyPost = !isGuest && (postUserIdString === currentUidString);
    const isFollowing = currentUserInfo.following?.includes(postUserIdString);

    return (
      <View style={[styles.cardContainer, styles.shadow]}>
        <ScrollView 
            nestedScrollEnabled={true} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
          <View style={styles.cardHeader}>
            <TouchableOpacity style={styles.userInfo} onPress={() => handleProfileClick(postUserId)}>
              <Image source={{ uri: item.userAvatar || 'https://avatar.iran.liara.run/public/12' }} style={styles.avatar} />
              <View>
                <Text style={styles.userName}>{item.user}</Text>
                <Text style={styles.userRole}>{formatTimeAgo(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
            {isMyPost ? (
              <TouchableOpacity style={styles.optionsBtn} onPress={() => openPostOptions(item)}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#7F8C8D" />
              </TouchableOpacity>
            ) : (
              !isGuest && (
                <TouchableOpacity 
                  style={[styles.followBtn, isFollowing ? styles.followingBtn : styles.notFollowingBtn]}
                  onPress={() => handleFollow(postUserId)}
                >
                  <Text style={[styles.followText, isFollowing && { color: '#3D5A80' }]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {item.media?.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
               {item.media.map((mediaItem, index) => (
                 <View key={`${item._id}-media-${index}`} style={styles.mediaWrapper}>
                   <Image source={{ uri: mediaItem.uri }} style={styles.cardImage} resizeMode="cover" />
                   {mediaItem.mediaType === 'video' && <View style={styles.playIconOverlay}><Ionicons name="play-circle" size={50} color="rgba(255,255,255,0.8)" /></View>}
                 </View>
               ))}
            </ScrollView>
          ) : (
            <View style={[styles.cardImage, styles.textOnlyPlaceholder]}>
              <MaterialCommunityIcons name="format-quote-open" size={40} color="#E0E7ED" />
            </View>
          )}

          <View style={styles.cardBody}>
            <Text style={styles.contentText}>{item.content}</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item)}>
              <View style={[styles.iconCircle, { backgroundColor: isLiked ? '#FFEBEE' : '#F4F7F9' }]}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#E76F51" : "#7F8C8D"} />
              </View>
              <Text style={styles.actionCount}>{item.likes?.length || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleComments(item._id)}>
              <View style={[styles.iconCircle, { backgroundColor: item.showComments ? '#D6EAF8' : '#E3F2FD' }]}>
                <Ionicons name="chatbubble" size={22} color="#3D5A80" />
              </View>
              <Text style={styles.actionCount}>{item.commentsData?.length || 0}</Text>
            </TouchableOpacity>

            {!isMyPost && !isGuest && (
              <TouchableOpacity style={[styles.actionBtn, { marginLeft: 15 }]} onPress={() => handleMessageUser(item)}>
                <View style={[styles.iconCircle, { backgroundColor: '#E8F8F5' }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#16A085" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {item.showComments && (
            <View style={styles.commentSectionContainer}>
              <Text style={styles.commentSectionTitle}>COMMENTS</Text>
              
              <View style={styles.existingComments}>
                {item.commentsData?.length > 0 ? (
                  item.commentsData.map((comment) => {
                    const isMyComment = !isGuest && (String(comment.userId) === currentUidString);

                    return (
                      <View key={comment._id} style={styles.commentRowContainer}>
                        <TouchableOpacity onPress={() => handleProfileClick(comment.userId)}>
                          <Image source={{ uri: comment.userAvatar || 'https://avatar.iran.liara.run/public/12' }} style={styles.commenterAvatar} />
                        </TouchableOpacity>
                        
                        <View style={styles.commentBubble}>
                          <View style={styles.commentHeaderRow}>
                            <TouchableOpacity onPress={() => handleProfileClick(comment.userId)}>
                              <Text style={styles.commentUser}>{comment.user}</Text>
                            </TouchableOpacity>
                            <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                                <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                                {isMyComment && (
                                    <View style={{flexDirection:'row', gap: 8}}>
                                        <TouchableOpacity onPress={() => openEditCommentModal(item, comment)}>
                                            <Ionicons name="pencil" size={14} color="#3D5A80" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => promptDeleteComment(item, comment._id)}>
                                            <Ionicons name="trash" size={14} color="#E76F51" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                          </View>
                          <Text style={styles.commentText}>{comment.text}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noComments}>No comments yet.</Text>
                )}
              </View>

              {!isGuest && (
                <View style={styles.addCommentRow}>
                  <Image source={currentUserInfo.profilePic ? { uri: currentUserInfo.profilePic } : require('../../assets/profile-icon.png')} style={styles.commentUserAvatarInput} />
                  
                  {/* FAKE INPUT -> TRIGGERS MODAL */}
                  <TouchableOpacity 
                    style={styles.fakeCommentInput} 
                    onPress={() => openCommentModal(item._id)}
                    activeOpacity={0.9}
                  >
                    <Text style={{color: '#95A5A6', fontSize: 13}}>Write a comment...</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openCommentModal(item._id)}>
                    <Ionicons name="send" size={20} color="#3D5A80" style={{marginLeft: 5}} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3D5A80" />
        
        <Header title="COMMUNITY" context="Community" onProfilePress={() => setSidebarVisible(true)} />
        
        <ScrollView 
            ref={scrollViewRef} 
            style={styles.mainScrollView} 
            contentContainerStyle={styles.mainScrollContent}
        >
          <View style={[styles.createPostContainer, styles.shadow, editingPostId && { borderColor: '#3D5A80', borderWidth: 2 }]}>
            {editingPostId && <Text style={styles.editModeLabel}>Editing Post...</Text>}
            <View style={styles.createPostTopRow}>
              <Image source={currentUserInfo.profilePic ? { uri: currentUserInfo.profilePic } : require('../../assets/profile-icon.png')} style={styles.userBarAvatar} />
              <TextInput 
                placeholder={isGuest ? "Log in to post..." : "Share your discovery..."}
                placeholderTextColor="#95A5A6"
                style={styles.createInput} 
                value={postText}
                onChangeText={setPostText}
                editable={!isGuest}
                onPressIn={() => checkGuestAction("post updates")}
              />
              <TouchableOpacity style={styles.attachBtn} onPress={pickMedia}><Ionicons name="images-outline" size={22} color="#7F8C8D" /></TouchableOpacity>
            </View>

            {mediaList.length > 0 && (
              <View style={styles.mediaPreviewContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mediaList.map((media, index) => (
                    <View key={`media-${index}`} style={styles.largePreviewWrapper}>
                      <Image source={{ uri: media.uri }} style={styles.largePreviewImage} />
                      <TouchableOpacity onPress={() => setMediaList(prev => prev.filter((_, i) => i !== index))} style={styles.removeBtnLarge}><Ionicons name="close" size={10} color="#FFF"/></TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {(postText || mediaList.length > 0) && (
              <View style={styles.sendRow}>
                {editingPostId && <TouchableOpacity onPress={() => { setEditingPostId(null); setPostText(''); setMediaList([]); }} style={{marginRight: 15}}><Text style={{color: '#E74C3C', fontWeight: '700'}}>Cancel</Text></TouchableOpacity>}
                <TouchableOpacity style={styles.sendButtonFull} onPress={handleSubmitPost} disabled={uploading}>{uploading ? <ActivityIndicator size="small" color="#FFF" /> : <><Text style={styles.sendButtonText}>{editingPostId ? "Update" : "Post"}</Text><Ionicons name={editingPostId ? "checkmark" : "arrow-forward"} size={16} color="#FFF" /></>}</TouchableOpacity>
              </View>
            )}
          </View>

          <FlatList
            data={communityPosts}
            renderItem={renderCard}
            keyExtractor={item => item._id}
            extraData={[currentUserInfo, activeCommentId]} 
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 20} 
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10 }}
            ListEmptyComponent={<Text style={styles.emptyFeedText}>No posts yet. Be the first!</Text>}
          />
          <View style={{ height: 200 }} /> 
        </ScrollView>

        {/* FOOTER & OVERLAYS */}
        {!isKeyboardVisible && (
          <>
              <BottomNavBar navigation={navigation} activeTab="Community" />
              <FloatingChatbot />
          </>
        )}

        <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} user={currentUser} navigation={navigation} />

        {toastVisible && (
          <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
            <View style={[styles.toastBar, toastMessage.type === 'error' ? styles.toastWarning : toastMessage.type === 'success' ? styles.toastSuccess : styles.toastInfo]}>
              <Ionicons name={toastMessage.type === 'error' ? "alert-circle" : toastMessage.type === 'success' ? "checkmark-circle" : "information-circle"} size={20} color="#FFF" />
              <Text style={styles.toastText} numberOfLines={1}>{toastMessage.title}: {toastMessage.body}</Text>
            </View>
          </Animated.View>
        )}

        {/* --- 1. NEW COMMENT MODAL --- */}
        <Modal visible={commentModalVisible} transparent animationType="slide" onRequestClose={closeCommentModal}>
          <TouchableWithoutFeedback onPress={closeCommentModal}>
              <View style={styles.modalOverlay}>
                  <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidModal}>
                      <TouchableWithoutFeedback>
                          <View style={styles.modalCommentContainer}>
                              <View style={styles.modalCommentHeader}>
                                  <Text style={styles.modalCommentTitle}>Add Comment</Text>
                                  <TouchableOpacity onPress={closeCommentModal}>
                                      <Ionicons name="close" size={24} color="#BDC3C7" />
                                  </TouchableOpacity>
                              </View>
                              <View style={styles.modalInputRow}>
                                  <TextInput 
                                      style={styles.modalTextInput}
                                      placeholder="Type your comment..."
                                      placeholderTextColor="#95A5A6"
                                      multiline
                                      autoFocus
                                      value={commentDraft}
                                      onChangeText={setCommentDraft}
                                  />
                                  <TouchableOpacity 
                                      style={[styles.modalSendBtn, !commentDraft.trim() && {backgroundColor: '#BDC3C7'}]} 
                                      onPress={submitCommentFromModal}
                                      disabled={!commentDraft.trim()}
                                  >
                                      <Ionicons name="arrow-up" size={20} color="#FFF" />
                                  </TouchableOpacity>
                              </View>
                          </View>
                      </TouchableWithoutFeedback>
                  </KeyboardAvoidingView>
              </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* --- 2. EDIT COMMENT MODAL (NEW) --- */}
        <Modal visible={editCommentModalVisible} transparent animationType="slide" onRequestClose={closeEditCommentModal}>
          <TouchableWithoutFeedback onPress={closeEditCommentModal}>
              <View style={styles.modalOverlay}>
                  <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidModal}>
                      <TouchableWithoutFeedback>
                          <View style={styles.modalCommentContainer}>
                              <View style={styles.modalCommentHeader}>
                                  <Text style={styles.modalCommentTitle}>Edit Comment</Text>
                                  <TouchableOpacity onPress={closeEditCommentModal}>
                                      <Ionicons name="close" size={24} color="#BDC3C7" />
                                  </TouchableOpacity>
                              </View>
                              <View style={styles.modalInputRow}>
                                  <TextInput 
                                      style={styles.modalTextInput}
                                      placeholder="Update your comment..."
                                      placeholderTextColor="#95A5A6"
                                      multiline
                                      autoFocus
                                      value={editCommentDraft}
                                      onChangeText={setEditCommentDraft}
                                  />
                                  <TouchableOpacity 
                                      style={[styles.modalSendBtn, !editCommentDraft.trim() && {backgroundColor: '#BDC3C7'}]} 
                                      onPress={submitEditCommentFromModal}
                                      disabled={!editCommentDraft.trim()}
                                  >
                                      <Ionicons name="checkmark" size={20} color="#FFF" />
                                  </TouchableOpacity>
                              </View>
                          </View>
                      </TouchableWithoutFeedback>
                  </KeyboardAvoidingView>
              </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* --- 3. DELETE COMMENT CONFIRMATION MODAL (NEW) --- */}
        <Modal animationType="fade" transparent={true} visible={deleteCommentModalVisible} onRequestClose={cancelDeleteComment}>
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContent}>
              <View style={styles.deleteIconCircle}><Ionicons name="trash" size={28} color="#E74C3C" /></View>
              <Text style={styles.deleteTitle}>Delete Comment?</Text>
              <Text style={styles.deleteSubText}>Are you sure you want to remove this comment? This action cannot be undone.</Text>
              <View style={styles.deleteActions}>
                <TouchableOpacity style={styles.deleteCancelBtn} onPress={cancelDeleteComment}><Text style={styles.deleteCancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDeleteComment}><Text style={styles.deleteConfirmText}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MANAGE POST MODAL */}
        <Modal animationType="fade" transparent={true} visible={optionsVisible} onRequestClose={closePostOptions}>
          <TouchableWithoutFeedback onPress={closePostOptions}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHandle} />
                  <Text style={styles.modalTitle}>Manage Post</Text>
                  <TouchableOpacity style={styles.modalOption} onPress={handleOptionEdit}>
                    <View style={[styles.modalIconBox, { backgroundColor: '#EBF5FB' }]}><Ionicons name="pencil" size={20} color="#3D5A80" /></View>
                    <Text style={styles.modalOptionText}>Edit Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalOption} onPress={handleOptionDelete}>
                    <View style={[styles.modalIconBox, { backgroundColor: '#FDEDEC' }]}><Ionicons name="trash-outline" size={20} color="#E74C3C" /></View>
                    <Text style={[styles.modalOptionText, { color: '#E74C3C' }]}>Delete Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={closePostOptions}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* DELETE POST CONFIRM MODAL */}
        <Modal animationType="fade" transparent={true} visible={deleteModalVisible} onRequestClose={cancelDeletePost}>
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContent}>
              <View style={styles.deleteIconCircle}><Ionicons name="trash" size={28} color="#E74C3C" /></View>
              <Text style={styles.deleteTitle}>Delete Post?</Text>
              <Text style={styles.deleteSubText}>Are you sure you want to remove this post? This action cannot be undone.</Text>
              <View style={styles.deleteActions}>
                <TouchableOpacity style={styles.deleteCancelBtn} onPress={cancelDeletePost}><Text style={styles.deleteCancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDeletePost}><Text style={styles.deleteConfirmText}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  
  // --- UPDATED TOAST STYLES ---
  toastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 20, left: 20, right: 20, zIndex: 9999, alignItems: 'center' },
  toastBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  toastWarning: { backgroundColor: '#E76F51' }, 
  toastSuccess: { backgroundColor: '#2A9D8F' }, 
  toastInfo: { backgroundColor: '#3D5A80' },    
  toastText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 10, flex: 1 },

  mainScrollView: { flex: 1 },
  mainScrollContent: { paddingBottom: 20 },
  
  // --- MODAL COMMENT STYLES ---
  keyboardAvoidModal: { flex: 1, justifyContent: 'flex-end' },
  modalCommentContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 15, paddingBottom: 30 },
  modalCommentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalCommentTitle: { fontWeight: '700', color: '#2C3E50', fontSize: 16 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F6F7', borderRadius: 25, paddingHorizontal: 5, paddingVertical: 5 },
  modalTextInput: { flex: 1, maxHeight: 100, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, color: '#2C3E50' },
  modalSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3D5A80', justifyContent: 'center', alignItems: 'center' },

  // --- POST CARD STYLES ---
  fakeCommentInput: { flex: 1, height: 36, justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40 },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E0E7ED', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#2C3E50', marginBottom: 20, textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F4F6F7' },
  modalIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  modalOptionText: { fontSize: 16, fontWeight: '600', color: '#34495E' },
  modalCancelBtn: { marginTop: 20, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F8F9F9', borderRadius: 12 },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#7F8C8D' },
  
  deleteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 25, padding: 25, alignItems: 'center', elevation: 10 },
  deleteIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FDEDEC', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  deleteTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E50', marginBottom: 10 },
  deleteSubText: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  deleteActions: { flexDirection: 'row', width: '100%', gap: 15 },
  deleteCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F0F3F4', alignItems: 'center' },
  deleteConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#E74C3C', alignItems: 'center' },
  deleteCancelText: { color: '#7F8C8D', fontWeight: '700', fontSize: 14 },
  deleteConfirmText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  createPostContainer: { marginHorizontal: 15, marginTop: 20, marginBottom: 10, backgroundColor: '#FFF', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#E0E7ED' },
  createPostTopRow: { flexDirection: 'row', alignItems: 'center' },
  userBarAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#F0F3F4' },
  createInput: { flex: 1, height: 40, fontSize: 15, color: '#2C3E50' },
  attachBtn: { padding: 8, backgroundColor: '#F4F7F9', borderRadius: 20 },
  editModeLabel: { color: '#3D5A80', fontWeight: '800', fontSize: 12, marginBottom: 5, marginLeft: 5 },
  mediaPreviewContainer: { marginTop: 12, height: 90 },
  largePreviewWrapper: { marginRight: 10, position: 'relative' },
  largePreviewImage: { width: 90, height: 90, borderRadius: 10, borderWidth: 1, borderColor: '#ECF0F1' },
  removeBtnLarge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sendRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  sendButtonFull: { flexDirection: 'row', backgroundColor: '#3D5A80', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', gap: 5 },
  sendButtonText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  cardContainer: { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: '#FFF', borderRadius: 25, marginHorizontal: 10, overflow: 'hidden', position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: '#F0F3F4' },
  userName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  userRole: { fontSize: 11, color: '#95A5A6', fontWeight: '600' },
  followBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  notFollowingBtn: { backgroundColor: '#3D5A80', borderColor: '#3D5A80' },
  followingBtn: { backgroundColor: '#FFF', borderColor: '#3D5A80' },
  followText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  optionsBtn: { padding: 5 },
  mediaScroll: { width: '100%', height: 320 },
  mediaWrapper: { position: 'relative', width: CARD_WIDTH },
  cardImage: { width: '100%', height: 320, backgroundColor: '#F8FAFC' },
  playIconOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  textOnlyPlaceholder: { height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F4F8' },
  cardBody: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  contentText: { fontSize: 15, color: '#546E7A', lineHeight: 22 },
  cardActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, paddingTop: 5, justifyContent: 'flex-start', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionCount: { fontSize: 16, fontWeight: '700', color: '#546E7A' },
  shareBtn: { marginLeft: 'auto', padding: 10 },
  commentSectionContainer: { backgroundColor: '#EEF2F6', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, flexGrow: 1 },
  commentSectionTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 },
  existingComments: { marginBottom: 15 },
  commentRowContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  commenterAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, marginTop: 2 },
  commentBubble: { flex: 1, backgroundColor: '#FFF', padding: 10, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  commentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  commentUser: { fontWeight: '700', color: '#2C3E50', fontSize: 13 },
  commentTime: { fontSize: 10, color: '#BDC3C7', fontWeight: '500' },
  commentText: { color: '#546E7A', fontSize: 13, lineHeight: 18 },
  editContainer: { gap: 8 },
  editInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, fontSize: 13 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  saveText: { color: '#3D5A80', fontWeight: '700', fontSize: 12 },
  cancelText: { color: '#E76F51', fontWeight: '700', fontSize: 12 },
  noComments: { color: '#95A5A6', fontSize: 13, fontStyle: 'italic', marginBottom: 10 },
  addCommentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, backgroundColor: '#FFF', padding: 5, borderRadius: 25, borderWidth: 1, borderColor: '#E0E7ED' },
  commentUserAvatarInput: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  commentInput: { flex: 1, height: 36, fontSize: 13, color: '#2C3E50' },
  guestCommentBtn: { backgroundColor: '#3D5A80', paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  guestCommentText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  emptyFeedText: { textAlign: 'center', marginTop: 50, color: '#95A5A6', fontStyle: 'italic' },
  swipeHint: { textAlign: 'center', color: '#BDC3C7', fontSize: 12, marginBottom: 10, marginTop: 10 },
  shadow: { ...Platform.select({ ios: { shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 5 } }) }
});