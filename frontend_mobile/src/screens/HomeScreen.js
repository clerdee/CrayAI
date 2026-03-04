import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Platform, StatusBar, ActivityIndicator, Animated, Dimensions, RefreshControl 
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { LineChart, BarChart } from "react-native-chart-kit"; 

import client from '../api/client'; 
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';
import FloatingChatbot from '../components/FloatingChatbot';
import ScanDetailsModal from '../components/ScanDetailsModal'; 

const { width, height } = Dimensions.get('window');
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SLIDESHOW_IMAGES = [
  {

    uri: require('../../assets/arc-crayfish.jpg'),
    caption: 'Precision Classification',
    sub: 'Identify gender, size & health in seconds.',
  },
  {
    uri: require('../../assets/blue.jpg'),
    caption: 'Species Recognition',
    sub: 'AI-powered detection of 10+ crayfish varieties.',
  },
  {
    uri: require('../../assets/water.jpg'),
    caption: 'Water Quality Monitoring',
    sub: 'Real-time turbidity & algae level tracking.',
  },
  {
    uri: require('../../assets/age.jpg'),
    caption: 'Growth & Age Tracking',
    sub: 'Monitor morphometrics across your colony.',
  },
  {
    uri: require('../../assets/market.jpg'),
    caption: 'Market Intelligence',
    sub: 'Community-driven pricing & economics data.',
  },
];

const FEATURE_CARDS = [
  { icon: 'scan', color: '#3D5A80', bg: '#E0E7ED', label: 'AI Scanner', desc: 'Instant species ID' },
  { icon: 'water', color: '#2A9D8F', bg: '#D0F0EC', label: 'Water Quality', desc: 'Turbidity alerts' },
  { icon: 'stats-chart', color: '#E76F51', bg: '#FAE0D8', label: 'Analytics', desc: 'Growth insights' },
  { icon: 'chatbubble-ellipses', color: '#8AB4F8', bg: '#E0EAFF', label: 'CrayBot AI', desc: 'Ask anything' },
];

