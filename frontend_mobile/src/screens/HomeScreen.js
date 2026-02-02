import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, StatusBar, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { FontAwesome5, Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Import
import client from '../api/client'; 

// Custom Components
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';
import FloatingChatbot from '../components/FloatingChatbot';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  // --- STATE ---
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Gender');
  const [alertsCount, setAlertsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // --- NOTIFICATION ---
  const [notification, setNotification] = useState({ visible: false, message: '', type: 'info' });
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showNotification = (message, type = 'info') => {
    setNotification({ visible: true, message, type });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setNotification({ visible: false, message: '', type: 'info' });
      });
    }, 3000);
  };

  // --- LOAD DATA ---
  useEffect(() => {
    const loadAlertBadge = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setAlertsCount(0);
      } else {
        const value = await AsyncStorage.getItem('alertsCount');
        setAlertsCount(Number(value || 0));
      }
    };
    const unsubscribe = navigation.addListener('focus', loadAlertBadge);
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
    }, [])
  );

  const checkLoginStatus = async () => {
    setIsLoadingUser(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        try {
          const res = await client.get('/auth/profile');
          if (res.data && res.data.success && res.data.user) {
             setCurrentUser(res.data.user);
          } else {
             setCurrentUser(null);
          }
        } catch (apiError) {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleCameraPress = () => {
    if (currentUser) {
      navigation.navigate('Camera');
    } else {
      showNotification("Login required to access AI Scanner.", "warning");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('alertsCount'); 
      setCurrentUser(null); 
      setAlertsCount(0); 
      setSidebarVisible(false);
      navigation.navigate('Login');
    } catch (error) {
      console.log(error);
    }
  };

  // --- DATA MOCKUPS ---
  const categories = ['Gender', 'Size', 'Age'];
  
  const recentScans = [
    { id: 1, time: '10:45 AM', date: 'Today', result: 'Male (Adult)', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=300', status: 'Healthy' },
    { id: 2, time: 'Yesterday', date: 'Jan 29', result: 'Female (Berried)', image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=300', status: 'Attention' },
    { id: 3, time: 'Jan 28', date: 'Jan 28', result: 'Male (Juv)', image: 'https://images.unsplash.com/photo-1570535386008-0131481014e3?q=80&w=300', status: 'Healthy' }
  ];

  // CHANGED: Data structure for horizontal bars
  const getAnalyticsData = () => {
    switch(activeTab) {
      case 'Gender': return {
        total: 250,
        items: [
          { label: 'Male', value: 120, pct: '48%', color: '#3D5A80', icon: 'male-outline' },
          { label: 'Female', value: 90, pct: '36%', color: '#E76F51', icon: 'female-outline' },
          { label: 'Berried', value: 40, pct: '16%', color: '#F4A261', icon: 'egg-outline' }
        ]
      };
      case 'Size': return {
        total: 250,
        items: [
          { label: 'Small (<8cm)', value: 60, pct: '24%', color: '#98C1D9', icon: 'resize-outline' },
          { label: 'Medium (8-12)', value: 130, pct: '52%', color: '#3D5A80', icon: 'resize-outline' },
          { label: 'Large (>12cm)', value: 60, pct: '24%', color: '#293241', icon: 'resize-outline' }
        ]
      };
      case 'Age': return {
        total: 250,
        items: [
          { label: 'Juvenile', value: 60, pct: '24%', color: '#2A9D8F', icon: 'leaf-outline' },
          { label: 'Sub-Adult', value: 100, pct: '40%', color: '#2A9D8F', icon: 'rose-outline' },
          { label: 'Adult', value: 90, pct: '36%', color: '#2A9D8F', icon: 'medal-outline' }
        ]
      };
      default: return { total: 0, items: [] };
    }
  };

  const analyticsData = getAnalyticsData();

  // ==========================================
  // VIEW: GUEST MODE
  // ==========================================
  const renderGuestGuide = () => (
    <View style={styles.guestContainer}>
      <View style={[styles.heroCard, styles.shadow]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?q=80&w=1000' }} 
          style={styles.heroImage} 
        />
        <LinearGradient 
          colors={['transparent', 'rgba(41, 50, 65, 0.95)']} 
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.newBadge}><Text style={styles.newBadgeText}>AI RESEARCH TOOL</Text></View>
            <Text style={styles.heroTitle}>Precision Classification</Text>
            <Text style={styles.heroSubtitle}>Identify gender, size, and health status in seconds.</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Meet CrayBot 🤖</Text></View>
      <View style={[styles.botShowcase, styles.shadow]}>
        <View style={styles.botHeader}>
          <View style={styles.botAvatarContainer}><Text style={{fontSize: 20}}>🦐</Text></View>
          <View>
            <Text style={styles.botName}>CrayBot AI</Text>
            <Text style={styles.botStatus}>Online • Research Assistant</Text>
          </View>
        </View>
        <View style={styles.mockChatContainer}>
           <View style={styles.mockUserBubble}><Text style={styles.mockUserText}>Is this crayfish healthy? 📸</Text></View>
           <View style={styles.mockBotBubble}><Text style={styles.mockBotText}>I've analyzed the image. This appears to be a <Text style={{fontWeight:'700', color: '#E76F51'}}>Female Red Claw</Text>.</Text></View>
        </View>
        <TouchableOpacity style={styles.tryBotBtn} onPress={() => showNotification("Log in to chat with CrayBot!", "info")}>
           <Text style={styles.tryBotText}>Ask a Question</Text>
           <Ionicons name="chatbubble-ellipses" size={16} color="#3D5A80" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Everything you need</Text></View>
      <View style={styles.featureGrid}>
         <View style={[styles.gridItem, styles.shadow]}>
            <View style={[styles.gridIcon, {backgroundColor: '#E0FBFC'}]}><Ionicons name="scan" size={24} color="#3D5A80" /></View>
            <Text style={styles.gridTitle}>Instant ID</Text>
            <Text style={styles.gridSub}>Gender & Age</Text>
         </View>
         <View style={[styles.gridItem, styles.shadow]}>
            <View style={[styles.gridIcon, {backgroundColor: '#FFDDD2'}]}><Ionicons name="stats-chart" size={24} color="#E76F51" /></View>
            <Text style={styles.gridTitle}>Analytics</Text>
            <Text style={styles.gridSub}>Growth Data</Text>
         </View>
         <View style={[styles.gridItem, styles.shadow]}>
            <View style={[styles.gridIcon, {backgroundColor: '#D8F3DC'}]}><Ionicons name="people" size={24} color="#2A9D8F" /></View>
            <Text style={styles.gridTitle}>Community</Text>
            <Text style={styles.gridSub}>Global Feed</Text>
         </View>
      </View>

      <View style={styles.modernCta}>
        <View>
          <Text style={styles.ctaHeading}>Join CrayAI</Text>
          <Text style={styles.ctaSub}>Create your free account.</Text>
        </View>
        <TouchableOpacity style={styles.ctaBtnModern} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.ctaBtnTextModern}>Get Started</Text>
          <Feather name="arrow-right" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==========================================
  // VIEW: LOGGED IN USER (Improved Analytics)
  // ==========================================
  const renderUserDashboard = () => (
    <View style={styles.dashboardContainer}>
      
      {/* 1. HEADER */}
      <View style={styles.userHeader}>
        <View>
          <Text style={styles.userGreeting}>Welcome Back,</Text>
          <Text style={styles.userName}>{currentUser?.firstName || 'Researcher'}</Text>
        </View>
        <TouchableOpacity style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={14} color="#3D5A80" />
          <Text style={styles.dateText}>Feb 02</Text>
        </TouchableOpacity>
      </View>

      {/* 2. STATS TICKER */}
      <View style={styles.statsTicker}>
         <View style={styles.tickerItem}>
            <Text style={styles.tickerValue}>142</Text>
            <Text style={styles.tickerLabel}>Total Scans</Text>
         </View>
         <View style={styles.tickerDivider} />
         <View style={styles.tickerItem}>
            <Text style={[styles.tickerValue, {color: '#E76F51'}]}>3</Text>
            <Text style={styles.tickerLabel}>Warnings</Text>
         </View>
         <View style={styles.tickerDivider} />
         <View style={styles.tickerItem}>
            <Text style={[styles.tickerValue, {color: '#2A9D8F'}]}>18</Text>
            <Text style={styles.tickerLabel}>Berried</Text>
         </View>
      </View>

      {/* 3. MAIN ACTIONS (Split) */}
      <View style={styles.actionRow}>
         <TouchableOpacity style={[styles.actionCard, styles.shadow, {backgroundColor: '#293241'}]} onPress={handleCameraPress}>
             <View style={styles.actionIconCircle}>
                <Ionicons name="camera" size={24} color="#293241" />
             </View>
             <Text style={styles.actionCardTitle}>New Scan</Text>
             <Text style={styles.actionCardSub}>Identify species</Text>
         </TouchableOpacity>

         <TouchableOpacity style={[styles.actionCard, styles.shadow, {backgroundColor: '#FFF'}]}>
             <View style={[styles.actionIconCircle, {backgroundColor: '#F0F4F8'}]}>
                <Ionicons name="images" size={24} color="#3D5A80" />
             </View>
             <Text style={[styles.actionCardTitle, {color: '#293241'}]}>Upload</Text>
             <Text style={[styles.actionCardSub, {color: '#7F8C8D'}]}>From gallery</Text>
         </TouchableOpacity>
      </View>

      {/* 4. MY SCANS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Scans</Text>
        <TouchableOpacity><Text style={styles.viewLink}>History</Text></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{paddingRight: 20}}>
        {recentScans.map((scan) => (
          <View key={scan.id} style={[styles.scanCard, styles.shadow]}>
            <Image source={{ uri: scan.image }} style={styles.scanImage} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.scanOverlay} />
            
            <View style={styles.scanContent}>
               <View style={styles.scanTopRow}>
                  <View style={[styles.statusDot, {backgroundColor: scan.status === 'Healthy' ? '#2A9D8F' : '#E76F51'}]} />
                  <Text style={styles.scanDate}>{scan.date}</Text>
               </View>
               <Text style={styles.scanResult}>{scan.result}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 5. NEW ANALYTICS DESIGN (HORIZONTAL BARS) */}
      <View style={styles.sectionHeader}>
         <Text style={styles.sectionTitle}>Population Insights</Text>
      </View>

      <View style={[styles.statCard, styles.shadow]}>
         {/* Card Header with Total & Tab Switcher */}
         <View style={styles.statCardHeader}>
            <View>
               <Text style={styles.statTotalLabel}>Total Sample</Text>
               <Text style={styles.statTotalValue}>{analyticsData.total}</Text>
            </View>
            
            {/* Tab Switcher - Compact */}
            <View style={styles.compactTabRow}>
               {categories.map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    onPress={() => setActiveTab(cat)} 
                    style={[styles.compactTab, activeTab === cat && styles.compactTabActive]}
                  >
                     <Text style={[styles.compactTabText, activeTab === cat && styles.compactTabTextActive]}>{cat}</Text>
                  </TouchableOpacity>
               ))}
            </View>
         </View>

         <View style={styles.divider} />

         {/* Horizontal Bars List */}
         <View style={styles.statList}>
            {analyticsData.items.map((item, index) => (
               <View key={index} style={styles.statRow}>
                  {/* Icon & Label */}
                  <View style={styles.statRowLabel}>
                     <View style={[styles.statRowIcon, {backgroundColor: `${item.color}15`}]}>
                        <Ionicons name={item.icon} size={14} color={item.color} />
                     </View>
                     <Text style={styles.statRowTitle}>{item.label}</Text>
                  </View>

                  {/* Progress Bar & Value */}
                  <View style={styles.statRowData}>
                     <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, {width: item.pct, backgroundColor: item.color}]} />
                     </View>
                     <Text style={styles.statRowValue}>{item.value}</Text>
                  </View>
               </View>
            ))}
         </View>
         
      </View>
      
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3D5A80" />
      
      {notification.visible && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View style={[styles.toastBar, notification.type === 'warning' ? styles.toastWarning : styles.toastInfo]}>
            <Ionicons name={notification.type === 'warning' ? "alert-circle" : "checkmark-circle"} size={20} color="#FFF" />
            <Text style={styles.toastText}>{notification.message}</Text>
          </View>
        </Animated.View>
      )}

      <Sidebar navigation={navigation} visible={sidebarVisible} onClose={() => setSidebarVisible(false)} user={currentUser} onLogout={handleLogout} />
      <Header onProfilePress={() => setSidebarVisible(true)} profileImage={currentUser?.profilePic} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoadingUser ? (
           <ActivityIndicator size="small" color="#3D5A80" style={{marginTop: 50}} />
        ) : (
           currentUser ? renderUserDashboard() : renderGuestGuide()
        )}
        <View style={{height: 120}} /> 
      </ScrollView>

      <BottomNavBar navigation={navigation} activeTab="Home" alertsCount={alertsCount} user={currentUser} />
      <FloatingChatbot user={currentUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  shadow: {
    ...Platform.select({
      ios: { shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  
  // TOAST
  toastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 20, left: 20, right: 20, zIndex: 9999, alignItems: 'center' },
  toastBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  toastWarning: { backgroundColor: '#E76F51' }, 
  toastInfo: { backgroundColor: '#2A9D8F' },    
  toastText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 10 },

  // --- LOGGED IN DASHBOARD STYLES ---
  dashboardContainer: { gap: 25 },
  
  // 1. Header & Stats
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userGreeting: { fontSize: 14, color: '#7F8C8D', fontWeight: '500' },
  userName: { fontSize: 24, color: '#2C3E50', fontWeight: '800' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E7ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 5 },
  dateText: { fontSize: 12, fontWeight: '700', color: '#3D5A80' },
  
  statsTicker: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  tickerItem: { alignItems: 'center', flex: 1 },
  tickerValue: { fontSize: 18, fontWeight: '800', color: '#3D5A80' },
  tickerLabel: { fontSize: 11, color: '#95A5A6', marginTop: 2 },
  tickerDivider: { width: 1, height: '80%', backgroundColor: '#F0F0F0', alignSelf: 'center' },

  // 2. Main Actions
  actionRow: { flexDirection: 'row', gap: 15 },
  actionCard: { flex: 1, padding: 16, borderRadius: 20, justifyContent: 'center' },
  actionIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionCardTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  actionCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  // 3. Horizontal Scans
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#2C3E50' },
  viewLink: { fontSize: 12, color: '#3D5A80', fontWeight: 'bold' },
  horizontalScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  scanCard: { width: 150, height: 200, borderRadius: 20, marginRight: 15, overflow: 'hidden', backgroundColor: '#FFF' },
  scanImage: { width: '100%', height: '100%' },
  scanOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  scanContent: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  scanTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  scanDate: { color: '#DDD', fontSize: 10, fontWeight: '600' },
  scanResult: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // 5. NEW STAT CARD (HORIZONTAL BARS)
  statCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statTotalLabel: { fontSize: 11, color: '#95A5A6', fontWeight: '600', textTransform: 'uppercase' },
  statTotalValue: { fontSize: 22, fontWeight: '900', color: '#2C3E50' },
  
  compactTabRow: { flexDirection: 'row', backgroundColor: '#F4F6F7', borderRadius: 10, padding: 3 },
  compactTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  compactTabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  compactTabText: { fontSize: 10, fontWeight: '600', color: '#95A5A6' },
  compactTabTextActive: { color: '#3D5A80', fontWeight: '700' },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
  
  statList: { gap: 15 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statRowLabel: { flexDirection: 'row', alignItems: 'center', width: '35%' },
  statRowIcon: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statRowTitle: { fontSize: 12, fontWeight: '600', color: '#555' },
  
  statRowData: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  statRowValue: { width: 30, fontSize: 12, fontWeight: '700', color: '#2C3E50', textAlign: 'right' },


  // --- GUEST MODE STYLES (PRESERVED) ---
  guestContainer: { marginTop: 5, paddingBottom: 20 },
  heroCard: { height: 220, borderRadius: 24, marginBottom: 25, overflow: 'hidden', backgroundColor: '#293241' },
  heroImage: { width: '100%', height: '100%', opacity: 0.9 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 20 },
  newBadge: { backgroundColor: '#E76F51', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 5, width: '80%' },
  heroSubtitle: { color: '#E0FBFC', fontSize: 14, fontWeight: '500' },
  botShowcase: { backgroundColor: '#F8F9FA', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#FFF' },
  botHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  botAvatarContainer: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E0FBFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  botName: { fontSize: 16, fontWeight: '800', color: '#2C3E50' },
  botStatus: { fontSize: 12, color: '#27AE60', fontWeight: '600' },
  mockChatContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E0E7ED' },
  mockUserBubble: { alignSelf: 'flex-end', backgroundColor: '#3D5A80', padding: 10, borderRadius: 12, borderBottomRightRadius: 2, marginBottom: 10 },
  mockUserText: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  mockBotBubble: { alignSelf: 'flex-start', backgroundColor: '#F4F6F7', padding: 10, borderRadius: 12, borderBottomLeftRadius: 2, maxWidth: '90%' },
  mockBotText: { color: '#2C3E50', fontSize: 13 },
  tryBotBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#3D5A80', gap: 8 },
  tryBotText: { color: '#3D5A80', fontWeight: '700', fontSize: 13 },
  featureGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  gridItem: { width: '31%', backgroundColor: '#FFF', borderRadius: 20, padding: 15, alignItems: 'center' },
  gridIcon: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridTitle: { fontSize: 13, fontWeight: '800', color: '#2C3E50', marginBottom: 2 },
  gridSub: { fontSize: 10, color: '#95A5A6', textAlign: 'center' },
  modernCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#E0E7ED' },
  ctaHeading: { fontSize: 16, fontWeight: '800', color: '#3D5A80' },
  ctaSub: { fontSize: 12, color: '#98C1D9', fontWeight: '600' },
  ctaBtnModern: { backgroundColor: '#3D5A80', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaBtnTextModern: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});