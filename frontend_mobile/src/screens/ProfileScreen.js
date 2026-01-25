import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, 
  TouchableOpacity, Dimensions, FlatList, StatusBar, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase Imports
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Use your existing BottomNavBar
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

export default function ProfileScreen({ navigation }) {
  // 1. STATE FOR REAL DATA
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. FETCH DATA FROM FIRESTORE
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Temporary Mock Scans
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

  // Show a loading spinner while fetching data
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

      {/* --- 1. HEADER SECTION --- */}
      <LinearGradient colors={['#3D5A80', '#293241']} style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PROFILE</Text>
          {/* Invisible spacer so the title stays perfectly centered */}
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {/* DYNAMIC PROFILE PICTURE */}
            <Image 
              source={userData?.profilePic ? { uri: userData.profilePic } : require('../../assets/profile-icon.png')} 
              style={styles.avatar} 
            />
            {/* VERIFICATION BADGE (Replaced the pencil edit button) */}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-sharp" size={14} color="#FFF" />
            </View>
          </View>
          
          {/* DYNAMIC USER DATA */}
          <Text style={styles.userName}>{userData?.fullName || 'Researcher'}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#98C1D9" />
            <Text style={styles.userLocation}>{userData?.city || 'Location Unknown'}, PH</Text>
          </View>
          
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{userData?.role || 'Member'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* --- 2. STATS & BIO SECTION --- */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>42</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>128</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
      </View>

      <Text style={styles.bioText}>
        {userData?.bio || "Running a backyard red claw setup. Always open to share tips on water quality management!"}
      </Text>

      {/* --- 3. SCANS GRID (Social Media Style) --- */}
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>My Crayfish Scans</Text>
      </View>

      <FlatList
        data={mockScans}
        renderItem={renderGridItem}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* --- 4. BOTTOM NAV BAR --- */}
      <BottomNavBar navigation={navigation} activeTab="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },

  // Header Styles
  header: { paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  
  profileInfo: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#FFF' },
  
  // NEW: Verified Badge Styles
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1DA1F2', padding: 4, borderRadius: 12, borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  
  userName: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  userLocation: { color: '#98C1D9', fontSize: 13, fontWeight: '600', marginLeft: 5 },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  levelText: { color: '#FFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  // Stats Card
  statsCard: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginTop: -25, borderRadius: 20, padding: 20, elevation: 5, shadowColor: '#3D5A80', shadowOpacity: 0.15, shadowRadius: 10 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#3D5A80' },
  statLabel: { fontSize: 11, color: '#7F8C8D', fontWeight: '600', textTransform: 'uppercase', marginTop: 5 },
  divider: { width: 1, backgroundColor: '#ECF0F1', height: '100%' },

  // Bio
  bioText: { marginHorizontal: 25, marginTop: 25, marginBottom: 15, fontSize: 14, color: '#293241', lineHeight: 22, textAlign: 'center' },

  // Grid Styles
  gridHeader: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ECF0F1', marginBottom: 1 },
  gridTitle: { fontSize: 14, fontWeight: '800', color: '#3D5A80', textTransform: 'uppercase' },
  gridContainer: { paddingBottom: 100 }, // Space for Bottom Nav
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, padding: 1 },
  gridImage: { width: '100%', height: '100%' },
  dateBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(41,50,65,0.7)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 },
  dateText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});