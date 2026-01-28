import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, FlatList, 
  TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Import
import client from '../api/client';

// Use your existing BottomNavBar
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

export default function ProfileScreen({ navigation, route }) {
  // 1. DETERMINE IDENTITY
  // If route.params.userId exists, we are viewing someone else.
  // Otherwise, we are viewing ourselves.
  const targetUserId = route?.params?.userId;
  const isViewingSelf = !targetUserId;
  
  // 2. STATE
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false); 
  const [currentUserData, setCurrentUserData] = useState(null);

  // 3. FETCH DATA (Combined Logic)
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        // A. Always get current user ID for context (to check if I follow them)
        const meRes = await client.get('/auth/profile');
        const myId = meRes.data?.user?._id || meRes.data?.user?.id;
        setCurrentUserData(meRes.data?.user);

        // B. Decide which profile to load
        if (isViewingSelf) {
          // --- VIEWING SELF ---
          setUserData(meRes.data.user);
          setStats({ 
            followers: meRes.data.user.followers?.length || 0, 
            following: meRes.data.user.following?.length || 0 
          });
        } else {
          // --- VIEWING OTHERS ---
          // Need a public endpoint. 
          // Assuming /posts/user/:id returns { user: {...}, isFollowing: bool }
          // If you don't have this specific endpoint, you might need to use /auth/users/:id
          // or derive isFollowing manually.
          
          // Strategy: Fetch user details
          // Since we don't have a specific "get public user" route in your previous code,
          // we will assume you might need to add one or use a workaround.
          // WORKAROUND for now: We reuse the "getChatUsers" logic or assume an endpoint exists.
          // Ideally: client.get(`/users/${targetUserId}`)
          
          // For now, let's try to fetch their info. 
          // IF YOU DONT HAVE THIS ENDPOINT, YOU NEED TO ADD IT TO BACKEND:
          // router.get('/:id', auth, userController.getUserProfile);
          
          const userRes = await client.get(`/auth/users/${targetUserId}`); 
          // ^ Ensure this route exists on backend!
          
          if (userRes.data?.user) {
            const u = userRes.data.user;
            setUserData(u);
            setStats({ 
              followers: u.followers?.length || 0, 
              following: u.following?.length || 0 
            });
            
            // Check if *I* follow *Them*
            // We check my "following" list from step A
            const amIFollowing = meRes.data.user.following.includes(targetUserId);
            setIsFollowing(amIFollowing);
          }
        }
      } catch (error) {
        console.log('Error loading profile:', error);
        // Fallback or Alert
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [targetUserId, isViewingSelf]);

  // 4. FOLLOW TOGGLE
  const handleFollowToggle = async () => {
    if (isViewingSelf) return;
    setFollowLoading(true);

    try {
      // Call the endpoint we used in CommunityScreen
      const res = await client.post(`/auth/follow/${targetUserId}`);
      
      if (res.data) {
        const newStatus = res.data.isFollowing; // Backend should return true/false
        setIsFollowing(newStatus);
        
        // Update stats locally for immediate feedback
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

  // Mock Scans (Placeholder for now)
  const mockScans = [
    { id: '1', image: 'https://images.unsplash.com/photo-1623996538604-a1a721612e6e?auto=format&fit=crop&q=80&w=400', date: 'Jan 15' },
    { id: '2', image: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?auto=format&fit=crop&q=80&w=400', date: 'Jan 10' },
    { id: '3', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=400', date: 'Jan 05' },
  ];

  const renderGridItem = ({ item }) => (
    <TouchableOpacity style={styles.gridItem}>
      <Image source={{ uri: item.image }} style={styles.gridImage} />
      <View style={styles.dateBadge}>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3D5A80" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- HEADER --- */}
      <LinearGradient colors={['#3D5A80', '#293241']} style={styles.header}>
        <View style={styles.navRow}>
          {/* Back Button Logic */}
          {!isViewingSelf || navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} /> 
          )}
          
          <Text style={styles.headerTitle}>
            {isViewingSelf ? "MY PROFILE" : "RESEARCHER"}
          </Text>
          
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={userData?.profilePic ? { uri: userData.profilePic } : require('../../assets/profile-icon.png')} 
              style={styles.avatar} 
            />
            {/* Show badge if verified (example role) */}
            {userData?.role === 'Verified' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-sharp" size={14} color="#FFF" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>
            {userData?.fullName || userData?.firstName || 'Researcher'}
          </Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#98C1D9" />
            <Text style={styles.userLocation}>{userData?.city || 'Location Unknown'}</Text>
          </View>
          
          {/* ACTION BUTTON SWITCH */}
          {!isViewingSelf ? (
            <TouchableOpacity 
              style={[styles.followBtn, isFollowing ? styles.followingBtn : styles.notFollowingBtn]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? "#FFF" : "#3D5A80"} />
              ) : (
                <Text style={[styles.followText, isFollowing && { color: '#FFF' }]}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* --- STATS --- */}
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

      <Text style={styles.bioText}>
        {userData?.bio || "This researcher hasn't added a bio yet."}
      </Text>

      {/* --- GRID --- */}
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>
          {isViewingSelf ? "My Scans" : "Research Scans"}
        </Text>
      </View>

      <FlatList
        data={mockScans} // Replace with real scans eventually
        renderItem={renderGridItem}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Hide Bottom Nav if we are viewing someone else (so we have more screen space) */}
      {isViewingSelf && (
        <BottomNavBar navigation={navigation} activeTab="Profile" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  header: { paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  profileInfo: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#FFF' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1DA1F2', padding: 4, borderRadius: 12, borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  userName: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  userLocation: { color: '#98C1D9', fontSize: 13, fontWeight: '600', marginLeft: 5 },
  
  // Follow Button Styles
  followBtn: { paddingHorizontal: 30, paddingVertical: 8, borderRadius: 20, borderWidth: 1, minWidth: 120, alignItems: 'center', borderColor: '#FFF' },
  notFollowingBtn: { backgroundColor: '#FFF' }, 
  followingBtn: { backgroundColor: 'transparent' }, 
  followText: { fontSize: 14, fontWeight: '700', color: '#3D5A80' },

  // Edit Button Styles
  editProfileBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  editProfileText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  statsCard: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginTop: -25, borderRadius: 20, padding: 20, elevation: 5, shadowColor: '#3D5A80', shadowOpacity: 0.15, shadowRadius: 10 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#3D5A80' },
  statLabel: { fontSize: 11, color: '#7F8C8D', fontWeight: '600', textTransform: 'uppercase', marginTop: 5 },
  divider: { width: 1, backgroundColor: '#ECF0F1', height: '100%' },
  bioText: { marginHorizontal: 25, marginTop: 25, marginBottom: 15, fontSize: 14, color: '#293241', lineHeight: 22, textAlign: 'center' },
  gridHeader: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ECF0F1', marginBottom: 1 },
  gridTitle: { fontSize: 14, fontWeight: '800', color: '#3D5A80', textTransform: 'uppercase' },
  gridContainer: { paddingBottom: 100 }, 
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, padding: 1 },
  gridImage: { width: '100%', height: '100%' },
  dateBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(41,50,65,0.7)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 },
  dateText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});