import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
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

export default function HomeScreen({ navigation }) {
  // --- STATE DEFINITIONS ---
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Gender');
  const [alertsCount, setAlertsCount] = useState(0);

  // --- USER STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // --- 1. LOAD NOTIFICATION BADGE (FIXED) ---
  useEffect(() => {
    const loadAlertBadge = async () => {
      // A. Check if user is logged in first
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        // B. If Guest, force badge to 0 (ignore stored data)
        setAlertsCount(0);
      } else {
        // C. If Logged In, read the stored count
        const value = await AsyncStorage.getItem('alertsCount');
        setAlertsCount(Number(value || 0));
      }
    };

    // D. Add listener to refresh badge whenever screen comes into focus
    const unsubscribe = navigation.addListener('focus', loadAlertBadge);
    return unsubscribe;
  }, [navigation]);

  // --- 2. CHECK LOGIN STATUS ON FOCUS ---
  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
    }, [])
  );

  const checkLoginStatus = async () => {
    setIsLoadingUser(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token from storage:', token ? 'Found' : 'Not found');
      
      if (token) {
        try {
          const res = await client.get('/auth/profile');
          if (res.data && res.data.success && res.data.user) {
             console.log('User logged in:', res.data.user.firstName);
             setCurrentUser(res.data.user);
          } else {
             setCurrentUser(null);
          }
        } catch (apiError) {
          console.log('API Error:', apiError.message);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.log('Error checking login status:', error);
      setCurrentUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // --- 3. FEATURE LOCK ---
  const handleCameraPress = () => {
    if (currentUser) {
      navigation.navigate('Camera');
    } else {
      Alert.alert(
        "Account Required",
        "You need to create an account to use the AI Scanner and save results to the database.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => navigation.navigate('Login') }
        ]
      );
    }
  };

  // --- 4. LOGOUT HANDLER ---
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('alertsCount'); // Clear alerts on logout
      setCurrentUser(null); 
      setAlertsCount(0); // Reset badge locally
      setSidebarVisible(false);
      navigation.navigate('Login');
    } catch (error) {
      console.log(error);
    }
  };

  // --- STATIC DATA & HELPERS ---
  const categories = ['Gender', 'Size', 'Age', 'Turbidity', 'Market', 'Profit', 'Algae'];
  
  const recentScans = [
    { id: 1, date: 'Today, 10:45 AM', result: 'Male', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=300' },
    { id: 2, date: 'Yesterday', result: 'Berried Female', image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=300' }
  ];

  const getGraphData = () => {
    switch(activeTab) {
      case 'Gender': return [{ h: 120, v: 120, c: '#E76F51', l: 'Male' }, { h: 90, v: 90, c: '#2A9D8F', l: 'Female' }, { h: 40, v: 40, c: '#F4A261', l: 'Berried' }];
      case 'Size': return [{ h: 60, v: 60, c: '#3498db', l: 'Small' }, { h: 110, v: 110, c: '#3498db', l: 'Medium' }, { h: 80, v: 80, c: '#3498db', l: 'Large' }];
      default: return [{ h: 120, v: 'Hi', c: '#E76F51', l: 'A' }, { h: 90, v: 'Med', c: '#2A9D8F', l: 'B' }];
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3D5A80" />

      {/* Sidebar with User Data */}
      <Sidebar 
        navigation={navigation} 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)}
        user={currentUser} 
        onLogout={handleLogout} 
      />

      <Header 
        onProfilePress={() => setSidebarVisible(true)} 
        profileImage={currentUser?.profilePic} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* WELCOME SECTION */}
        <View style={styles.welcomeSection}>
           {isLoadingUser ? (
             <ActivityIndicator size="small" color="#3D5A80" style={{ alignSelf: 'flex-start' }} />
           ) : (
             <Text style={styles.greetingText}>
               Hello, {currentUser ? (currentUser.firstName || currentUser.fullName) : 'Guest'}
             </Text>
           )}
           <Text style={styles.subGreeting}>
             {currentUser ? "Manage your crayfish classification today." : "Explore the CrayAI research dashboard."}
           </Text>
        </View>

        {/* CAMERA BUTTON */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleCameraPress}>
          <LinearGradient 
            colors={['#293241', '#3D5A80']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}} 
            style={[styles.scanBanner, styles.shadow]}
          >
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Quick Scan</Text>
              <Text style={styles.bannerSubtext}>AI-Powered classification</Text>
              <View style={styles.bannerBadge}>
                <Text style={styles.badgeText}>{currentUser ? "START NOW" : "LOGIN TO SCAN"}</Text>
              </View>
            </View>
            <FontAwesome5 name="camera" size={60} color="rgba(255,255,255,0.15)" style={styles.bannerIcon} />
          </LinearGradient>
        </TouchableOpacity>

        {/* DASHBOARD OVERVIEW */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Dashboard Overview</Text></View>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.shadow]}>
            <View style={[styles.iconBox, {backgroundColor: '#E0FBFC'}]}><Ionicons name="analytics" size={22} color="#3D5A80" /></View>
            <Text style={styles.metricVal}>142</Text>
            <Text style={styles.metricLab}>Total Scans</Text>
          </View>
          <View style={[styles.metricCard, styles.shadow]}>
            <View style={[styles.iconBox, {backgroundColor: '#FFDDD2'}]}><Ionicons name="egg-outline" size={22} color="#E76F51" /></View>
            <Text style={styles.metricVal}>18</Text>
            <Text style={styles.metricLab}>Berried</Text>
          </View>
        </View>

        {/* RECENT SCANS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Records</Text>
          <TouchableOpacity><Text style={styles.viewLink}>View All</Text></TouchableOpacity>
        </View>
        {recentScans.map((scan) => (
          <View key={scan.id} style={[styles.historyItem, styles.shadow]}>
            <Image source={{ uri: scan.image }} style={styles.itemThumb} />
            <View style={styles.itemMeta}>
              <Text style={styles.itemDate}>{scan.date}</Text>
              <Text style={[styles.itemStatus, { color: scan.result.includes('Berried') ? '#E76F51' : '#2A9D8F' }]}>{scan.result}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#BDC3C7" />
          </View>
        ))}

        {/* ANALYTICS GRAPH */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}><Text style={styles.sectionTitle}>Research Analytics</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setActiveTab(cat)} style={[styles.pill, activeTab === cat && styles.pillActive]}>
              <Text style={[styles.pillText, activeTab === cat && styles.pillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.graphCard, styles.shadow]}>
          <View style={styles.graphHeader}>
            <Text style={styles.graphTitle}>{activeTab} Analysis</Text>
            <MaterialCommunityIcons name="chart-bar" size={22} color="#3D5A80" />
          </View>
          <View style={styles.chartContainer}>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisText}>150</Text>
              <Text style={styles.yAxisText}>100</Text>
              <Text style={styles.yAxisText}>50</Text>
              <Text style={styles.yAxisText}>0</Text>
            </View>
            <View style={styles.gridArea}>
              <View style={[styles.gridLineH, { bottom: '100%' }]} />
              <View style={[styles.gridLineH, { bottom: '66.6%' }]} />
              <View style={[styles.gridLineH, { bottom: '33.3%' }]} />
              <View style={[styles.gridLineH, { bottom: '0%' }]} />
              <View style={styles.barsContainer}>
                {getGraphData().map((bar, i) => (
                  <View key={i} style={[styles.barWrapper, { width: 60 }]}>
                    <Text style={styles.barValue}>{bar.v}</Text> 
                    <View style={[styles.bar, { height: bar.h, backgroundColor: bar.c }]} />
                    <Text style={styles.barLabel}>{bar.l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={{height: 120}} /> 
      </ScrollView>

      {/* --- PASS THE ALERTS COUNT HERE --- */}
      <BottomNavBar navigation={navigation} activeTab="Home" alertsCount={alertsCount} />
      <FloatingChatbot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  shadow: {
    ...Platform.select({
      ios: { shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  welcomeSection: { marginBottom: 20 },
  greetingText: { fontSize: 16, color: '#3D5A80', fontWeight: '600' },
  subGreeting: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  scanBanner: { borderRadius: 16, padding: 20, flexDirection: 'row', overflow: 'hidden', marginBottom: 25 },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  bannerSubtext: { fontSize: 13, color: '#E0FBFC', marginTop: 4 },
  bannerBadge: { backgroundColor: '#98C1D9', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, marginTop: 12 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#293241' },
  bannerIcon: { position: 'absolute', right: -5, bottom: -5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2C3E50', textTransform: 'uppercase', letterSpacing: 0.5 },
  viewLink: { fontSize: 12, color: '#3D5A80', fontWeight: 'bold' },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 25 },
  metricCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 18, alignItems: 'flex-start' },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricVal: { fontSize: 24, fontWeight: '800', color: '#2C3E50' },
  metricLab: { fontSize: 12, color: '#7F8C8D', fontWeight: '500', marginTop: 2 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 12 },
  itemThumb: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F0F0F0' },
  itemMeta: { flex: 1, marginLeft: 12 },
  itemDate: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  itemStatus: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  pillContainer: { marginBottom: 15 },
  pill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E0E7ED', marginRight: 10, borderWidth: 1, borderColor: '#D1D9E0' },
  pillActive: { backgroundColor: '#3D5A80', borderColor: '#3D5A80' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#546E7A' },
  pillTextActive: { color: '#FFF' },
  graphCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20 },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  graphTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  chartContainer: { flexDirection: 'row', height: 210, paddingBottom: 25 },
  yAxis: { justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 10, paddingBottom: 20 },
  yAxisText: { fontSize: 10, color: '#95A5A6', fontWeight: '600' },
  gridArea: { flex: 1, position: 'relative' },
  gridLineH: { position: 'absolute', width: '100%', borderBottomWidth: 1, borderBottomColor: '#ECF0F1' },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', zIndex: 1 },
  barWrapper: { alignItems: 'center' }, 
  barValue: { fontSize: 10, fontWeight: '700', color: '#3D5A80', marginBottom: 4 },
  bar: { width: 35, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { marginTop: 8, fontSize: 11, fontWeight: '700', color: '#7F8C8D', textAlign: 'center' }
});