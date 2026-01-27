import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, FlatList, 
  TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase Imports
import { 
  doc, getDoc, collection, query, where, getCountFromServer, 
  updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Use your existing BottomNavBar
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

export default function ProfileScreen({ navigation, route }) {
  // 1. DETERMINE WHICH USER TO SHOW
  const currentAuthUser = auth.currentUser;
  const paramUserId = route?.params?.userId;
  
  // Logic: If no param, or param matches auth uid, we are viewing ourselves.
  const isViewingSelf = !paramUserId || (currentAuthUser && paramUserId === currentAuthUser.uid);
  const targetUserId = isViewingSelf ? currentAuthUser?.uid : paramUserId;

  // 2. STATE
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false); 

  // 3. FETCH DATA
  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const fetchProfileAndRelationship = async () => {
      setLoading(true);
      try {
        // A. Fetch Profile
        const docRef = doc(db, "users", targetUserId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);

          // B. Stats
          const followingCount = data.following ? data.following.length : 0;
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("following", "array-contains", targetUserId));
          const snapshot = await getCountFromServer(q);
          const followersCount = snapshot.data().count;

          setStats({ following: followingCount, followers: followersCount });

          // C. Relationship Check (Only if viewing someone else)
          if (!isViewingSelf && currentAuthUser) {
            const myDocRef = doc(db, "users", currentAuthUser.uid);
            const myDocSnap = await getDoc(myDocRef);
            if (myDocSnap.exists()) {
              const myData = myDocSnap.data();
              setIsFollowing(myData.following?.includes(targetUserId) || false);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndRelationship();
  }, [targetUserId, isViewingSelf]);

  // 4. FOLLOW TOGGLE
  const handleFollowToggle = async () => {
    if (!currentAuthUser || isViewingSelf) return;
    setFollowLoading(true);
    const myUserRef = doc(db, "users", currentAuthUser.uid);

    try {
      if (isFollowing) {
        await updateDoc(myUserRef, { following: arrayRemove(targetUserId) });
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 })); 
      } else {
        await updateDoc(myUserRef, { following: arrayUnion(targetUserId) });
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 })); 
      }
    } catch (error) {
      Alert.alert("Error", "Action failed.");
    } finally {
      setFollowLoading(false);
    }
  };

  // Mock Scans
  const mockScans = [
    { id: '1', image: 'https://images.unsplash.com/photo-1623996538604-a1a721612e6e?auto=format&fit=crop&q=80&w=400', date: 'Jan 15' },
    { id: '2', image: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?auto=format&fit=crop&q=80&w=400', date: 'Jan 10' },
    { id: '3', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=400', date: 'Jan 05' },
    { id: '4', image: 'https://images.unsplash.com/photo-1615592389070-bcc97e050856?auto=format&fit=crop&q=80&w=400', date: 'Jan 02' },
    { id: '5', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400', date: 'Dec 28' },
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
          
          {/* UPDATED LOGIC: Show Back if we have history (canGoBack), regardless of identity */}
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} /> 
          )}
          
          <Text style={styles.headerTitle}>
            {isViewingSelf ? "MY PROFILE" : "PROFILE"}
          </Text>
          
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={userData?.profilePic ? { uri: userData.profilePic } : require('../../assets/profile-icon.png')} 
              style={styles.avatar} 
            />
            {userData?.role === 'Verified' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-sharp" size={14} color="#FFF" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{userData?.fullName || 'Researcher'}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#98C1D9" />
            <Text style={styles.userLocation}>{userData?.city || 'Location Unknown'}, PH</Text>
          </View>
          
          {/* FOLLOW BUTTON OR ROLE BADGE */}
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
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{userData?.role || 'Member'}</Text>
            </View>
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
        {userData?.bio || "No bio added yet."}
      </Text>

      {/* --- GRID --- */}
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>
          {isViewingSelf ? "My Crayfish Scans" : `${userData?.fullName || 'User'}'s Scans`}
        </Text>
      </View>

      <FlatList
        data={mockScans}
        renderItem={renderGridItem}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Hide Bottom Nav if we are "drilled down" in a stack (Back button visible) */}
      {!navigation.canGoBack() && (
        <BottomNavBar navigation={navigation} activeTab="Profile" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  header: { paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  profileInfo: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#FFF' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1DA1F2', padding: 4, borderRadius: 12, borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  userName: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  userLocation: { color: '#98C1D9', fontSize: 13, fontWeight: '600', marginLeft: 5 },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  levelText: { color: '#FFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  followBtn: { paddingHorizontal: 30, paddingVertical: 8, borderRadius: 20, borderWidth: 1, minWidth: 120, alignItems: 'center', borderColor: '#FFF' },
  notFollowingBtn: { backgroundColor: '#FFF' }, 
  followingBtn: { backgroundColor: 'transparent' }, 
  followText: { fontSize: 14, fontWeight: '700', color: '#3D5A80' },
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