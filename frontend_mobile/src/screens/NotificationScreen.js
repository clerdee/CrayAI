import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Platform, StatusBar, ActivityIndicator, RefreshControl, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// API & Config
import client from '../api/client';

// Custom Components
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';

const { width } = Dimensions.get('window');

// --- HELPER: TIME FORMATTER ---
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

export default function NotificationScreen({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Data States
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        setIsGuest(true);
        setCurrentUser(null);
        setNotifications([]);
        setLoading(false);
        return;
      }

      setIsGuest(false);

      // 1. Fetch Profile (For Sidebar)
      const profileRes = await client.get('/auth/profile');
      if (profileRes.data?.user) {
        setCurrentUser(profileRes.data.user);
      }

      // 2. Fetch Notifications
      const notiRes = await client.get('/notification'); 
      const rawNotis = notiRes.data?.notifications || [];
      
      setNotifications(rawNotis);
      setAlertsCount(rawNotis.length);
      await AsyncStorage.setItem('alertsCount', String(rawNotis.length));

    } catch (error) {
      console.log("Error fetching notifications:", error);
      if (!currentUser) setIsGuest(true); 
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('alertsCount');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) { console.log(e); }
  };

  // --- HELPER: SECTIONS ---
  const getSections = () => {
    const now = new Date();
    const newNotis = [];
    const oldNotis = [];

    notifications.forEach(item => {
      const date = new Date(item.createdAt);
      const diffHours = (now - date) / (1000 * 60 * 60);
      if (diffHours < 24) newNotis.push(item);
      else oldNotis.push(item);
    });

    return { newNotis, oldNotis };
  };

  const { newNotis, oldNotis } = getSections();

  // --- RENDER ITEM ---
  const renderNotificationItem = (item) => {
    // Determine Icon based on Type
    let iconName = "notifications";
    let iconColor = "#95A5A6";
    let iconBg = "#F4F6F6";

    switch(item.type) {
      case 'like': 
        iconName = "heart"; iconColor = "#E76F51"; iconBg = "#FDECEA"; break;
      case 'comment': 
        iconName = "chatbubble"; iconColor = "#3D5A80"; iconBg = "#E3F2FD"; break;
      case 'follow': 
        iconName = "person-add"; iconColor = "#2ECC71"; iconBg = "#E8F8F5"; break;
      case 'message': 
        iconName = "mail"; iconColor = "#F4A261"; iconBg = "#FEF5E7"; break;
    }

    return (
      <View key={item._id} style={[styles.notiCard, styles.shadow]}>
        {/* Left: Avatar */}
        <View style={styles.avatarContainer}>
          <Image 
            source={item.sender?.profilePic ? { uri: item.sender.profilePic } : require('../../assets/profile-icon.png')} 
            style={styles.notiAvatar} 
          />
          {/* Small overlapping type icon */}
          <View style={[styles.miniTypeIcon, { backgroundColor: iconColor }]}>
            <Ionicons name={iconName} size={10} color="#FFF" />
          </View>
        </View>
        
        {/* Center: Text */}
        <View style={styles.notiContent}>
          <Text style={styles.notiText}>
            <Text style={styles.userName}>
              {item.sender ? (item.sender.firstName || item.sender.name) : "System"}
            </Text>
            {"  "}
            <Text style={styles.actionText}>
              {item.text || item.message || "Interacted with you."}
            </Text>
          </Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        {/* Right: Context (e.g. arrow or status) */}
        <View style={styles.rightAction}>
           {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        navigation={navigation}
        user={currentUser}
        onLogout={handleLogout}
      />

      <Header title="ACTIVITY" context="Alerts" onProfilePress={() => setSidebarVisible(true)} />

      {/* --- GUEST VIEW --- */}
      {isGuest ? (
        <View style={styles.centerContainer}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="notifications" size={60} color="#3D5A80" />
          </View>
          <Text style={styles.largeTitle}>Stay Updated!</Text>
          <Text style={styles.subText}>
            Log in to see likes, comments, and new followers in real-time.
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.actionBtnText}>Log In Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* --- LOGGED IN VIEW --- */
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3D5A80']} />}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#3D5A80" style={{ marginTop: 50 }} />
          ) : notifications.length === 0 ? (
            // --- EMPTY STATE (Matches your screenshot style) ---
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="file-tray-outline" size={60} color="#BDC3C7" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptyText}>
                When people interact with your research or profile, you'll see them here.
              </Text>
            </View>
          ) : (
            <>
              {/* NEW SECTION */}
              {newNotis.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>New</Text>
                </View>
              )}
              {newNotis.map(renderNotificationItem)}

              {/* EARLIER SECTION */}
              {oldNotis.length > 0 && (
                <View style={[styles.sectionHeader, { marginTop: 25 }]}>
                  <Text style={styles.sectionTitle}>Earlier</Text>
                </View>
              )}
              {oldNotis.map(renderNotificationItem)}
            </>
          )}
        </ScrollView>
      )}

      <BottomNavBar navigation={navigation} activeTab="Alerts" alertsCount={alertsCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 120, minHeight: '100%' },

  // --- GUEST STATE ---
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: -50 },
  guestIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0FBFC', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  largeTitle: { fontSize: 22, fontWeight: '800', color: '#293241', textAlign: 'center' },
  subText: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginTop: 8, lineHeight: 22, marginBottom: 30 },
  actionBtn: { backgroundColor: '#3D5A80', paddingHorizontal: 35, paddingVertical: 14, borderRadius: 30, elevation: 4, shadowColor: '#3D5A80', shadowOpacity: 0.3, shadowOffset: {width:0, height:4} },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // --- EMPTY STATE (LOGGED IN) ---
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EDF2F4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E50', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#95A5A6', textAlign: 'center', maxWidth: 260, lineHeight: 22 },

  // --- SECTIONS ---
  sectionHeader: { marginBottom: 12, paddingLeft: 5 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#95A5A6', textTransform: 'uppercase', letterSpacing: 1 },

  // --- NOTIFICATION CARD ---
  notiCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 18, 
    padding: 14, 
    marginBottom: 12, 
    // Subtle modern shadow
    shadowColor: '#2C3E50', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 8, 
    elevation: 2, 
  },
  
  // Avatar Area
  avatarContainer: { position: 'relative', marginRight: 14 },
  notiAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F3F4' },
  miniTypeIcon: { 
    position: 'absolute', bottom: -2, right: -2, 
    width: 20, height: 20, borderRadius: 10, 
    justifyContent: 'center', alignItems: 'center', 
    borderWidth: 2, borderColor: '#FFF' 
  },

  // Content Area
  notiContent: { flex: 1, justifyContent: 'center' },
  notiText: { fontSize: 14, color: '#34495E', lineHeight: 20 },
  userName: { fontWeight: '700', color: '#2C3E50' },
  actionText: { fontWeight: '400', color: '#5D6D7E' },
  timeText: { fontSize: 11, color: '#BDC3C7', marginTop: 4, fontWeight: '600' },

  // Right Side (Unread Dot)
  rightAction: { paddingLeft: 10, justifyContent: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3D5A80' },
});