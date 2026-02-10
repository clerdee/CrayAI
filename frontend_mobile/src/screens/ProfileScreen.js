import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Image, FlatList, 
  TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

// API Import
import client from '../api/client';

// Component Imports
import BottomNavBar from '../components/BottomNavBar';
import PostDetailModal from '../components/PostDetailModal'; // <--- NEW IMPORT

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

export default function ProfileScreen({ navigation, route }) {
  // 1. IDENTIFY USER
  const targetUserId = route?.params?.userId;
  const isViewingSelf = !targetUserId;
  
  // 2. STATE MANAGEMENT
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]); 
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false); 
  const [loading, setLoading] = useState(true);
  
  const [followLoading, setFollowLoading] = useState(false); 
  const [messageLoading, setMessageLoading] = useState(false); 

  // --- MODAL STATE ---
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 3. FETCH DATA
  useFocusEffect(
    useCallback(() => {
      loadProfileAndPosts();
    }, [targetUserId, isViewingSelf])
  );

  const loadProfileAndPosts = async () => {
    setLoading(true);
    try {
      let profileId = targetUserId;
      let profileData = null;

      // A. FETCH PROFILE DATA
      if (isViewingSelf) {
        // View Own Profile
        const res = await client.get('/auth/profile');
        if (res.data.success) {
          profileData = res.data.user;
          profileId = res.data.user._id || res.data.user.id; 
          
          setUserData(profileData);
          setStats({ 
            followers: profileData.followers?.length || 0, 
            following: profileData.following?.length || 0 
          });
        }
      } else {
        // View Others
        const res = await client.get(`/auth/users/${targetUserId}`);
        if (res.data.success) {
          profileData = res.data.user;
          setUserData(profileData);
          setIsFollowing(res.data.isFollowing);
          setStats({ 
            followers: profileData.followers?.length || 0, 
            following: profileData.following?.length || 0 
          });
        }
      }

      // B. FETCH USER'S POSTS (SCANS)
      const feedRes = await client.get('/posts/feed'); 
      
      if (feedRes.data.success) {
        const allPosts = feedRes.data.posts;
        
        // Filter posts that belong to this profile
        const myPosts = allPosts.filter(post => {
          const posterId = post.userId?._id || post.userId; 
          return posterId.toString() === profileId.toString();
        });

        setUserPosts(myPosts);
      }

    } catch (error) {
      console.log('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // 4. HANDLE FOLLOW / UNFOLLOW
  const handleFollowToggle = async () => {
    if (isViewingSelf) return;
    setFollowLoading(true);

    try {
      const res = await client.post(`/auth/follow/${targetUserId}`);
      
      if (res.data.success) {
        const newStatus = res.data.isFollowing;
        setIsFollowing(newStatus);
        
        setStats(prev => ({
          ...prev,
          followers: newStatus ? prev.followers + 1 : prev.followers - 1
        }));
      }
    } catch (error) {
      console.error("Follow error:", error);
      Alert.alert("Error", "Could not update follow status.");
    } finally {
      setFollowLoading(false);
    }
  };

  // 5. HANDLE MESSAGE BUTTON PRESS
  const handleMessagePress = async () => {
    if (isViewingSelf || !userData) return;
    setMessageLoading(true);

    try {
      await client.post('/chat/start', { 
        targetUserId: userData._id || userData.id 
      });

      navigation.navigate('Chat', {
        targetUser: {
          uid: userData._id || userData.id,
          name: userData.fullName || `${userData.firstName} ${userData.lastName}`,
          profilePic: userData.profilePic
        }
      });

    } catch (error) {
      console.error("Start chat error:", error);
      Alert.alert("Error", "Could not start conversation.");
    } finally {
      setMessageLoading(false);
    }
  };

  // 6. HANDLE OPEN MODAL
  const openPostDetail = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderGridItem = ({ item }) => {
    const hasMedia = item.media && item.media.length > 0;
    let imageSource = require('../../assets/crayfish.png'); 

    // Handle media object vs string
    if (hasMedia) {
      const firstMedia = item.media[0];
      if (typeof firstMedia === 'string') {
        imageSource = { uri: firstMedia };
      } else if (firstMedia.uri) {
        imageSource = { uri: firstMedia.uri };
      }
    }

    return (
      <TouchableOpacity style={styles.gridItem} onPress={() => openPostDetail(item)}>
        <Image source={imageSource} style={styles.gridImage} resizeMode="cover" />
        {hasMedia && item.media.length > 1 && (
          <View style={styles.multiIcon}>
            <Ionicons name="layers" size={12} color="#FFF" />
          </View>
        )}
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3D5A80" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- HEADER SECTION --- */}
      <LinearGradient colors={['#3D5A80', '#293241']} style={styles.header}>
        <View style={styles.navRow}>
          {!isViewingSelf ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} /> 
          )}
          
          <Text style={styles.headerTitle}>
            {isViewingSelf ? "MY PROFILE" : "RESEARCHER"}
          </Text>
          
          {isViewingSelf ? (
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
             <View style={{ width: 24 }} />
          )}
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={userData?.profilePic ? { uri: userData.profilePic } : require('../../assets/profile-icon.png')} 
              style={styles.avatar} 
            />
            {userData?.role === 'Verified' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>
            {userData?.fullName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Researcher'}
          </Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#98C1D9" />
            <Text style={styles.userLocation}>{userData?.city || 'Unknown Location'}</Text>
          </View>
          
          {/* --- ACTION BUTTONS --- */}
          {!isViewingSelf ? (
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.messageBtn]}
                onPress={handleMessagePress}
                disabled={messageLoading}
              >
                {messageLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.actionBtn, 
                  isFollowing ? styles.followingBtn : styles.followBtn
                ]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? "#FFF" : "#3D5A80"} />
                ) : (
                  <Text style={[styles.btnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* --- STATS CARD --- */}
      <View style={styles.statsCard}>
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statValue}>{stats.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statValue}>{stats.following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
      </View>

      {/* --- BIO --- */}
      <Text style={styles.bioText} numberOfLines={3}>
        {userData?.bio || "This researcher hasn't added a bio yet."}
      </Text>

      {/* --- SCANS GRID --- */}
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>
          {isViewingSelf ? "My Scans" : "Recent Contributions"}
        </Text>
        <Text style={styles.scanCount}>{userPosts.length} Scans</Text>
      </View>

      {userPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No scans uploaded yet.</Text>
        </View>
      ) : (
        <FlatList
          data={userPosts}
          renderItem={renderGridItem}
          keyExtractor={item => item._id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* --- MODAL FOR POST DETAILS --- */}
      <PostDetailModal 
        visible={modalVisible} 
        post={selectedPost} 
        onClose={() => setModalVisible(false)} 
      />

      {/* --- BOTTOM NAV --- */}
      {isViewingSelf && (
        <View style={styles.bottomNavWrapper}>
          <BottomNavBar navigation={navigation} activeTab="Profile" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  
  header: { paddingTop: 60, paddingBottom: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  
  profileInfo: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 10 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#FFF' },
  verifiedBadge: { 
    position: 'absolute', bottom: 0, right: 0, 
    backgroundColor: '#1DA1F2', padding: 4, borderRadius: 12, 
    borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' 
  },
  userName: { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  userLocation: { color: '#98C1D9', fontSize: 13, fontWeight: '600', marginLeft: 4 },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  actionBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, minWidth: 50, alignItems: 'center', justifyContent: 'center' },
  messageBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', width: 50, height: 42, paddingHorizontal: 0 },
  followBtn: { backgroundColor: '#FFF', minWidth: 120 },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FFF', minWidth: 120 },
  btnText: { fontSize: 14, fontWeight: '700', color: '#3D5A80' },
  followingBtnText: { color: '#FFF' },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', minWidth: 140 },
  editBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  statsCard: { 
    flexDirection: 'row', backgroundColor: '#FFF', 
    marginHorizontal: 20, marginTop: -30, borderRadius: 20, 
    paddingVertical: 15, elevation: 8, shadowColor: '#3D5A80', 
    shadowOpacity: 0.15, shadowOffset: {width: 0, height: 4}, shadowRadius: 10 
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#3D5A80' },
  statLabel: { fontSize: 11, color: '#7F8C8D', fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  divider: { width: 1, backgroundColor: '#ECF0F1', height: '80%' },

  bioText: { marginHorizontal: 30, marginTop: 20, marginBottom: 10, fontSize: 14, color: '#555', lineHeight: 20, textAlign: 'center' },
  
  gridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECF0F1' },
  gridTitle: { fontSize: 14, fontWeight: '800', color: '#3D5A80', textTransform: 'uppercase' },
  scanCount: { fontSize: 12, color: '#98C1D9', fontWeight: '600' },
  
  gridContainer: { paddingBottom: 100 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, padding: 1 },
  gridImage: { width: '100%', height: '100%', backgroundColor: '#EEE' },
  
  dateBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dateText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  multiIcon: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 2 },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { color: '#999', fontSize: 14, fontStyle: 'italic' },

  bottomNavWrapper: { position: 'absolute', bottom: 0, width: '100%' }
});