export default function HomeScreen({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Age'); 
  const [alertsCount, setAlertsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [recentScans, setRecentScans] = useState([]); 
  const [stats, setStats] = useState({ total: 0, warnings: 0, berried: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [marketProjections, setMarketProjections] = useState(MONTH_NAMES.map(m => ({ month: m, price: 0 })));
  const [marketMonthIndex, setMarketMonthIndex] = useState(new Date().getMonth()); 

  const [selectedScan, setSelectedScan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [notification, setNotification] = useState({ visible: false, message: '', type: 'info' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ─── Slideshow state ────────────────────────────────────────────────────────
  const [slideIndex, setSlideIndex] = useState(0);
  const slideOpacities = useRef(SLIDESHOW_IMAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const textFade = useRef(new Animated.Value(1)).current;
  const slideTimer = useRef(null);

  const goToSlide = (nextIndex) => {
    const currentIdx = slideIndex;
    // Fade out text
    Animated.timing(textFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      // Cross-fade images
      Animated.parallel([
        Animated.timing(slideOpacities[currentIdx], { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(slideOpacities[nextIndex], { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
      setSlideIndex(nextIndex);
      // Fade in new text
      Animated.timing(textFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  };

  const advanceSlide = useCallback(() => {
    setSlideIndex(prev => {
      const next = (prev + 1) % SLIDESHOW_IMAGES.length;
      Animated.parallel([
        Animated.timing(slideOpacities[prev], { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.timing(slideOpacities[next], { toValue: 1, duration: 700, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(textFade, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(textFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      return next;
    });
  }, [slideOpacities, textFade]);

  useEffect(() => {
    slideTimer.current = setInterval(advanceSlide, 4000);
    return () => clearInterval(slideTimer.current);
  }, [advanceSlide]);

  // ─── Feature card stagger animations ───────────────────────────────────────
  const cardAnims = useRef(FEATURE_CARDS.map(() => new Animated.Value(0))).current;
  const cardTranslates = useRef(FEATURE_CARDS.map(() => new Animated.Value(24))).current;

  useEffect(() => {
    const anims = FEATURE_CARDS.map((_, i) =>
      Animated.parallel([
        Animated.timing(cardAnims[i], { toValue: 1, duration: 400, delay: 600 + i * 100, useNativeDriver: true }),
        Animated.timing(cardTranslates[i], { toValue: 0, duration: 400, delay: 600 + i * 100, useNativeDriver: true }),
      ])
    );
    Animated.stagger(80, anims).start();
  }, []);

  useEffect(() => {
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ visible: true, message, type });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setNotification({ visible: false, message: '', type: 'info' });
      });
    }, 3000);
  };

  useEffect(() => {
    const loadAlertBadge = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const value = await AsyncStorage.getItem('alertsCount');
        setAlertsCount(Number(value || 0));
      }
    };
    const unsubscribe = navigation.addListener('focus', loadAlertBadge);
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, [navigation]);

  useFocusEffect(useCallback(() => { checkLoginStatus(); }, []));

  const checkLoginStatus = async () => {
    setIsLoadingUser(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await client.get('/auth/profile');
        if (res.data?.success) {
            setCurrentUser(res.data.user);
            fetchDashboardData(); 
        }
      } else { setCurrentUser(null); }
    } catch (error) { setCurrentUser(null); } 
    finally { setIsLoadingUser(false); }
  };

  const fetchDashboardData = async () => {
    try {
        const scanRes = await client.get('/scans/me');
        if (scanRes.data?.success) {
            const records = scanRes.data.records || [];
            const activeRecords = records.filter(r => !r.isDeleted);
            setRecentScans(activeRecords);
            
            const total = activeRecords.length;
            let warnings = 0;
            activeRecords.forEach(r => {
               if(r.environment?.algae_label === 'High' || r.environment?.algae_label === 'Critical') warnings++;
               if(r.environment?.turbidity_level >= 7) warnings++;
            });
            setStats({ total, warnings, berried: 0 }); 
        }

        const feedRes = await client.get('/posts/feed');
        if (feedRes.data?.posts) {
            const sales = feedRes.data.posts.filter(p => p.isForSale && p.price > 0);
            let baseData = MONTH_NAMES.map(m => ({ month: m, price: 0 }));
            
            if (sales.length > 0) {
                const monthlyTotals = {};
                const monthlyCounts = {};
                sales.forEach(sale => {
                    const monthIdx = new Date(sale.createdAt).getMonth();
                    if (!monthlyTotals[monthIdx]) {
                        monthlyTotals[monthIdx] = 0;
                        monthlyCounts[monthIdx] = 0;
                    }
                    monthlyTotals[monthIdx] += sale.price;
                    monthlyCounts[monthIdx] += 1;
                });

                let lastKnownPrice = 0;
                for (let i = 0; i < 12; i++) {
                    if (monthlyCounts[i]) {
                        lastKnownPrice = Math.round(monthlyTotals[i] / monthlyCounts[i]);
                        break;
                    }
                }

                for (let i = 0; i < 12; i++) {
                    if (monthlyCounts[i]) {
                        const avg = Math.round(monthlyTotals[i] / monthlyCounts[i]);
                        baseData[i].price = avg;
                        lastKnownPrice = avg;
                    } else {
                        baseData[i].price = lastKnownPrice; 
                    }
                }
            }
            setMarketProjections(baseData);
        }
    } catch (error) { console.error("Failed to fetch dashboard data:", error); }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    checkLoginStatus().then(() => setRefreshing(false));
  }, []);

  const handleCameraPress = () => {
    if (currentUser) navigation.navigate('Camera');
    else showNotification("Login required for AI Scanner.", "warning");
  };

  const handleUploadPress = async () => {
    if (!currentUser) return showNotification("Login required to upload.", "warning");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return showNotification("Gallery permission is needed.", "warning");
    
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true, 
        aspect: [4, 3], 
        quality: 1,
    });
    if (!result.canceled) showNotification("Image selected! Analyzing...", "success");
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'userInfo', 'alertsCount']);
    setCurrentUser(null);
    setSidebarVisible(false);
    navigation.navigate('Login');
  };

  // ─── Demographics logic (unchanged) ────────────────────────────────────────
  const categories = ['Gender', 'Size', 'Age'];
  const getAnalyticsData = () => {
    if (recentScans.length === 0) return { total: 0, items: [ { label: 'No Data', value: 0, pct: '0%', color: '#BDC3C7', icon: 'remove-outline' } ] };
    const total = recentScans.length;
    let items = [];

    if (activeTab === 'Age') {
        let crayling = 0, juv = 0, sub = 0, adult = 0;
        recentScans.forEach(r => {
           const age = r.morphometrics?.estimated_age || '';
           if(age.includes('Crayling')) crayling++;
           else if(age.includes('Juvenile')) juv++;
           else if(age.includes('Sub-Adult')) sub++;
           else if(age.includes('Adult')) adult++;
        });
        items = [
           { label: 'Crayling (< 1 mo)', value: crayling, pct: `${Math.round((crayling/total)*100)}%`, color: '#8AB4F8', icon: 'egg' },
           { label: 'Juvenile (1-3 mo)', value: juv, pct: `${Math.round((juv/total)*100)}%`, color: '#3D5A80', icon: 'fish' },
           { label: 'Sub-Adult (3-6 mo)', value: sub, pct: `${Math.round((sub/total)*100)}%`, color: '#E76F51', icon: 'water' },
           { label: 'Adult (> 6 mo)', value: adult, pct: `${Math.round((adult/total)*100)}%`, color: '#2A9D8F', icon: 'star' }
        ];
    } else if (activeTab === 'Size') {
        let size1 = 0, size2 = 0, size3 = 0, size4 = 0;
        recentScans.forEach(r => {
           const h = r.morphometrics?.height_cm || 0;
           if(h > 0 && h < 3) size1++;
           else if(h >= 3 && h < 7) size2++;
           else if(h >= 7 && h < 11) size3++;
           else if(h >= 11) size4++;
        });
        items = [
           { label: '< 3 cm', value: size1, pct: `${Math.round((size1/total)*100)}%`, color: '#8AB4F8', icon: 'resize' },
           { label: '3 - 6.9 cm', value: size2, pct: `${Math.round((size2/total)*100)}%`, color: '#3D5A80', icon: 'resize' },
           { label: '7 - 10.9 cm', value: size3, pct: `${Math.round((size3/total)*100)}%`, color: '#E76F51', icon: 'resize' },
           { label: '> 11 cm', value: size4, pct: `${Math.round((size4/total)*100)}%`, color: '#2A9D8F', icon: 'resize' }
        ];
    } else {
        items = [
           { label: 'Male', value: 0, pct: '0%', color: '#8AB4F8', icon: 'male' },
           { label: 'Female', value: 0, pct: '0%', color: '#E76F51', icon: 'female' },
           { label: 'Berried', value: 0, pct: '0%', color: '#2A9D8F', icon: 'water' }
        ];
    }
    return { total, items };
  };
  const analyticsData = getAnalyticsData();

  const getTurbidityTrendData = () => {
    if (recentScans.length === 0) return { labels: ["No Data"], data: [0] };
    const last5 = [...recentScans].slice(0, 5).reverse();
    const labels = last5.map(r => `${new Date(r.createdAt).getMonth()+1}/${new Date(r.createdAt).getDate()}`);
    const data = last5.map(r => r.environment?.turbidity_level || 1);
    return { labels, data };
  };
  const turbidityTrend = getTurbidityTrendData();

  const getAlgaeBarData = () => {
    if (recentScans.length === 0) return { labels: ["Low", "Mod", "High", "Crit"], data: [0, 0, 0, 0] };
    let low = 0, mod = 0, high = 0, crit = 0;
    recentScans.forEach(r => {
        const a = r.environment?.algae_label || 'Low';
        if(a.includes('Low')) low++;
        else if(a.includes('Moderate')) mod++;
        else if(a.includes('High')) high++;
        else crit++;
    });
    return { labels: ["Low", "Mod", "High", "Crit"], data: [low, mod, high, crit] };
  };
  const algaeBarData = getAlgaeBarData();

  const darkLineConfig = {
    backgroundGradientFrom: "#293241", backgroundGradientTo: "#293241",
    color: (opacity = 1) => `rgba(138, 180, 248, ${opacity})`, 
    labelColor: (opacity = 1) => `rgba(169, 185, 198, ${opacity})`,
    strokeWidth: 3, decimalPlaces: 0, propsForDots: { r: "5", strokeWidth: "2", stroke: "#293241" },
    fillShadowGradient: '#8AB4F8', fillShadowGradientOpacity: 0.15
  };

  const flatBarConfig = {
    backgroundGradientFrom: "#F4F6F7", backgroundGradientTo: "#F4F6F7",
    color: (opacity = 1) => `rgba(42, 157, 143, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 110, 120, ${opacity})`,
    barPercentage: 0.6, decimalPlaces: 0, fillShadowGradient: '#2A9D8F', fillShadowGradientOpacity: 1
  };

  const marketChartConfig = {
    backgroundGradientFrom: "#FFF", backgroundGradientTo: "#FFF",
    color: (opacity = 1) => `rgba(61, 90, 128, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    strokeWidth: 2, decimalPlaces: 0, fillShadowGradient: '#3D5A80', fillShadowGradientOpacity: 0.1
  };

  const hasMarketData = marketProjections.some(m => m.price > 0);

  const handleNextMonth = () => setMarketMonthIndex((prev) => (prev + 1) % 12);
  const handlePrevMonth = () => setMarketMonthIndex((prev) => (prev - 1 + 12) % 12);

  // ==========================================
  // RENDER: IMPROVED GUEST MODE
  // ==========================================
  const renderGuestGuide = () => (
    <View style={styles.guestContainer}>

      {/* ── HERO SLIDESHOW ─────────────────────────────────────────────── */}
      <View style={styles.heroSlideshow}>
        {/* Stacked crossfade images */}
        {SLIDESHOW_IMAGES.map((slide, i) => (
          <Animated.View
            key={i}
            style={[StyleSheet.absoluteFill, { opacity: slideOpacities[i] }]}
          >
          <Image
            source={slide.uri} 
            style={styles.heroSlideshowImage}
            resizeMode="cover"
          />
          </Animated.View>
        ))}

        {/* Cinematic gradient overlay — dark top + heavy bottom */}
        <LinearGradient
          colors={[
            'rgba(25, 35, 50, 0.35)',
            'transparent',
            'transparent',
            'rgba(18, 28, 42, 0.92)',
          ]}
          locations={[0, 0.25, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top badge */}
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.heroBadgeText}>AI RESEARCH TOOL</Text>
          </View>
        </View>

        {/* Bottom text + dots */}
        <View style={styles.heroBottom}>
          <Animated.View style={{ opacity: textFade }}>
            <Text style={styles.heroSlideTitle}>
              {SLIDESHOW_IMAGES[slideIndex].caption}
            </Text>
            <Text style={styles.heroSlideSub}>
              {SLIDESHOW_IMAGES[slideIndex].sub}
            </Text>
          </Animated.View>

          {/* Progress dots */}
          <View style={styles.dotRow}>
            {SLIDESHOW_IMAGES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  clearInterval(slideTimer.current);
                  goToSlide(i);
                  slideTimer.current = setInterval(advanceSlide, 4000);
                }}
                style={[
                  styles.dot,
                  i === slideIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* ── FEATURE GRID ────────────────────────────────────────────────── */}
      <View style={styles.featureGrid}>
        {FEATURE_CARDS.map((f, i) => (
          <Animated.View
            key={i}
            style={[
              styles.featureCard,
              {
                opacity: cardAnims[i],
                transform: [{ translateY: cardTranslates[i] }],
              },
            ]}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
              <Ionicons name={f.icon} size={22} color={f.color} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </Animated.View>
        ))}
      </View>

      {/* ── CRAYBOT TEASER ──────────────────────────────────────────────── */}
      <View style={[styles.botShowcase, styles.shadow]}>
        <View style={styles.botHeader}>
          <View style={styles.botAvatarContainer}>
            <Text style={{ fontSize: 22 }}>🦐</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.botName}>CrayBot AI</Text>
            <View style={styles.botStatusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.botStatus}>Online · Research Assistant</Text>
            </View>
          </View>
          <View style={styles.botBadge}>
            <Text style={styles.botBadgeText}>FREE</Text>
          </View>
        </View>

        <View style={styles.mockChatContainer}>
          <View style={styles.mockUserBubble}>
            <Text style={styles.mockUserText}>Is this crayfish healthy? 📸</Text>
          </View>
          <View style={styles.mockBotBubble}>
            <Text style={styles.mockBotText}>
              Analyzed ✓ — This is a{' '}
              <Text style={{ fontWeight: '800', color: '#E76F51' }}>Female Red Claw</Text>
              , estimated{' '}
              <Text style={{ fontWeight: '700', color: '#2A9D8F' }}>4–5 months</Text>
              , in good health.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.tryBotBtn}
          onPress={() => showNotification('Log in to chat with CrayBot!', 'info')}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
          <Text style={styles.tryBotText}>Ask CrayBot a Question</Text>
        </TouchableOpacity>
      </View>

      {/* ── CTA STRIP ────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#3D5A80', '#293241']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaStrip}
      >
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaHeading}>Join CrayAI Today</Text>
          <Text style={styles.ctaSub}>Free account · No credit card needed</Text>
        </View>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.ctaBtnText}>Get Started</Text>
          <Feather name="arrow-right" size={16} color="#3D5A80" />
        </TouchableOpacity>
      </LinearGradient>

    </View>
  );

  // ==========================================
  // RENDER: USER DASHBOARD (unchanged)
  // ==========================================
  const renderUserDashboard = () => (
    <View style={styles.dashboardContainer}>
      
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        {recentScans.length > 0 && <TouchableOpacity onPress={() => navigation.navigate('History')}><Text style={styles.viewLink}>History</Text></TouchableOpacity>}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselContainer}>
            {recentScans.slice(0, 5).map((scan) => (
                <TouchableOpacity 
                    key={scan._id} 
                    style={[styles.scanCard, styles.shadow]}
                    onPress={() => {
                        setSelectedScan(scan);
                        setModalVisible(true);
                    }}
                >
                    <Image source={{ uri: scan.image?.url }} style={styles.scanCardImg} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.scanCardGrad}>
                        <Text style={styles.scanCardDate}>
                            {new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                        <Text style={styles.scanCardTitle}>
                            {scan.morphometrics?.height_cm}cm • {scan.environment?.algae_label}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            ))}
            <View style={{width: 40}}/> 
        </ScrollView>
      )}

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
                  <TouchableOpacity key={cat} onPress={() => setActiveTab(cat)} style={[styles.compactTab, activeTab === cat && styles.compactTabActive]}>
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

      <View style={styles.darkBleedSection}>
          <View style={styles.bleedHeader}>
              <View>
                  <Text style={styles.bleedTitle}>Turbidity Trend</Text>
                  <Text style={styles.bleedSub}>Historical water clarity (1-10)</Text>
              </View>
              <MaterialCommunityIcons name="water-opacity" size={24} color="#8AB4F8" />
          </View>
          
          <LineChart
            data={{
              labels: turbidityTrend.labels,
              datasets: [{ data: turbidityTrend.data }]
            }}
            width={width}
            height={180}
            yAxisInterval={2}
            fromZero={true}
            segments={5} 
            chartConfig={darkLineConfig}
            bezier
            style={{ marginVertical: 10 }}
          />
      </View>

      <View style={styles.flatInsetPanel}>
          <View style={styles.cardHeaderWithNav}>
              <View>
                  <Text style={styles.sectionTitle}>Algae Frequency</Text>
                  <Text style={styles.cardSubTitle}>Detection counts by severity</Text>
              </View>
              <MaterialCommunityIcons name="sprout" size={24} color="#2A9D8F" />
          </View>

          <BarChart
            data={{
              labels: algaeBarData.labels,
              datasets: [{ data: algaeBarData.data }]
            }}
            width={width - 80}
            height={180}
            yAxisSuffix=""
            fromZero={true}
            showValuesOnTopOfBars={true}
            chartConfig={flatBarConfig}
            style={{ marginTop: 10, alignSelf: 'center' }}
          />
      </View>

      <View style={styles.sectionHeader}>
         <Text style={styles.sectionTitle}>Economics</Text>
      </View>
      <View style={styles.asymmetricalCard}>
        <View style={styles.cardHeaderWithNav}>
            <View>
                <Text style={styles.sectionTitle}>Market Value Trend</Text>
                <Text style={styles.cardSubTitle}>Real-time community average</Text>
            </View>
            <View style={styles.moneyBadge}>
                <Feather name="trending-up" size={16} color="#0FA958" />
            </View>
        </View>

        {hasMarketData ? (
          <>
            <LineChart
                data={{
                    labels: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
                    datasets: [{ data: marketProjections.map(m => m.price) }]
                }}
                width={width - 70} 
                height={180}
                chartConfig={marketChartConfig}
                withDots={false}
                bezier
                style={{ marginVertical: 10, alignSelf: 'center' }}
            />
            <View style={styles.monthNavRow}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                    <Feather name="chevron-left" size={20} color="#3D5A80" />
                </TouchableOpacity>
                <View style={{alignItems:'center'}}>
                    <Text style={styles.monthNavLabel}>{marketProjections[marketMonthIndex].month} Average</Text>
                    <Text style={styles.monthNavValue}>₱ {marketProjections[marketMonthIndex].price} / kg</Text>
                </View>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                    <Feather name="chevron-right" size={20} color="#3D5A80" />
                </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={[styles.emptyStateContainer, { borderWidth: 0, marginTop: 10, padding: 15 }]}>
              <View style={[styles.emptyIconBg, { backgroundColor: '#F0F3F4' }]}>
                  <MaterialCommunityIcons name="tag-off-outline" size={28} color="#95A5A6" />
              </View>
              <Text style={styles.emptyTitle}>No Market Data Yet</Text>
              <Text style={styles.emptySub}>When users post items for sale, the average prices will map here.</Text>
          </View>
        )}
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

      <ScanDetailsModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        scan={selectedScan} 
      />

      <BottomNavBar navigation={navigation} activeTab="Home" alertsCount={alertsCount} user={currentUser} />
      <FloatingChatbot user={currentUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingTop: 10 },
  shadow: { shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  
  toastContainer: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 99, alignItems: 'center' },
  toastBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  toastWarning: { backgroundColor: '#E76F51' }, 
  toastInfo: { backgroundColor: '#2A9D8F' },    
  toastText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 10 },

  // ─── Dashboard styles (unchanged) ──────────────────────────────────────────
  dashboardContainer: { gap: 20, paddingHorizontal: 20 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  userGreeting: { fontSize: 12, color: '#7F8C8D', fontWeight: '600', textTransform: 'uppercase' },
  userName: { fontSize: 22, color: '#293241', fontWeight: '800' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  dateText: { fontSize: 12, fontWeight: '700', color: '#3D5A80' },
  statsTicker: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#EAECEE' },
  tickerItem: { alignItems: 'center', flex: 1 },
  tickerValue: { fontSize: 18, fontWeight: '800', color: '#3D5A80' },
  tickerLabel: { fontSize: 11, color: '#95A5A6', marginTop: 2 },
  tickerDivider: { width: 1, height: '80%', backgroundColor: '#EAECEE', alignSelf: 'center' },
  actionRow: { flexDirection: 'row', gap: 15, height: 110 },
  actionCard: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  actionGradient: { flex: 1, padding: 16, justifyContent: 'space-between' },
  actionContentLight: { flex: 1, padding: 16, justifyContent: 'space-between', borderWidth: 1, borderColor: '#EAECEE', borderRadius: 24 },
  actionCardTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  actionCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  carouselContainer: { marginHorizontal: -20, paddingHorizontal: 20, overflow: 'visible' },
  scanCard: { width: 140, height: 160, borderRadius: 20, overflow: 'hidden', marginRight: 15, backgroundColor: '#FFF' },
  scanCardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  scanCardGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end', padding: 12 },
  scanCardDate: { color: '#E0FBFC', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  scanCardTitle: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2C3E50' },
  viewLink: { fontSize: 12, color: '#3D5A80', fontWeight: '700' },
  statCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EAECEE' },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statTotalLabel: { fontSize: 11, color: '#95A5A6', fontWeight: '600', textTransform: 'uppercase' },
  statTotalValue: { fontSize: 22, fontWeight: '900', color: '#2C3E50' },
  darkBleedSection: { backgroundColor: '#293241', marginHorizontal: -20, paddingVertical: 25, marginTop: 15 },
  bleedHeader: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  bleedTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  bleedSub: { fontSize: 12, color: '#8AB4F8', fontWeight: '500', marginTop: 2 },
  flatInsetPanel: { backgroundColor: '#F4F6F7', borderRadius: 24, padding: 20, marginTop: 10, borderWidth: 1, borderColor: '#EAECEE' },
  asymmetricalCard: {
    backgroundColor: '#FFF', borderTopLeftRadius: 40, borderBottomRightRadius: 40, borderTopRightRadius: 12, borderBottomLeftRadius: 12,
    padding: 20, marginTop: 5, elevation: 4, shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, borderWidth: 1, borderColor: '#EAECEE'
  },
  moneyBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0FBFC', justifyContent: 'center', alignItems: 'center' },
  cardHeaderWithNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardSubTitle: { fontSize: 11, color: '#95A5A6', fontWeight: '600', marginTop: 2 },
  monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navBtn: { padding: 10, backgroundColor: '#F4F6F7', borderRadius: 12 },
  monthNavLabel: { fontSize: 10, color: '#95A5A6', fontWeight: '600', textTransform: 'uppercase' },
  monthNavValue: { fontSize: 18, color: '#2C3E50', fontWeight: '800' },
  compactTabRow: { flexDirection: 'row', backgroundColor: '#F4F6F7', borderRadius: 10, padding: 3 },
  compactTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  compactTabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  compactTabText: { fontSize: 10, fontWeight: '600', color: '#95A5A6' },
  compactTabTextActive: { color: '#3D5A80', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
  statList: { gap: 15 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statRowLabel: { flexDirection: 'row', alignItems: 'center', width: '45%' },
  statRowIcon: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statRowTitle: { fontSize: 12, fontWeight: '600', color: '#555' },
  statRowData: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  statRowValue: { width: 35, fontSize: 12, fontWeight: '700', color: '#2C3E50', textAlign: 'right' },
  emptyStateContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 10 },
  emptyIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F4F6F7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#95A5A6', textAlign: 'center' },

  // ─── NEW Guest styles ───────────────────────────────────────────────────────
  guestContainer: { paddingBottom: 20 },

  // Slideshow hero (edge-to-edge, taller)
  heroSlideshow: {
    width: width,
    height: 300,
    overflow: 'hidden',
    marginBottom: 0,
    backgroundColor: '#1A2332',
  },
  heroSlideshowImage: {
    width: '100%',
    height: '100%',
  },
  heroBadgeRow: {
    position: 'absolute',
    top: 18,
    left: 20,
    right: 20,
    flexDirection: 'row',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroSlideTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroSlideSub: {
    color: 'rgba(224, 251, 252, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 14,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  // Feature grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECEE',
    shadowColor: '#3D5A80',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: '#95A5A6',
    fontWeight: '500',
  },

  // CrayBot teaser
  botShowcase: {
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAECEE',
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  botAvatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E0FBFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botName: { fontSize: 15, fontWeight: '800', color: '#2C3E50' },
  botStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#27AE60' },
  botStatus: { fontSize: 11, color: '#27AE60', fontWeight: '600' },
  botBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  botBadgeText: { fontSize: 10, fontWeight: '800', color: '#0284C7' },
  mockChatContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E7ED',
    gap: 10,
  },
  mockUserBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3D5A80',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  mockUserText: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  mockBotBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4F6F7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '92%',
  },
  mockBotText: { color: '#2C3E50', fontSize: 13, lineHeight: 19 },
  tryBotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3D5A80',
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
  },
  tryBotText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  // CTA strip
  ctaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    marginBottom: 8,
  },
  ctaLeft: { flex: 1 },
  ctaHeading: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  ctaSub: { fontSize: 11, color: 'rgba(224,251,252,0.75)', fontWeight: '500', marginTop: 2 },
  ctaBtn: {
    backgroundColor: '#E0FBFC',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  ctaBtnText: { color: '#3D5A80', fontWeight: '800', fontSize: 13 },
});