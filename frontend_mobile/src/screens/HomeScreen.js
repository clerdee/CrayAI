import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Platform, StatusBar, ActivityIndicator, Animated, Dimensions, RefreshControl 
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LineChart, PieChart, ProgressChart } from "react-native-chart-kit";

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
  const [refreshing, setRefreshing] = useState(false);
  
  // REAL DATA STATES
  const [recentScans, setRecentScans] = useState([]); 
  const [stats, setStats] = useState({ total: 0, warnings: 0, berried: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());

  // MARKET PREDICTION STATE
  const [marketMonthIndex, setMarketMonthIndex] = useState(0); // 0 = Jan

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

  // --- LOAD DATA & TIMERS ---
  useEffect(() => {
    const loadAlertBadge = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) setAlertsCount(0);
      else {
        const value = await AsyncStorage.getItem('alertsCount');
        setAlertsCount(Number(value || 0));
      }
    };
    const unsubscribe = navigation.addListener('focus', loadAlertBadge);
    
    // Auto-update date
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);

    return () => {
        unsubscribe();
        clearInterval(timer);
    };
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
        const res = await client.get('/auth/profile');
        if (res.data?.success) setCurrentUser(res.data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    checkLoginStatus().then(() => setRefreshing(false));
  }, []);

  // --- ACTIONS ---
  const handleCameraPress = () => {
    if (currentUser) navigation.navigate('Camera');
    else showNotification("Login required for AI Scanner.", "warning");
  };

  const handleUploadPress = async () => {
    if (!currentUser) {
        showNotification("Login required to upload.", "warning");
        return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        showNotification("Gallery permission is needed.", "warning");
        return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
    });
    if (!result.canceled) {
        showNotification("Image selected! Analyzing...", "success");
        // TODO: Handle image upload to API
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userInfo', 'alertsCount']);
    setCurrentUser(null);
    setSidebarVisible(false);
    navigation.navigate('Login');
  };

  // --- ANALYTICS DATA LOGIC (EMPTY/NO MOCK) ---
  const categories = ['Gender', 'Size', 'Age'];
  
  const getAnalyticsData = () => {
    return { 
        total: 0, 
        items: [
            { label: activeTab === 'Gender' ? 'Male' : activeTab === 'Size' ? 'Small' : 'Juvenile', value: 0, pct: '0%', color: '#3D5A80', icon: 'remove-outline' },
            { label: activeTab === 'Gender' ? 'Female' : activeTab === 'Size' ? 'Medium' : 'Sub-Adult', value: 0, pct: '0%', color: '#E76F51', icon: 'remove-outline' },
            { label: activeTab === 'Gender' ? 'Berried' : activeTab === 'Size' ? 'Large' : 'Adult', value: 0, pct: '0%', color: '#2A9D8F', icon: 'remove-outline' }
        ] 
    }; 
  };
  const analyticsData = getAnalyticsData();

  // --- MARKET FORECAST LOGIC ---
  const marketProjections = [
    { month: 'Jan', price: 350 }, { month: 'Feb', price: 380 }, { month: 'Mar', price: 410 },
    { month: 'Apr', price: 400 }, { month: 'May', price: 450 }, { month: 'Jun', price: 480 },
    { month: 'Jul', price: 510 }, { month: 'Aug', price: 530 }, { month: 'Sep', price: 550 },
    { month: 'Oct', price: 600 }, { month: 'Nov', price: 650 }, { month: 'Dec', price: 720 },
  ];

  const handleNextMonth = () => {
    setMarketMonthIndex((prev) => (prev + 1) % 12);
  };

  const handlePrevMonth = () => {
    setMarketMonthIndex((prev) => (prev - 1 + 12) % 12);
  };

  // --- CHART CONFIG ---
  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(61, 90, 128, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
  };

  // --- ALGAE DATA (GRAYED OUT STATE) ---
  // Using a single gray slice to represent "No Data" visually
  const algaeData = [
    { 
      name: "No Data", 
      population: 100, 
      color: "#F3F4F6", // Light Gray (Tailwind Gray-100)
      legendFontColor: "#9CA3AF", // Gray-400
      legendFontSize: 10 
    }
  ];

  // Turbidity Data (Placeholder for now)
  const turbidityData = { labels: ["Turbidity"], data: [0] };


  // ==========================================
  // RENDER: GUEST MODE
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
  // RENDER: USER DASHBOARD
  // ==========================================
  const renderUserDashboard = () => (
    <View style={styles.dashboardContainer}>
      
      {/* 1. HEADER */}
      <View style={styles.userHeader}>
        <View>
          <Text style={styles.userGreeting}>Welcome Back,</Text>
          <Text style={styles.userName}>{currentUser?.firstName || 'Researcher'}</Text>
        </View>
        <View style={styles.dateBadge}>
          <Feather name="calendar" size={14} color="#3D5A80" />
          <Text style={styles.dateText}>
            {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* 2. STATS TICKER */}
      <View style={styles.statsTicker}>
         <View style={styles.tickerItem}>
            <Text style={styles.tickerValue}>{stats.total}</Text>
            <Text style={styles.tickerLabel}>Total Scans</Text>
         </View>
         <View style={styles.tickerDivider} />
         <View style={styles.tickerItem}>
            <Text style={[styles.tickerValue, {color: '#E76F51'}]}>{stats.warnings}</Text>
            <Text style={styles.tickerLabel}>Warnings</Text>
         </View>
         <View style={styles.tickerDivider} />
         <View style={styles.tickerItem}>
            <Text style={[styles.tickerValue, {color: '#2A9D8F'}]}>{stats.berried}</Text>
            <Text style={styles.tickerLabel}>Berried</Text>
         </View>
      </View>

      {/* 3. MAIN ACTIONS */}
      <View style={styles.actionRow}>
         <TouchableOpacity style={[styles.actionCard, styles.shadow, {backgroundColor: '#293241'}]} onPress={handleCameraPress}>
             <LinearGradient colors={['#3D5A80', '#293241']} style={styles.actionGradient}>
                <Ionicons name="camera" size={28} color="#E0FBFC" />
                <View>
                    <Text style={styles.actionCardTitle}>New Scan</Text>
                    <Text style={styles.actionCardSub}>Identify Species</Text>
                </View>
             </LinearGradient>
         </TouchableOpacity>

         <TouchableOpacity style={[styles.actionCard, styles.shadow, {backgroundColor: '#FFF'}]} onPress={handleUploadPress}>
             <View style={styles.actionContentLight}>
                <Ionicons name="images" size={28} color="#3D5A80" />
                <View>
                    <Text style={[styles.actionCardTitle, {color: '#293241'}]}>Upload</Text>
                    <Text style={[styles.actionCardSub, {color: '#7F8C8D'}]}>From Gallery</Text>
                </View>
             </View>
         </TouchableOpacity>
      </View>

      {/* 4. RECENT SCANS (Below Actions) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        {recentScans.length > 0 && <TouchableOpacity><Text style={styles.viewLink}>History</Text></TouchableOpacity>}
      </View>

      {recentScans.length === 0 ? (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconBg}>
                <Ionicons name="scan-outline" size={32} color="#95A5A6" />
            </View>
            <Text style={styles.emptyTitle}>No recent scans</Text>
            <Text style={styles.emptySub}>Tap "New Scan" to start analyzing.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
            {recentScans.map((scan) => (
                <View key={scan.id} style={styles.scanCard}><Text>Scan Item</Text></View>
            ))}
        </ScrollView>
      )}

      {/* 5. DEMOGRAPHICS (Below Recent Scans) */}
      <View style={styles.sectionHeader}>
         <Text style={styles.sectionTitle}>Demographics</Text>
      </View>
      <View style={[styles.statCard, styles.shadow]}>
         <View style={styles.statCardHeader}>
            <View>
               <Text style={styles.statTotalLabel}>Total Sample</Text>
               <Text style={styles.statTotalValue}>{analyticsData.total}</Text>
            </View>
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
         <View style={styles.statList}>
            {analyticsData.items.map((item, index) => (
               <View key={index} style={styles.statRow}>
                  <View style={styles.statRowLabel}>
                      <View style={[styles.statRowIcon, {backgroundColor: `${item.color}15`}]}>
                         <Ionicons name={item.icon} size={14} color={item.color} />
                      </View>
                      <Text style={styles.statRowTitle}>{item.label}</Text>
                  </View>
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

      {/* 6. MARKET FORECAST (Month Navigation) */}
      <View style={[styles.statCard, styles.shadow, {padding: 15}]}>
        <View style={styles.cardHeaderWithNav}>
            <View>
                <Text style={styles.sectionTitle}>Market Value Forecast</Text>
                <Text style={styles.cardSubTitle}>Random Forest Projection</Text>
            </View>
            <MaterialCommunityIcons name="finance" size={24} color="#2A9D8F" />
        </View>

        <LineChart
            data={{
                labels: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
                datasets: [{ 
                    data: marketProjections.map(m => m.price),
                    color: (opacity = 1) => `rgba(42, 157, 143, ${opacity})`,
                    strokeWidth: 2
                }]
            }}
            width={width - 60} 
            height={180}
            chartConfig={{
                ...chartConfig,
                fillShadowGradient: '#2A9D8F',
                fillShadowGradientOpacity: 0.1,
                decimalPlaces: 0,
            }}
            withDots={false}
            bezier
            style={{ marginVertical: 10, borderRadius: 16 }}
        />

        {/* Month Navigation Control */}
        <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <Feather name="chevron-left" size={20} color="#3D5A80" />
            </TouchableOpacity>
            
            <View style={{alignItems:'center'}}>
                <Text style={styles.monthNavLabel}>{marketProjections[marketMonthIndex].month} Projection</Text>
                <Text style={styles.monthNavValue}>₱ {marketProjections[marketMonthIndex].price} / kg</Text>
            </View>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <Feather name="chevron-right" size={20} color="#3D5A80" />
            </TouchableOpacity>
        </View>
      </View>

      {/* 7. ENVIRONMENTAL ROW (Uneven Cards + Grayed Algae) */}
      <View style={styles.envRow}>
          
          {/* Algae Card - WIDER (Flex 1.5) with Gray Graph */}
          <View style={[styles.unevenCardWide, styles.shadow]}>
              <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
                  <Text style={styles.smallCardTitle}>Algae</Text>
                  <Ionicons name="water" size={16} color={algaeData[0].name === 'No Data' ? "#BDC3C7" : "#2A9D8F"} />
              </View>
              <PieChart
                data={algaeData}
                width={width * 0.45}
                height={100}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"0"}
                center={[0, 0]}
                absolute={false}
                hasLegend={true}
              />
          </View>

          {/* Turbidity Card - NARROWER (Flex 1) */}
          <View style={[styles.unevenCardNarrow, styles.shadow]}>
              <Text style={styles.smallCardTitle}>Turbidity</Text>
              <View style={{alignItems:'center', justifyContent:'center', height: 100}}>
                <ProgressChart
                    data={turbidityData}
                    width={width * 0.28}
                    height={100}
                    strokeWidth={8}
                    radius={28}
                    chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(231, 111, 81, ${opacity})`,
                    }}
                    hideLegend={true}
                />
                <View style={{position:'absolute'}}>
                    <Text style={{fontWeight:'800', color:'#2C3E50', fontSize: 12}}>0%</Text>
                </View>
              </View>
              <Text style={{fontSize:10, color:'#95A5A6', fontWeight:'700'}}>Low</Text>
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

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3D5A80']} />}
      >
        {isLoadingUser ? (
           <ActivityIndicator size="small" color="#3D5A80" style={{marginTop: 50}} />
        ) : (
           currentUser ? renderUserDashboard() : renderGuestGuide()
        )}
        <View style={{height: 100}} /> 
      </ScrollView>

      <BottomNavBar navigation={navigation} activeTab="Home" alertsCount={alertsCount} user={currentUser} />
      <FloatingChatbot user={currentUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  shadow: {
    shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3
  },
  
  // TOAST
  toastContainer: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 99, alignItems: 'center' },
  toastBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  toastWarning: { backgroundColor: '#E76F51' }, 
  toastInfo: { backgroundColor: '#2A9D8F' },    
  toastText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 10 },

  // DASHBOARD
  dashboardContainer: { gap: 20 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  userGreeting: { fontSize: 12, color: '#7F8C8D', fontWeight: '600', textTransform: 'uppercase' },
  userName: { fontSize: 22, color: '#293241', fontWeight: '800' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  dateText: { fontSize: 12, fontWeight: '700', color: '#3D5A80' },

  // Stats Ticker
  statsTicker: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  tickerItem: { alignItems: 'center', flex: 1 },
  tickerValue: { fontSize: 18, fontWeight: '800', color: '#3D5A80' },
  tickerLabel: { fontSize: 11, color: '#95A5A6', marginTop: 2 },
  tickerDivider: { width: 1, height: '80%', backgroundColor: '#F0F0F0', alignSelf: 'center' },

  // ACTIONS
  actionRow: { flexDirection: 'row', gap: 15, height: 110 },
  actionCard: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  actionGradient: { flex: 1, padding: 16, justifyContent: 'space-between' },
  actionContentLight: { flex: 1, padding: 16, justifyContent: 'space-between' },
  actionCardTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  actionCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  // CARDS & CHARTS
  statCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20 },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderWithNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statTotalLabel: { fontSize: 11, color: '#95A5A6', fontWeight: '600', textTransform: 'uppercase' },
  statTotalValue: { fontSize: 22, fontWeight: '900', color: '#2C3E50' },
  cardSubTitle: { fontSize: 11, color: '#95A5A6', fontWeight: '600' },

  // Month Navigation
  monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navBtn: { padding: 8, backgroundColor: '#F4F6F7', borderRadius: 10 },
  monthNavLabel: { fontSize: 10, color: '#95A5A6', fontWeight: '600', textTransform: 'uppercase' },
  monthNavValue: { fontSize: 16, color: '#2C3E50', fontWeight: '800' },

  // DEMOGRAPHICS TABS
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

  // ENV ROW (Uneven)
  envRow: { flexDirection: 'row', gap: 15 },
  unevenCardWide: { flex: 1.5, backgroundColor: '#FFF', borderRadius: 24, padding: 15, alignItems: 'center', justifyContent: 'center' },
  unevenCardNarrow: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 15, alignItems: 'center', justifyContent: 'center' },
  smallCardTitle: { fontSize: 13, fontWeight: '700', color: '#2C3E50', marginBottom: 5, alignSelf: 'flex-start' },

  // EMPTY STATE
  emptyStateContainer: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 10
  },
  emptyIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F4F6F7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#95A5A6', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#2C3E50' },
  viewLink: { fontSize: 12, color: '#3D5A80', fontWeight: '700' },

  // GUEST MODE STYLES
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