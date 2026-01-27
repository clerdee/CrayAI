import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  TextInput, Platform, StatusBar, FlatList, Dimensions, Keyboard, ScrollView, KeyboardAvoidingView, ActivityIndicator, Animated, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// 1. FIREBASE IMPORTS
import { 
  collection, addDoc, getDoc, doc, onSnapshot, 
  query, orderBy, serverTimestamp, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase'; 

// 2. CLOUDINARY IMPORTS
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

// 3. COMPONENT IMPORTS
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';

// --- HELPER: TIME FORMATTER ---
const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
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
  
  // --- STATE ---
  const [postText, setPostText] = useState('');
  const [mediaList, setMediaList] = useState([]); 
  const [uploading, setUploading] = useState(false); 
  const [communityPosts, setCommunityPosts] = useState([]); 
  
  // Editing State
  const [editingCommentId, setEditingCommentId] = useState(null); 
  const [editingText, setEditingText] = useState(''); 

  // User Info
  const [currentUserInfo, setCurrentUserInfo] = useState({
    name: "Researcher",
    profilePic: null,
    uid: auth.currentUser?.uid,
    following: []
  });
  
  const [commentInputs, setCommentInputs] = useState({});

  // --- CUSTOM TOAST STATE ---
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', body: '', type: 'info' });
  const toastAnim = useRef(new Animated.Value(-100)).current; 

  // --- CHECK GUEST STATUS ---
  const isGuest = !auth.currentUser || auth.currentUser.isAnonymous;

  // --- 1. FETCH CURRENT USER DATA ---
  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser && !isGuest) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentUserInfo({
              name: data.fullName || data.firstName || "Researcher",
              profilePic: data.profilePic,
              uid: auth.currentUser.uid,
              following: data.following || []
            });
          }
        });
        return () => unsubscribe();
      }
    };
    fetchUser();
  }, [isGuest]);

  // --- 2. REAL-TIME FEED LISTENER ---
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timeFormatted: formatTimeAgo(data.createdAt), 
          showComments: false, 
        };
      });
      setCommunityPosts(posts);
    });
    return unsubscribe;
  }, []);

  // --- TOAST FUNCTION ---
  const showToast = (title, body, type = 'info') => {
    setToastMessage({ title, body, type });
    setToastVisible(true);
    Animated.timing(toastAnim, { toValue: 50, duration: 300, useNativeDriver: true }).start();
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

  // --- 3. NAVIGATION (PROFILE CLICK) ---
  const handleProfileClick = (targetUserId) => {
    if (checkGuestAction("view profiles")) return;

    if (targetUserId === currentUserInfo.uid) {
      // It's me -> Go to my main Profile Tab
      navigation.navigate('Profile'); 
    } else {
      // It's someone else -> Go to Profile Screen with param
      // Ensure your ProfileScreen checks for route.params.userId!
      navigation.navigate('Profile', { userId: targetUserId });
    }
  };

  // --- 4. MEDIA PICKER ---
  const pickMedia = async () => {
    if (checkGuestAction("upload photos")) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast("Permission Required", "Gallery access needed.", 'error');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: 5, quality: 0.8,
    });
    if (!result.canceled) {
      const validAssets = [];
      let videoTooLong = false;
      result.assets.forEach(asset => {
        if (asset.type === 'video' && asset.duration > 30000) videoTooLong = true;
        else validAssets.push(asset);
      });
      if (videoTooLong) showToast("Video Limit", "Videos must be 30s or less.", 'error');
      if (validAssets.length > 0) setMediaList(prev => [...prev, ...validAssets]);
    }
  };

  const removeMedia = (indexToRemove) => {
    setMediaList(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- 5. CLOUDINARY UPLOAD ---
  const uploadToCloudinary = async (file) => {
    if (!CLOUDINARY_CONFIG || !CLOUDINARY_CONFIG.cloudName) throw new Error("Cloudinary config missing");
    const cloudName = CLOUDINARY_CONFIG.cloudName;
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const formData = new FormData();
    const filePayload = { uri: file.uri, type: file.type === 'video' ? 'video/mp4' : 'image/jpeg', name: file.type === 'video' ? 'upload.mp4' : 'upload.jpg' };
    formData.append('file', filePayload);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('cloud_name', cloudName);
    try {
      const response = await fetch(uploadUrl, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.secure_url) return { uri: data.secure_url, type: file.type };
      else throw new Error("Upload failed");
    } catch (error) { console.error("Cloudinary Error:", error); throw error; }
  };

  // --- 6. CREATE POST ---
  const handleCreatePost = async () => {
    if (checkGuestAction("create a post")) return;
    if (!postText.trim() && mediaList.length === 0) return;
    setUploading(true);
    Keyboard.dismiss();
    try {
      const mediaUrls = [];
      for (const asset of mediaList) {
        const uploadedMedia = await uploadToCloudinary(asset);
        mediaUrls.push(uploadedMedia);
      }
      await addDoc(collection(db, "posts"), {
        user: currentUserInfo.name,
        userAvatar: currentUserInfo.profilePic,
        userId: currentUserInfo.uid,
        content: postText,
        media: mediaUrls,
        createdAt: serverTimestamp(),
        likes: [], commentsData: [], commentsCount: 0
      });
      setPostText('');
      setMediaList([]);
      showToast("Success", "Your post is live!", 'success');
    } catch (error) { console.error("Post Error:", error); showToast("Error", "Could not upload post.", 'error'); } 
    finally { setUploading(false); }
  };

  // --- 7. ACTIONS ---
  const handleLike = async (post) => {
    if (checkGuestAction("like posts")) return;
    const postRef = doc(db, "posts", post.id);
    const uid = auth.currentUser.uid;
    if (post.likes.includes(uid)) await updateDoc(postRef, { likes: arrayRemove(uid) });
    else await updateDoc(postRef, { likes: arrayUnion(uid) });
  };

  const handlePostComment = async (post) => {
    if (checkGuestAction("comment")) return;
    const text = commentInputs[post.id];
    if (!text || !text.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      user: currentUserInfo.name,
      userAvatar: currentUserInfo.profilePic,
      text: text.trim(),
      userId: currentUserInfo.uid,
      createdAt: Date.now()
    };
    const postRef = doc(db, "posts", post.id);
    try {
      await updateDoc(postRef, { commentsData: arrayUnion(newComment), commentsCount: (post.commentsCount || 0) + 1 });
      setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
      Keyboard.dismiss();
    } catch (error) { showToast("Error", "Could not post comment.", 'error'); }
  };

  const handleDeleteComment = async (post, commentToDelete) => {
    const postRef = doc(db, "posts", post.id);
    const updatedComments = post.commentsData.filter(c => c.id !== commentToDelete.id);
    try {
        await updateDoc(postRef, { commentsData: updatedComments, commentsCount: updatedComments.length });
        showToast("Deleted", "Comment removed.", 'success');
    } catch(e) { showToast("Error", "Failed to delete.", 'error'); }
  };

  const saveEditedComment = async (post, commentId) => {
    if (!editingText.trim()) return;
    try {
      const postRef = doc(db, "posts", post.id);
      const updatedComments = post.commentsData.map(c => {
        if (c.id === commentId) return { ...c, text: editingText.trim() };
        return c;
      });
      await updateDoc(postRef, { commentsData: updatedComments });
      setEditingCommentId(null);
      setEditingText('');
      showToast("Updated", "Comment edited.", 'success');
    } catch (error) { console.error(error); }
  };

  const toggleComments = (id) => {
    setCommunityPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === id) return { ...post, showComments: !post.showComments };
        return post;
      })
    );
  };

  // --- 8. HANDLE FOLLOW ---
  const handleFollow = async (targetUserId) => {
    if (checkGuestAction("follow users")) return;

    try {
      const myUserRef = doc(db, "users", currentUserInfo.uid);
      if (currentUserInfo.following.includes(targetUserId)) {
        await updateDoc(myUserRef, { following: arrayRemove(targetUserId) });
        showToast("Unfollowed", "You are no longer following this user.", 'info');
      } else {
        await updateDoc(myUserRef, { following: arrayUnion(targetUserId) });
        showToast("Following", "You are now following this researcher!", 'success');
      }
    } catch (error) {
      console.error("Follow Error:", error);
      showToast("Error", "Could not update follow status.", 'error');
    }
  };

  const handleEmailClick = () => {
    if (checkGuestAction("send messages")) return;
    showToast("Coming Soon", "Direct messaging is under development.", 'info');
  };

  const updateCommentInput = (postId, text) => {
    setCommentInputs(prev => ({ ...prev, [postId]: text }));
  };

  // --- RENDER CARD ---
  const renderCard = ({ item }) => {
    const isLiked = item.likes && item.likes.includes(currentUserInfo.uid);
    const isMyPost = !isGuest && item.userId === currentUserInfo.uid;
    const isFollowing = currentUserInfo.following && currentUserInfo.following.includes(item.userId);

    return (
      <View style={[styles.cardContainer, styles.shadow]}>
        <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          
          <View style={styles.cardHeader}>
            {/* CLICKABLE USER INFO */}
            <TouchableOpacity 
              style={styles.userInfo} 
              onPress={() => handleProfileClick(item.userId)}
            >
              <Image source={{ uri: item.userAvatar || 'https://avatar.iran.liara.run/public/12' }} style={styles.avatar} />
              <View>
                <Text style={styles.userName}>{item.user}</Text>
                <Text style={styles.userRole}>{item.timeFormatted}</Text>
              </View>
            </TouchableOpacity>
            
            {!isMyPost && (
              <TouchableOpacity 
                style={[styles.followBtn, isFollowing ? styles.followingBtn : styles.notFollowingBtn]}
                onPress={() => handleFollow(item.userId)}
              >
                <Text style={[styles.followText, isFollowing && { color: '#3D5A80' }]}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {item.media && item.media.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
               {item.media.map((mediaItem, index) => (
                 <View key={index} style={styles.mediaWrapper}>
                   <Image source={{ uri: mediaItem.uri }} style={styles.cardImage} resizeMode="cover" />
                   {mediaItem.type === 'video' && (
                     <View style={styles.playIconOverlay}><Ionicons name="play-circle" size={50} color="rgba(255,255,255,0.8)" /></View>
                   )}
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
              <Text style={styles.actionCount}>{item.likes ? item.likes.length : 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleComments(item.id)}>
              <View style={[styles.iconCircle, { backgroundColor: item.showComments ? '#D6EAF8' : '#E3F2FD' }]}>
                <Ionicons name="chatbubble" size={22} color="#3D5A80" />
              </View>
              <Text style={styles.actionCount}>{item.commentsCount || 0}</Text>
            </TouchableOpacity>

            {!isMyPost && (
              <TouchableOpacity style={styles.shareBtn} onPress={handleEmailClick}>
                <Ionicons name="mail-outline" size={24} color="#BDC3C7" />
              </TouchableOpacity>
            )}
          </View>

          {item.showComments && (
            <View style={styles.commentSectionContainer}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.commentSectionTitle}>Comments</Text>
              </View>
              
              <View style={styles.existingComments}>
                {item.commentsData && item.commentsData.length > 0 ? (
                  item.commentsData.map((comment, index) => {
                    const isMyComment = !isGuest && comment.userId === currentUserInfo.uid;
                    const isEditing = editingCommentId === comment.id;

                    return (
                      <View key={index} style={styles.commentRowContainer}>
                        {/* CLICKABLE AVATAR IN COMMENTS */}
                        <TouchableOpacity onPress={() => handleProfileClick(comment.userId)}>
                          <Image 
                            source={{ uri: comment.userAvatar || 'https://avatar.iran.liara.run/public/12' }} 
                            style={styles.commenterAvatar} 
                          />
                        </TouchableOpacity>
                        
                        <View style={styles.commentBubble}>
                          <View style={styles.commentHeaderRow}>
                            <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
                              {/* CLICKABLE NAME IN COMMENTS */}
                              <TouchableOpacity onPress={() => handleProfileClick(comment.userId)}>
                                <Text style={styles.commentUser}>{comment.user}</Text>
                              </TouchableOpacity>
                              <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                            </View>
                            
                            {isMyComment && !isEditing && (
                              <View style={styles.commentOptions}>
                                <TouchableOpacity onPress={() => { setEditingCommentId(comment.id); setEditingText(comment.text); }} style={styles.optionIcon}>
                                  <Ionicons name="pencil" size={14} color="#3D5A80" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteComment(item, comment)} style={styles.optionIcon}>
                                  <Ionicons name="trash" size={14} color="#E76F51" />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>

                          {isEditing ? (
                            <View style={styles.editContainer}>
                              <TextInput 
                                style={styles.editInput} 
                                value={editingText} 
                                onChangeText={setEditingText}
                                autoFocus 
                              />
                              <View style={styles.editActions}>
                                <TouchableOpacity onPress={() => saveEditedComment(item, comment.id)}>
                                  <Text style={styles.saveText}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setEditingCommentId(null); setEditingText(''); }}>
                                  <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <Text style={styles.commentText}>{comment.text}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noComments}>No comments yet.</Text>
                )}
              </View>

              {isGuest ? (
                <TouchableOpacity 
                  style={styles.guestCommentBtn} 
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.guestCommentText}>Log in to join the discussion</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.addCommentRow}>
                  <Image 
                    source={currentUserInfo.profilePic ? { uri: currentUserInfo.profilePic } : require('../../assets/profile-icon.png')} 
                    style={styles.commentUserAvatarInput} 
                  />
                  <TextInput 
                    placeholder="Write a comment..." 
                    style={styles.commentInput} 
                    placeholderTextColor="#95A5A6"
                    value={commentInputs[item.id] || ''}
                    onChangeText={(text) => updateCommentInput(item.id, text)}
                  />
                  <TouchableOpacity onPress={() => handlePostComment(item)}>
                    <Ionicons name="send" size={20} color="#3D5A80" style={{marginLeft: 5}} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ height: 20 }} /> 
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
        <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} navigation={navigation}/>
        <Header title="COMMUNITY" onProfilePress={() => setSidebarVisible(true)} />

        {/* --- CUSTOM TOP TOAST --- */}
        {toastVisible && (
          <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
            <View style={[styles.toastIcon, { backgroundColor: toastMessage.type === 'error' ? '#E74C3C' : (toastMessage.type === 'success' ? '#2ECC71' : '#3D5A80') }]}>
              <Ionicons 
                name={toastMessage.type === 'error' ? 'alert-circle' : (toastMessage.type === 'success' ? 'checkmark-circle' : 'information-circle')} 
                size={24} color="#FFF" 
              />
            </View>
            <View style={styles.toastContent}>
              <Text style={styles.toastTitle}>{toastMessage.title}</Text>
              <Text style={styles.toastBody}>{toastMessage.body}</Text>
            </View>
          </Animated.View>
        )}

        <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.mainScrollContent}>
          
          {/* CREATE POST BAR */}
          <View style={[styles.createPostContainer, styles.shadow]}>
            <View style={styles.createPostTopRow}>
              <Image 
                source={isGuest ? require('../../assets/profile-icon.png') : (currentUserInfo.profilePic ? { uri: currentUserInfo.profilePic } : require('../../assets/profile-icon.png'))} 
                style={styles.userBarAvatar} 
              />
              {isGuest ? (
                <TouchableOpacity style={{flex: 1}} onPress={() => checkGuestAction("post updates")}>
                  <Text style={[styles.createInput, { color: '#95A5A6', paddingTop: 10 }]}>Log in to share your discovery...</Text>
                </TouchableOpacity>
              ) : (
                <TextInput 
                  placeholder="Share your discovery..." 
                  placeholderTextColor="#95A5A6"
                  style={styles.createInput} 
                  value={postText}
                  onChangeText={setPostText}
                />
              )}
              
              <TouchableOpacity style={styles.attachBtn} onPress={pickMedia}>
                <Ionicons name="images-outline" size={22} color="#7F8C8D" />
              </TouchableOpacity>
            </View>

            {mediaList.length > 0 && (
              <View style={styles.mediaPreviewContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mediaList.map((media, index) => (
                    <View key={index} style={styles.largePreviewWrapper}>
                      <Image source={{ uri: media.uri }} style={styles.largePreviewImage} />
                      {media.type === 'video' && (
                        <View style={styles.videoOverlay}><Ionicons name="play" size={12} color="#FFF"/></View>
                      )}
                      <TouchableOpacity onPress={() => removeMedia(index)} style={styles.removeBtnLarge}>
                        <Ionicons name="close" size={10} color="#FFF"/>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {(postText.trim() || mediaList.length > 0) && (
              <View style={styles.sendRow}>
                <TouchableOpacity style={styles.sendButtonFull} onPress={handleCreatePost} disabled={uploading}>
                  {uploading ? <ActivityIndicator size="small" color="#FFF" /> : (
                    <>
                      <Text style={styles.sendButtonText}>Post Update</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* FEED LIST */}
          <FlatList
            data={communityPosts}
            renderItem={renderCard}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 20} 
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10 }}
            nestedScrollEnabled={true} 
            ListEmptyComponent={
              <Text style={styles.emptyFeedText}>No posts yet. Be the first to share!</Text>
            }
          />

          <Text style={styles.swipeHint}>Swipe left to explore • Scroll inside cards for comments</Text>
          <View style={{ height: 100 }} />
        </ScrollView>

        <BottomNavBar navigation={navigation} activeTab="Community" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  
  // --- TOAST STYLES ---
  toastContainer: {
    position: 'absolute', top: 0, left: 20, right: 20,
    backgroundColor: '#FFF', borderRadius: 12, flexDirection: 'row', padding: 15,
    zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 10, alignItems: 'center',
  },
  toastIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  toastContent: { flex: 1 },
  toastTitle: { fontSize: 15, fontWeight: '700', color: '#2C3E50', marginBottom: 2 },
  toastBody: { fontSize: 13, color: '#7F8C8D' },

  mainScrollView: { flex: 1 },
  mainScrollContent: { paddingBottom: 20 },
  
  createPostContainer: { marginHorizontal: 15, marginTop: 20, marginBottom: 10, backgroundColor: '#FFF', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#E0E7ED' },
  createPostTopRow: { flexDirection: 'row', alignItems: 'center' },
  userBarAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#F0F3F4' },
  createInput: { flex: 1, height: 40, fontSize: 15, color: '#2C3E50' },
  attachBtn: { padding: 8, backgroundColor: '#F4F7F9', borderRadius: 20 },
  
  mediaPreviewContainer: { marginTop: 12, height: 90 },
  largePreviewWrapper: { marginRight: 10, position: 'relative' },
  largePreviewImage: { width: 90, height: 90, borderRadius: 10, borderWidth: 1, borderColor: '#ECF0F1' },
  removeBtnLarge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  videoOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10 },

  sendRow: { marginTop: 10, alignItems: 'flex-end' },
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
  sectionTitleRow: { marginBottom: 10 },
  commentSectionTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  existingComments: { marginBottom: 15 },
  
  commentRowContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  commenterAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, marginTop: 2 },
  commentBubble: { flex: 1, backgroundColor: '#FFF', padding: 10, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  commentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  commentUser: { fontWeight: '700', color: '#2C3E50', fontSize: 13 },
  commentTime: { fontSize: 10, color: '#BDC3C7', fontWeight: '500' },
  commentOptions: { flexDirection: 'row', gap: 10 },
  optionIcon: { padding: 2 },
  commentText: { color: '#546E7A', fontSize: 13, lineHeight: 18 },
  
  editContainer: { flexDirection: 'column', gap: 5 },
  editInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, fontSize: 13, color: '#2C3E50' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 5 },
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