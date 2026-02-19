import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, Image, TouchableOpacity, 
  ScrollView, Dimensions, TouchableWithoutFeedback, TextInput, 
  Switch, ActivityIndicator, Alert, Platform // <-- ADDED Platform HERE
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import client from '../api/client';

// Import Bad Words for filtering
import { BAD_WORDS } from '../data/badWords';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
// FIXED HEIGHT: 65% of screen height slightly taller to accommodate edit inputs nicely
const CARD_HEIGHT = height * 0.65;

// --- HELPERS ---

const getMediaUri = (mediaItem) => {
  if (!mediaItem) return null;
  if (typeof mediaItem === 'string') return mediaItem;
  return mediaItem.uri;
};

const formatFullDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString();
};

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const maskProfanity = (text) => {
  if (!text) return "";
  let cleanText = text;
  const sortedBadWords = [...BAD_WORDS].sort((a, b) => b.length - a.length);
  sortedBadWords.forEach(word => {
    const escapedWord = escapeRegExp(word);
    const hasSymbols = /[^a-zA-Z0-9]/.test(word);
    const regex = hasSymbols ? new RegExp(escapedWord, 'gi') : new RegExp(`\\b${escapedWord}\\b`, 'gi');
    cleanText = cleanText.replace(regex, '*'.repeat(word.length));
  });
  return cleanText;
};

// --- COMPONENT ---

