import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, Image, TouchableOpacity, 
  ScrollView, Dimensions, TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import Bad Words for filtering
import { BAD_WORDS } from '../data/badWords';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
// FIXED HEIGHT: 60% of screen height (Compact & Consistent)
const CARD_HEIGHT = height * 0.60;

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

export default function PostDetailModal({ visible, post, onClose }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState('details'); // 'details' | 'comments'

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setActiveIndex(0);
      setViewMode('details'); 
      if(scrollRef.current) {
        scrollRef.current.scrollTo({ x: 0, animated: false });
      }
    }
  }, [visible, post]);

  if (!post) return null;

  const totalImages = post.media ? post.media.length : 0;

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

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            {/* FIXED HEIGHT CARD */}
            <View style={[styles.card, { height: CARD_HEIGHT }]}>
              
              {/* === VIEW 1: DETAILS (Photos + Caption) === */}
              {viewMode === 'details' ? (
                <>
                  {/* Header */}
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
                    <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                      <Ionicons name="close" size={24} color="#546E7A" />
                    </TouchableOpacity>
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
                        
                        {/* Nav Buttons */}
                        {totalImages > 1 && (
                          <>
                            {activeIndex > 0 && <TouchableOpacity style={[styles.navBtn, styles.navBtnLeft]} onPress={handlePrev}><Ionicons name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>}
                            {activeIndex < totalImages - 1 && <TouchableOpacity style={[styles.navBtn, styles.navBtnRight]} onPress={handleNext}><Ionicons name="chevron-forward" size={24} color="#FFF" /></TouchableOpacity>}
                          </>
                        )}
                        {/* Pagination */}
                        {totalImages > 1 && (
                          <View style={styles.pagination}>
                            {post.media.map((_, i) => <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />)}
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.textOnlyBox}><Ionicons name="document-text-outline" size={40} color="#CFD8DC" /></View>
                    )}

                    {/* Caption */}
                    <View style={styles.detailsContainer}>
                      <Text style={styles.caption}>{maskProfanity(post.content || "No caption provided.")}</Text>
                    </View>
                  </ScrollView>

                  {/* Footer Stats */}
                  <View style={styles.footer}>
                    <View style={styles.statBadge}>
                      <Ionicons name="heart" size={18} color="#E76F51" />
                      <Text style={styles.statText}>{post.likes ? post.likes.length : 0} <Text style={styles.statLabel}>Likes</Text></Text>
                    </View>
                    <View style={styles.divider} />
                    
                    {/* Switch to Comments View */}
                    <TouchableOpacity style={styles.statBadge} onPress={() => setViewMode('comments')}>
                      <Ionicons name="chatbubble" size={17} color="#3D5A80" />
                      <Text style={styles.statText}>{post.commentsData ? post.commentsData.length : 0} <Text style={styles.statLabel}>Comments</Text></Text>
                      <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{marginLeft: 4}} />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                
                /* === VIEW 2: COMMENTS LIST === */
                <>
                  {/* Comments Header */}
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

                  {/* Comments List */}
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
                      <View style={styles.emptyComments}>
                        <Ionicons name="chatbubble-outline" size={40} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No comments yet.</Text>
                      </View>
                    )}
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
    height: CARD_HEIGHT, // Enforce fixed height
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
  
  mediaContainer: { position: 'relative', width: '100%', height: 280, backgroundColor: '#000' }, // Slightly reduced media height
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
  emptyComments: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94A3B8', marginTop: 10, fontSize: 14 }
});