import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5, Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase Imports
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // Added listener
import { auth, db } from '../config/firebase';

// Custom Components
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';

export default function HomeScreen({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Gender');
  
  // --- USER DATA STATE ---
  const [currentUser, setCurrentUser] = useState(null); // Tracks real auth state
  const [userName, setUserName] = useState('Guest');
  const [profilePic, setProfilePic] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // --- 1. REAL-TIME AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // Save the actual user object
      
      if (user) {
        // FETCH REAL DATA FOR LOGGED IN USERS
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.firstName || 'Researcher');
          setProfilePic(data.profilePic || null);
        }
      } else {
        // RESET FOR GUESTS
        setUserName('Guest');
        setProfilePic(null);
      }
      setIsLoadingUser(false);
    });

    return unsubscribe; // Cleanup listener on unmount
  }, []);

  // --- 2. FEATURE LOCK (THE "BOUNCER") ---
  const handleCameraPress = () => {
    if (currentUser) {
      // User is logged in, open the AI Camera
      navigation.navigate('Camera');
    } else {
      // User is a guest, prompt them to login
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

  const categories = ['Gender', 'Size', 'Age', 'Turbidity', 'Market', 'Profit', 'Algae'];

  const recentScans = [
    { id: 1, date: 'Today, 10:45 AM', result: 'Male', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=300' },
    { id: 2, date: 'Yesterday', result: 'Berried Female', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=300' }
  ];

  const getGraphData = () => {
    switch(activeTab) {
      case 'Gender': return [{ h: 120, v: 120, c: '#E76F51', l: 'Male' }, { h: 90, v: 90, c: '#2A9D8F', l: 'Female' }, { h: 40, v: 40, c: '#F4A261', l: 'Berried' }];
      case 'Size': return [{ h: 60, v: 60, c: '#3498db', l: 'Small' }, { h: 110, v: 110, c: '#3498db', l: 'Medium' }, { h: 80, v: 80, c: '#3498db', l: 'Large' }];
      case 'Age': return [{ h: 50, v: 50, c: '#9b59b6', l: '3m' }, { h: 90, v: 90, c: '#9b59b6', l: '6m' }, { h: 130, v: 130, c: '#9b59b6', l: '9m' }];
      case 'Turbidity': return [{ h: 110, v: 110, c: '#3498db', l: 'AM' }, { h: 75, v: 75, c: '#2980b9', l: 'PM' }];
      case 'Market': return [{ h: 80, v: 80, c: '#f1c40f', l: 'Oct' }, { h: 100, v: 100, c: '#f1c40f', l: 'Nov' }, { h: 130, v: 130, c: '#f1c40f', l: 'Dec' }];
      case 'Profit': return [{ h: 50, v: '50k', c: '#2ecc71', l: 'Q1' }, { h: 80, v: '80k', c: '#2ecc71', l: 'Q2' }, { h: 140, v: '140k', c: '#27ae60', l: 'Q3' }];
      case 'Algae': return [{ h: 40, v: 'Low', c: '#16a085', l: 'Low' }, { h: 90, v: 'Med', c: '#16a085', l: 'Med' }, { h: 150, v: 'High', c: '#117a65', l: 'High' }];
      default: return [];
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3D5A80" />

      <Sidebar 
        navigation={navigation} 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
      />

      <Header onProfilePress={() => setSidebarVisible(true)} profileImage={profilePic} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- 3. DYNAMIC WELCOME SECTION --- */}
        <View style={styles.welcomeSection}>
           {isLoadingUser ? (
             <ActivityIndicator size="small" color="#3D5A80" style={{ alignSelf: 'flex-start' }} />
           ) : (
             <Text style={styles.greetingText}>Hello, {userName}</Text>
           )}
           <Text style={styles.subGreeting}>
             {currentUser ? "Manage your crayfish classification today." : "Explore the CrayAI research dashboard."}
           </Text>
        </View>

        {/* --- 4. PROTECTED CAMERA BUTTON --- */}
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
                {/* Text changes based on user status */}
                <Text style={styles.badgeText}>{currentUser ? "START NOW" : "LOGIN TO SCAN"}</Text>
              </View>
            </View>
            <FontAwesome5 name="camera" size={60} color="rgba(255,255,255,0.15)" style={styles.bannerIcon} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Overview */}
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

        {/* History */}
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

        {/* Analytics Section */}
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

      <BottomNavBar navigation={navigation} activeTab="Home" />
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