export default function PostDetailModal({ visible, post, onClose, currentUserId, onUpdate }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState('details'); // 'details' | 'comments' | 'edit'

  // --- EDIT STATE ---
  const [editContent, setEditContent] = useState('');
  const [editIsForSale, setEditIsForSale] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editIsSold, setEditIsSold] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible && post) {
      setActiveIndex(0);
      setViewMode('details'); 
      
      // Pre-fill edit states
      setEditContent(post.content || '');
      setEditIsForSale(post.isForSale || false);
      setEditPrice(post.price ? String(post.price) : '');
      setEditIsSold(post.isSold || false);

      if(scrollRef.current) {
        scrollRef.current.scrollTo({ x: 0, animated: false });
      }
    }
  }, [visible, post]);

  if (!post) return null;

  const totalImages = post.media ? post.media.length : 0;
  
  // SECURE EDIT CHECK: Only the creator can edit
  const postUserId = typeof post.userId === 'object' ? post.userId?._id : post.userId;
  const isMyPost = String(postUserId) === String(currentUserId);

  // --- SCROLL HANDLERS ---
  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  const scrollToIndex = (index) => {
    scrollRef.current?.scrollTo({ x: index * CARD_WIDTH, animated: true });
    setActiveIndex(index);
  };

  const handleNext = () => { if (activeIndex < totalImages - 1) scrollToIndex(activeIndex + 1); };
  const handlePrev = () => { if (activeIndex > 0) scrollToIndex(activeIndex - 1); };

  // --- SAVE EDIT HANDLER ---
  const handleSaveEdit = async () => {
    if (editIsForSale && (!editPrice || isNaN(parseFloat(editPrice)))) {
        return Alert.alert("Validation", "Please enter a valid price.");
    }

    setIsSaving(true);
    try {
        const payload = {
            content: editContent,
            isForSale: editIsForSale,
            price: editIsForSale ? parseFloat(editPrice) : 0,
            isSold: editIsSold
        };

        const res = await client.put(`/posts/${post._id}`, payload);
        if (res.data?.post) {
            // Send updated post back to parent screen
            if (onUpdate) onUpdate(res.data.post);
            setViewMode('details');
        }
    } catch (error) {
        console.error("Failed to update post:", error);
        Alert.alert("Error", "Could not update your post.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { height: CARD_HEIGHT }]}>
              
              {/* ============================================================== */}
              {/* VIEW 1: DETAILS (Photos + Caption)                             */}
              {/* ============================================================== */}
              {viewMode === 'details' && (
                <>
                  <View style={styles.header}>
                    <View style={styles.userInfo}>
                      <Image 
                        source={post.userAvatar ? { uri: post.userAvatar } : require('../../assets/profile-icon.png')} 
                        style={styles.avatar} 
                      />
                      <View>
                        <Text style={styles.userName}>{post.user || "Researcher"}</Text>
                        <Text style={styles.dateText}>{formatFullDate(post.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      {isMyPost && (
                        <TouchableOpacity onPress={() => setViewMode('edit')} style={[styles.iconBtn, { marginRight: 8, backgroundColor: '#EBF5FB' }]}>
                          <Ionicons name="pencil" size={20} color="#3D5A80" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                        <Ionicons name="close" size={24} color="#546E7A" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Media Carousel */}
                    {totalImages > 0 ? (
                      <View style={styles.mediaContainer}>
                        <ScrollView 
                          ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                          style={styles.mediaScroll} onMomentumScrollEnd={handleScroll}
                        >
                          {post.media.map((item, index) => (
                            <View key={index} style={styles.imageWrapper}>
                              <Image source={{ uri: getMediaUri(item) }} style={styles.mediaImage} resizeMode="cover" />
                            </View>
                          ))}
                        </ScrollView>
                        
                        {totalImages > 1 && (
                          <>
                            {activeIndex > 0 && <TouchableOpacity style={[styles.navBtn, styles.navBtnLeft]} onPress={handlePrev}><Ionicons name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>}
                            {activeIndex < totalImages - 1 && <TouchableOpacity style={[styles.navBtn, styles.navBtnRight]} onPress={handleNext}><Ionicons name="chevron-forward" size={24} color="#FFF" /></TouchableOpacity>}
                            <View style={styles.pagination}>
                              {post.media.map((_, i) => <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />)}
                            </View>
                          </>
                        )}
                      </View>
                    ) : (
                      <View style={styles.textOnlyBox}><Ionicons name="document-text-outline" size={40} color="#CFD8DC" /></View>
                    )}

                    <View style={styles.detailsContainer}>
                      {/* --- MARKETPLACE TAG RENDERING W/ SOLD STATE --- */}
                      {post.isForSale && post.price > 0 && (
                          <View style={[styles.priceTagBadge, post.isSold && { backgroundColor: '#95A5A6' }]}>
                            <MaterialCommunityIcons name={post.isSold ? "check-circle" : "tag"} size={14} color="#FFF" />
                            <Text style={styles.priceTagText}>
                              {post.isSold ? `Already Sold` : `For Sale: ₱${post.price}`}
                            </Text>
                          </View>
                      )}
                      
                      <Text style={styles.caption}>{maskProfanity(post.content || "No caption provided.")}</Text>
                    </View>
                  </ScrollView>

                  <View style={styles.footer}>
                    <View style={styles.statBadge}>
                      <Ionicons name="heart" size={18} color="#E76F51" />
                      <Text style={styles.statText}>{post.likes ? post.likes.length : 0} <Text style={styles.statLabel}>Likes</Text></Text>
                    </View>
                    <View style={styles.divider} />
                    
                    <TouchableOpacity style={styles.statBadge} onPress={() => setViewMode('comments')}>
                      <Ionicons name="chatbubble" size={17} color="#3D5A80" />
                      <Text style={styles.statText}>{post.commentsData ? post.commentsData.length : 0} <Text style={styles.statLabel}>Comments</Text></Text>
                      <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{marginLeft: 4}} />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 2: COMMENTS LIST                                          */}
              {/* ============================================================== */}
              {viewMode === 'comments' && (
                <>
                  <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                      <TouchableOpacity onPress={() => setViewMode('details')} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color="#3D5A80" />
                      </TouchableOpacity>
                      <Text style={styles.headerTitle}>Comments</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                      <Ionicons name="close" size={24} color="#546E7A" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.commentsList} contentContainerStyle={{padding: 20}}>
                    {post.commentsData && post.commentsData.length > 0 ? (
                      post.commentsData.map((comment, index) => (
                        <View key={index} style={styles.commentItem}>
                          <Image 
                            source={comment.userAvatar ? { uri: comment.userAvatar } : require('../../assets/profile-icon.png')} 
                            style={styles.commentAvatar} 
                          />
                          <View style={styles.commentContent}>
                            <View style={styles.commentTop}>
                              <Text style={styles.commentUser}>{comment.user}</Text>
                              <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                            </View>
                            <Text style={styles.commentText}>{maskProfanity(comment.text)}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyStateContainer}>
                        <Ionicons name="chatbubble-outline" size={40} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No comments yet.</Text>
                      </View>
                    )}
                  </ScrollView>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 3: EDIT MODE                                              */}
              {/* ============================================================== */}
              {viewMode === 'edit' && (
                <>
                  <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                      <TouchableOpacity onPress={() => setViewMode('details')} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color="#3D5A80" />
                      </TouchableOpacity>
                      <Text style={styles.headerTitle}>Edit Post</Text>
                    </View>
                  </View>

                  <ScrollView style={styles.editScroll} contentContainerStyle={{padding: 20}}>
                    
                    <Text style={styles.editLabel}>Caption</Text>
                    <TextInput
                        style={styles.editInput}
                        value={editContent}
                        onChangeText={setEditContent}
                        multiline
                        placeholder="Update your caption..."
                    />

                    {/* MARKETPLACE SETTINGS */}
                    <View style={styles.marketplaceToggleContainer}>
                      <View style={styles.marketplaceToggleRow}>
                        <View style={styles.marketplaceToggleLeft}>
                          <MaterialCommunityIcons name="tag-outline" size={18} color="#7F8C8D" />
                          <Text style={styles.marketplaceLabel}>List this for sale?</Text>
                          <Switch
                            value={editIsForSale}
                            onValueChange={setEditIsForSale}
                            trackColor={{ false: '#E0E7ED', true: '#2A9D8F' }}
                            thumbColor={Platform.OS === 'ios' ? '#FFF' : (editIsForSale ? '#FFF' : '#F4F6F7')}
                            style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] } : {}}
                          />
                        </View>

                        {editIsForSale && (
                          <View style={styles.priceInputContainer}>
                            <Text style={styles.currencySymbol}>₱</Text>
                            <TextInput
                              style={styles.priceInput}
                              placeholder="0.00"
                              placeholderTextColor="#95A5A6"
                              keyboardType="numeric"
                              value={editPrice}
                              onChangeText={setEditPrice}
                            />
                          </View>
                        )}
                      </View>

                      {/* ALREADY SOLD TOGGLE (Only appears if For Sale is TRUE) */}
                      {editIsForSale && (
                        <View style={[styles.marketplaceToggleRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#F0F3F4' }]}>
                           <View style={styles.marketplaceToggleLeft}>
                              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#7F8C8D" />
                              <Text style={styles.marketplaceLabel}>Mark as Sold?</Text>
                              <Switch
                                value={editIsSold}
                                onValueChange={setEditIsSold}
                                trackColor={{ false: '#E0E7ED', true: '#E76F51' }}
                                thumbColor={Platform.OS === 'ios' ? '#FFF' : (editIsSold ? '#FFF' : '#F4F6F7')}
                                style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] } : {}}
                              />
                           </View>
                        </View>
                      )}
                    </View>

                    {/* SAVE BUTTON */}
                    <TouchableOpacity 
                        style={[styles.saveBtn, isSaving && { backgroundColor: '#94A3B8' }]} 
                        onPress={handleSaveEdit}
                        disabled={isSaving}
                    >
                        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>

                  </ScrollView>
                </>
              )}

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.85)', justifyContent: 'center', alignItems: 'center' },
  
  card: { 
    width: CARD_WIDTH, 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    overflow: 'hidden', 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    elevation: 10 
  },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFF', minHeight: 70 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  userName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  dateText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  iconBtn: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 20 },
  
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#334155' },

  scrollContent: { paddingBottom: 20 },
  
  mediaContainer: { position: 'relative', width: '100%', height: 280, backgroundColor: '#000' }, 
  mediaScroll: { width: '100%', height: '100%' },
  imageWrapper: { width: CARD_WIDTH, height: 280, justifyContent: 'center', alignItems: 'center' },
  mediaImage: { width: '100%', height: '100%' },
  
  navBtn: { position: 'absolute', top: '50%', marginTop: -20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  navBtnLeft: { left: 10 },
  navBtnRight: { right: 10 },
  
  pagination: { position: 'absolute', bottom: 15, alignSelf: 'center', flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#FFF', width: 8, height: 8, borderRadius: 4 },
  
  textOnlyBox: { width: '100%', height: 150, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  
  detailsContainer: { padding: 20 },
  
  priceTagBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A9D8F', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 10 },
  priceTagText: { color: '#FFF', fontWeight: '800', fontSize: 12, marginLeft: 6 },
  caption: { fontSize: 15, color: '#334155', lineHeight: 24 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FAFAFA', position: 'absolute', bottom: 0, width: '100%' },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 5 },
  statText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  statLabel: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  divider: { width: 1, height: 20, backgroundColor: '#E2E8F0' },

  commentsList: { flex: 1, backgroundColor: '#F8FAFC' },
  commentItem: { flexDirection: 'row', marginBottom: 20 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1, borderColor: '#FFF' },
  commentContent: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderTopLeftRadius: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { fontSize: 13, fontWeight: '700', color: '#334155' },
  commentTime: { fontSize: 11, color: '#94A3B8' },
  commentText: { fontSize: 13, color: '#475569', lineHeight: 19 },
  emptyStateContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94A3B8', marginTop: 10, fontSize: 14 },

  // --- EDIT MODE STYLES ---
  editScroll: { flex: 1, backgroundColor: '#F8FAFC' },
  editLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  editInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 15, fontSize: 15, color: '#1E293B', minHeight: 120, textAlignVertical: 'top', marginBottom: 20 },
  
  marketplaceToggleContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  marketplaceToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  marketplaceToggleLeft: { flexDirection: 'row', alignItems: 'center' },
  marketplaceLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginLeft: 8, marginRight: 8 },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F7F9', borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E0E7ED' },
  currencySymbol: { fontWeight: '800', color: '#2A9D8F', marginRight: 4, fontSize: 15 },
  priceInput: { height: 35, width: 70, fontSize: 14, fontWeight: '700', color: '#2C3E50' },

  saveBtn: { backgroundColor: '#3D5A80', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});