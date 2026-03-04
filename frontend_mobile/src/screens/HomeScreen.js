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

  // ─── Slideshow state ─────────────────────────────────────────────────────
  const [slideIndex, setSlideIndex] = useState(0);
  const slideOpacities = useRef(SLIDESHOW_IMAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const textFade = useRef(new Animated.Value(1)).current;
  const slideTimer = useRef(null);

  // ─── Dashboard entrance animations ───────────────────────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  const goToSlide = (nextIndex) => {
    const currentIdx = slideIndex;
    Animated.timing(textFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      Animated.parallel([
        Animated.timing(slideOpacities[currentIdx], { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(slideOpacities[nextIndex], { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
      setSlideIndex(nextIndex);
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

  // ─── Feature card stagger animations ─────────────────────────────────────
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

  const animateDashboardIn = () => {
    Animated.stagger(100, [
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(statsAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(actionsAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  };

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
          animateDashboardIn();
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
          if (r.environment?.algae_label === 'High' || r.environment?.algae_label === 'Critical') warnings++;
          if (r.environment?.turbidity_level >= 7) warnings++;
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
            if (!monthlyTotals[monthIdx]) { monthlyTotals[monthIdx] = 0; monthlyCounts[monthIdx] = 0; }
            monthlyTotals[monthIdx] += sale.price;
            monthlyCounts[monthIdx] += 1;
          });

          let lastKnownPrice = 0;
          for (let i = 0; i < 12; i++) {
            if (monthlyCounts[i]) { lastKnownPrice = Math.round(monthlyTotals[i] / monthlyCounts[i]); break; }
          }

          for (let i = 0; i < 12; i++) {
            if (monthlyCounts[i]) {
              const avg = Math.round(monthlyTotals[i] / monthlyCounts[i]);
              baseData[i].price = avg;
              lastKnownPrice = avg;
            } else { baseData[i].price = lastKnownPrice; }
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
      mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 1,
    });
    if (!result.canceled) showNotification("Image selected! Analyzing...", "success");
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'userInfo', 'alertsCount']);
    setCurrentUser(null);
    setSidebarVisible(false);
    navigation.navigate('Login');
  };

  // ─── Demographics logic ───────────────────────────────────────────────────
  const categories = ['Gender', 'Size', 'Age'];
  const getAnalyticsData = () => {
    if (recentScans.length === 0) return {
      total: 0,
      items: [{ label: 'No Data', value: 0, pct: '0%', color: '#BDC3C7', icon: 'remove-outline' }]
    };
    const total = recentScans.length;
    let items = [];

    if (activeTab === 'Age') {
      let crayling = 0, juv = 0, sub = 0, adult = 0;
      recentScans.forEach(r => {
        const age = r.morphometrics?.estimated_age || '';
        if (age.includes('Crayling')) crayling++;
        else if (age.includes('Juvenile')) juv++;
        else if (age.includes('Sub-Adult')) sub++;
        else if (age.includes('Adult')) adult++;
      });
      items = [
        { label: 'Crayling (< 1 mo)', value: crayling, pct: `${Math.round((crayling / total) * 100)}%`, color: '#8AB4F8', icon: 'egg' },
        { label: 'Juvenile (1-3 mo)', value: juv, pct: `${Math.round((juv / total) * 100)}%`, color: '#3D5A80', icon: 'fish' },
        { label: 'Sub-Adult (3-6 mo)', value: sub, pct: `${Math.round((sub / total) * 100)}%`, color: '#E76F51', icon: 'water' },
        { label: 'Adult (> 6 mo)', value: adult, pct: `${Math.round((adult / total) * 100)}%`, color: '#2A9D8F', icon: 'star' },
      ];
    } else if (activeTab === 'Size') {
      let size1 = 0, size2 = 0, size3 = 0, size4 = 0;
      recentScans.forEach(r => {
        const h = r.morphometrics?.height_cm || 0;
        if (h > 0 && h < 3) size1++;
        else if (h >= 3 && h < 7) size2++;
        else if (h >= 7 && h < 11) size3++;
        else if (h >= 11) size4++;
      });
      items = [
        { label: '< 3 cm', value: size1, pct: `${Math.round((size1 / total) * 100)}%`, color: '#8AB4F8', icon: 'resize' },
        { label: '3 - 6.9 cm', value: size2, pct: `${Math.round((size2 / total) * 100)}%`, color: '#3D5A80', icon: 'resize' },
        { label: '7 - 10.9 cm', value: size3, pct: `${Math.round((size3 / total) * 100)}%`, color: '#E76F51', icon: 'resize' },
        { label: '> 11 cm', value: size4, pct: `${Math.round((size4 / total) * 100)}%`, color: '#2A9D8F', icon: 'resize' },
      ];
    } else {
      items = [
        { label: 'Male', value: 0, pct: '0%', color: '#8AB4F8', icon: 'male' },
        { label: 'Female', value: 0, pct: '0%', color: '#E76F51', icon: 'female' },
        { label: 'Berried', value: 0, pct: '0%', color: '#2A9D8F', icon: 'water' },
      ];
    }
    return { total, items };
  };
  const analyticsData = getAnalyticsData();

  const getTurbidityTrendData = () => {
    if (recentScans.length === 0) return { labels: ["No Data"], data: [0] };
    const last5 = [...recentScans].slice(0, 5).reverse();
    const labels = last5.map(r => `${new Date(r.createdAt).getMonth() + 1}/${new Date(r.createdAt).getDate()}`);
    const data = last5.map(r => r.environment?.turbidity_level || 1);
    return { labels, data };
  };
  const turbidityTrend = getTurbidityTrendData();

  const getAlgaeBarData = () => {
    if (recentScans.length === 0) return { labels: ["Low", "Mod", "High", "Crit"], data: [0, 0, 0, 0] };
    let low = 0, mod = 0, high = 0, crit = 0;
    recentScans.forEach(r => {
      const a = r.environment?.algae_label || 'Low';
      if (a.includes('Low')) low++;
      else if (a.includes('Moderate')) mod++;
      else if (a.includes('High')) high++;
      else crit++;
    });
    return { labels: ["Low", "Mod", "High", "Crit"], data: [low, mod, high, crit] };
  };
  const algaeBarData = getAlgaeBarData();

  const darkLineConfig = {
    backgroundGradientFrom: "#1C2B3A",
    backgroundGradientTo: "#1C2B3A",
    color: (opacity = 1) => `rgba(138, 180, 248, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(160, 180, 200, ${opacity})`,
    strokeWidth: 3,
    decimalPlaces: 0,
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#1C2B3A" },
    fillShadowGradient: '#8AB4F8',
    fillShadowGradientOpacity: 0.2,
  };

  const flatBarConfig = {
    backgroundGradientFrom: "#F0F4F8",
    backgroundGradientTo: "#F0F4F8",
    color: (opacity = 1) => `rgba(42, 157, 143, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 115, 130, ${opacity})`,
    barPercentage: 0.6,
    decimalPlaces: 0,
    fillShadowGradient: '#2A9D8F',
    fillShadowGradientOpacity: 1,
  };

  const marketChartConfig = {
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    color: (opacity = 1) => `rgba(61, 90, 128, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    fillShadowGradient: '#3D5A80',
    fillShadowGradientOpacity: 0.12,
  };

  const hasMarketData = marketProjections.some(m => m.price > 0);
  const handleNextMonth = () => setMarketMonthIndex((prev) => (prev + 1) % 12);
  const handlePrevMonth = () => setMarketMonthIndex((prev) => (prev - 1 + 12) % 12);

  // ─── Greeting helper ──────────────────────────────────────────────────────
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // ==========================================
  // RENDER: GUEST MODE
  // ==========================================
  const renderGuestGuide = () => (
    <View style={styles.guestContainer}>
      {/* ── HERO SLIDESHOW ──────────────────────────────────────────────── */}
      <View style={styles.heroSlideshow}>
        {SLIDESHOW_IMAGES.map((slide, i) => (
          <Animated.View key={i} style={[StyleSheet.absoluteFill, { opacity: slideOpacities[i] }]}>
            <Image source={slide.uri} style={styles.heroSlideshowImage} resizeMode="cover" />
          </Animated.View>
        ))}
        <LinearGradient
          colors={['rgba(25, 35, 50, 0.35)', 'transparent', 'transparent', 'rgba(18, 28, 42, 0.92)']}
          locations={[0, 0.25, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.heroBadgeText}>AI RESEARCH TOOL</Text>
          </View>
        </View>
        <View style={styles.heroBottom}>
          <Animated.View style={{ opacity: textFade }}>
            <Text style={styles.heroSlideTitle}>{SLIDESHOW_IMAGES[slideIndex].caption}</Text>
            <Text style={styles.heroSlideSub}>{SLIDESHOW_IMAGES[slideIndex].sub}</Text>
          </Animated.View>
          <View style={styles.dotRow}>
            {SLIDESHOW_IMAGES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  clearInterval(slideTimer.current);
                  goToSlide(i);
                  slideTimer.current = setInterval(advanceSlide, 4000);
                }}
                style={[styles.dot, i === slideIndex ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* ── FEATURE GRID ───────────────────────────────────────────────── */}
      <View style={styles.featureGrid}>
        {FEATURE_CARDS.map((f, i) => (
          <Animated.View
            key={i}
            style={[styles.featureCard, { opacity: cardAnims[i], transform: [{ translateY: cardTranslates[i] }] }]}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
              <Ionicons name={f.icon} size={22} color={f.color} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </Animated.View>
        ))}
      </View>

      {/* ── CRAYBOT TEASER ─────────────────────────────────────────────── */}
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
              <Text style={{ fontWeight: '800', color: '#E76F51' }}>Female Red Claw</Text>, estimated{' '}
              <Text style={{ fontWeight: '700', color: '#2A9D8F' }}>4–5 months</Text>, in good health.
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

      {/* ── CTA STRIP ──────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#3D5A80', '#293241']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.ctaStrip}
      >
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaHeading}>Join CrayAI Today</Text>
          <Text style={styles.ctaSub}>Free account · No credit card needed</Text>
        </View>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.ctaBtnText}>Get Started</Text>
          <Feather name="arrow-right" size={16} color="#3D5A80" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // ==========================================
  // RENDER: USER DASHBOARD (Improved)
  // ==========================================
  const renderUserDashboard = () => (
    <View style={styles.dashboardContainer}>

      {/* ── HERO HEADER BANNER ──────────────────────────────────────────── */}
      <Animated.View style={[
        styles.heroBanner,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }]
        }
      ]}>
        <LinearGradient
          colors={['#1C2B3A', '#2E4560', '#3D5A80']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroBannerGradient}
        >
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <View style={styles.heroBannerContent}>
            <View style={styles.heroBannerLeft}>
              <View style={styles.greetingPill}>
                <View style={styles.greetingDot} />
                <Text style={styles.greetingPillText}>{getGreeting()}</Text>
              </View>
              <Text style={styles.heroBannerName}>
                {currentUser?.firstName || 'Researcher'} 👋
              </Text>
              <Text style={styles.heroBannerDate}>
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.heroBannerAvatar}
              onPress={() => setSidebarVisible(true)}
            >
              {currentUser?.profilePic
                ? <Image source={{ uri: currentUser.profilePic }} style={styles.heroBannerAvatarImg} />
                : <View style={styles.heroBannerAvatarPlaceholder}>
                    <Text style={styles.heroBannerAvatarLetter}>
                      {(currentUser?.firstName || 'R')[0].toUpperCase()}
                    </Text>
                  </View>
              }
              <View style={styles.avatarOnline} />
            </TouchableOpacity>
          </View>

          {/* ── STAT PILLS ── */}
          <View style={styles.heroBannerStats}>
            <View style={styles.heroBannerStatItem}>
              <Text style={styles.heroBannerStatValue}>{stats.total}</Text>
              <Text style={styles.heroBannerStatLabel}>Total Scans</Text>
            </View>
            <View style={styles.heroBannerStatDivider} />
            <View style={styles.heroBannerStatItem}>
              <Text style={[styles.heroBannerStatValue, { color: '#FF8A70' }]}>{stats.warnings}</Text>
              <Text style={styles.heroBannerStatLabel}>Warnings</Text>
            </View>
            <View style={styles.heroBannerStatDivider} />
            <View style={styles.heroBannerStatItem}>
              <Text style={[styles.heroBannerStatValue, { color: '#4ECDC4' }]}>{stats.berried}</Text>
              <Text style={styles.heroBannerStatLabel}>Berried</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── QUICK ACTIONS ───────────────────────────────────────────────── */}
      <Animated.View style={[
        styles.actionSection,
        {
          opacity: actionsAnim,
          transform: [{ translateY: actionsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
        }
      ]}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionRow}>
          {/* Camera */}
          <TouchableOpacity style={[styles.actionCardPrimary, styles.shadow]} onPress={handleCameraPress} activeOpacity={0.85}>
            <LinearGradient colors={['#3D5A80', '#1C2B3A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionCardGrad}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="camera" size={24} color="#FFF" />
              </View>
              <View style={styles.actionCardTextBlock}>
                <Text style={styles.actionCardTitle}>New Scan</Text>
                <Text style={styles.actionCardSub}>AI Species ID</Text>
              </View>
              <View style={styles.actionArrow}>
                <Feather name="arrow-right" size={16} color="rgba(255,255,255,0.6)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Upload */}
          <TouchableOpacity style={[styles.actionCardSecondary, styles.shadow]} onPress={handleUploadPress} activeOpacity={0.85}>
            <View style={styles.actionCardSecondaryInner}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#EBF0F7' }]}>
                <Ionicons name="images" size={24} color="#3D5A80" />
              </View>
              <View style={styles.actionCardTextBlock}>
                <Text style={[styles.actionCardTitle, { color: '#1C2B3A' }]}>Upload</Text>
                <Text style={[styles.actionCardSub, { color: '#8A9BB0' }]}>From Gallery</Text>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: '#EBF0F7' }]}>
                <Feather name="arrow-right" size={16} color="#3D5A80" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── RECENT SCANS ────────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        {recentScans.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View All</Text>
            <Feather name="chevron-right" size={14} color="#3D5A80" />
          </TouchableOpacity>
        )}
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
              onPress={() => { setSelectedScan(scan); setModalVisible(true); }}
              activeOpacity={0.9}
            >
              <Image source={{ uri: scan.image?.url }} style={styles.scanCardImg} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.scanCardGrad}>
                <View style={styles.scanCardTag}>
                  <View style={styles.scanCardTagDot} />
                  <Text style={styles.scanCardDate}>
                    {new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.scanCardTitle}>
                  {scan.morphometrics?.height_cm}cm · {scan.environment?.algae_label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
          <View style={{ width: 40 }} />
        </ScrollView>
      )}

      {/* ── DEMOGRAPHICS ────────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Demographics</Text>
        <View style={styles.compactTabRow}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setActiveTab(cat)} style={[styles.compactTab, activeTab === cat && styles.compactTabActive]}>
              <Text style={[styles.compactTabText, activeTab === cat && styles.compactTabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.statCard, styles.shadow]}>
        <View style={styles.statCardTopRow}>
          <View style={styles.statTotalChip}>
            <Text style={styles.statTotalChipValue}>{analyticsData.total}</Text>
            <Text style={styles.statTotalChipLabel}> samples</Text>
          </View>
        </View>
        <View style={styles.statList}>
          {analyticsData.items.map((item, index) => (
            <View key={index} style={styles.statRow}>
              <View style={styles.statRowLabel}>
                <View style={[styles.statRowIcon, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon} size={14} color={item.color} />
                </View>
                <Text style={styles.statRowTitle}>{item.label}</Text>
              </View>
              <View style={styles.statRowData}>
                <View style={styles.progressBarBg}>
                  <Animated.View style={[styles.progressBarFill, { width: item.pct, backgroundColor: item.color }]} />
                </View>
                <Text style={styles.statRowValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── TURBIDITY TREND ─────────────────────────────────────────────── */}
      <View style={styles.darkBleedSection}>
        <View style={styles.bleedHeader}>
          <View>
            <Text style={styles.bleedTitle}>Turbidity Trend</Text>
            <Text style={styles.bleedSub}>Historical water clarity (1–10)</Text>
          </View>
          <View style={styles.bleedIconBadge}>
            <MaterialCommunityIcons name="water-opacity" size={20} color="#8AB4F8" />
          </View>
        </View>

        <LineChart
          data={{ labels: turbidityTrend.labels, datasets: [{ data: turbidityTrend.data }] }}
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

      {/* ── ALGAE FREQUENCY ─────────────────────────────────────────────── */}
      <View style={styles.lightInsetPanel}>
        <View style={styles.cardHeaderWithNav}>
          <View>
            <Text style={styles.sectionTitle}>Algae Frequency</Text>
            <Text style={styles.cardSubTitle}>Detection counts by severity</Text>
          </View>
          <View style={styles.algaeBadge}>
            <MaterialCommunityIcons name="sprout" size={18} color="#2A9D8F" />
          </View>
        </View>
        <BarChart
          data={{ labels: algaeBarData.labels, datasets: [{ data: algaeBarData.data }] }}
          width={width - 80}
          height={180}
          yAxisSuffix=""
          fromZero={true}
          showValuesOnTopOfBars={true}
          chartConfig={flatBarConfig}
          style={{ marginTop: 10, alignSelf: 'center' }}
        />
      </View>

      {/* ── ECONOMICS ───────────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Economics</Text>
        <View style={styles.liveChip}>
          <View style={styles.liveDotGreen} />
          <Text style={styles.liveChipText}>LIVE</Text>
        </View>
      </View>

      <View style={[styles.marketCard, styles.shadow]}>
        <View style={styles.cardHeaderWithNav}>
          <View>
            <Text style={styles.sectionTitle}>Market Value Trend</Text>
            <Text style={styles.cardSubTitle}>Real-time community average</Text>
          </View>
          <View style={styles.trendUpBadge}>
            <Feather name="trending-up" size={15} color="#0FA958" />
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
              <View style={{ alignItems: 'center' }}>
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
            <Text style={styles.emptySub}>When users post items for sale, average prices will appear here.</Text>
          </View>
        )}
      </View>

    </View>
  );

  // ==========================================
  // MAIN RETURN
  // ==========================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C2B3A" />

      {notification.visible && (
        <Animated.View style={[
          styles.toastContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
          }
        ]}>
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
          <ActivityIndicator size="small" color="#3D5A80" style={{ marginTop: 50 }} />
        ) : (
          currentUser ? renderUserDashboard() : renderGuestGuide()
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <ScanDetailsModal visible={modalVisible} onClose={() => setModalVisible(false)} scan={selectedScan} />
      <BottomNavBar navigation={navigation} activeTab="Home" alertsCount={alertsCount} user={currentUser} />
      <FloatingChatbot user={currentUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  scrollContent: { paddingTop: 10 },
  shadow: {
    shadowColor: '#1C2B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toastContainer: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 99, alignItems: 'center' },
  toastBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  toastWarning: { backgroundColor: '#E76F51' },
  toastInfo: { backgroundColor: '#2A9D8F' },
  toastText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 10 },

  // ── Dashboard Container ───────────────────────────────────────────────────
  dashboardContainer: { gap: 18, paddingHorizontal: 20 },

  // ── Hero Banner ───────────────────────────────────────────────────────────
  heroBanner: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
  },
  heroBannerGradient: {
    padding: 24,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(138, 180, 248, 0.07)',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(42, 157, 143, 0.06)',
    bottom: -30,
    left: 20,
  },
  heroBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroBannerLeft: { flex: 1 },
  greetingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    gap: 5,
  },
  greetingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  greetingPillText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  heroBannerName: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  heroBannerDate: { fontSize: 12, color: 'rgba(200, 220, 240, 0.75)', fontWeight: '500' },
  heroBannerAvatar: { position: 'relative' },
  heroBannerAvatarImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  heroBannerAvatarPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroBannerAvatarLetter: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  avatarOnline: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4ADE80',
    borderWidth: 2, borderColor: '#2E4560',
  },
  heroBannerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 14,
  },
  heroBannerStatItem: { flex: 1, alignItems: 'center' },
  heroBannerStatValue: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  heroBannerStatLabel: { fontSize: 10, color: 'rgba(200, 220, 240, 0.7)', fontWeight: '600', marginTop: 2 },
  heroBannerStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 2 },

  // ── Quick Actions ──────────────────────────────────────────────────────────
  actionSection: { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#8A9BB0', letterSpacing: 1.2, marginBottom: 2 },
  actionRow: { flexDirection: 'row', gap: 14, height: 96 },
  actionCardPrimary: { flex: 1, borderRadius: 22, overflow: 'hidden' },
  actionCardGrad: { flex: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionCardSecondary: { flex: 1, borderRadius: 22, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  actionCardSecondaryInner: { flex: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E8EDF4', borderRadius: 22 },
  actionIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  actionCardTextBlock: { flex: 1 },
  actionCardTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  actionCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  actionArrow: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  // ── Section Header ────────────────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1C2B3A' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12, color: '#3D5A80', fontWeight: '700' },

  // ── Scan Carousel ─────────────────────────────────────────────────────────
  carouselContainer: { marginHorizontal: -20, paddingHorizontal: 20, overflow: 'visible' },
  scanCard: { width: 148, height: 168, borderRadius: 22, overflow: 'hidden', marginRight: 14, backgroundColor: '#FFF' },
  scanCardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  scanCardGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', justifyContent: 'flex-end', padding: 12 },
  scanCardTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  scanCardTagDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4ADE80' },
  scanCardDate: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '600' },
  scanCardTitle: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  // ── Demographics Card ─────────────────────────────────────────────────────
  compactTabRow: { flexDirection: 'row', backgroundColor: '#EBF0F7', borderRadius: 12, padding: 3 },
  compactTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  compactTabActive: { backgroundColor: '#FFFFFF', shadowColor: '#1C2B3A', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  compactTabText: { fontSize: 10, fontWeight: '600', color: '#8A9BB0' },
  compactTabTextActive: { color: '#3D5A80', fontWeight: '800' },
  statCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E8EDF4' },
  statCardTopRow: { marginBottom: 16 },
  statTotalChip: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#EBF0F7', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statTotalChipValue: { fontSize: 18, fontWeight: '900', color: '#1C2B3A' },
  statTotalChipLabel: { fontSize: 12, color: '#5A7090', fontWeight: '600' },
  statList: { gap: 14 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statRowLabel: { flexDirection: 'row', alignItems: 'center', width: '45%' },
  statRowIcon: { width: 26, height: 26, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statRowTitle: { fontSize: 12, fontWeight: '600', color: '#4A5A6A' },
  statRowData: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#EBF0F7', borderRadius: 4 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statRowValue: { width: 28, fontSize: 12, fontWeight: '800', color: '#1C2B3A', textAlign: 'right' },

  // ── Turbidity Dark Bleed ──────────────────────────────────────────────────
  darkBleedSection: {
    backgroundColor: '#1C2B3A',
    marginHorizontal: -20,
    paddingVertical: 24,
    marginTop: 8,
  },
  bleedHeader: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bleedTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  bleedSub: { fontSize: 12, color: '#8AB4F8', fontWeight: '500', marginTop: 2 },
  bleedIconBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(138,180,248,0.12)', justifyContent: 'center', alignItems: 'center' },

  // ── Algae Panel ───────────────────────────────────────────────────────────
  lightInsetPanel: { backgroundColor: '#F0F4F8', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E9F2' },
  cardHeaderWithNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardSubTitle: { fontSize: 11, color: '#8A9BB0', fontWeight: '600', marginTop: 2 },
  algaeBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D5F2EE', justifyContent: 'center', alignItems: 'center' },

  // ── Market Card ───────────────────────────────────────────────────────────
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F7EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0FA958' },
  liveChipText: { fontSize: 9, fontWeight: '800', color: '#0FA958', letterSpacing: 1 },
  marketCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8EDF4',
  },
  trendUpBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F7EE', justifyContent: 'center', alignItems: 'center' },
  monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F0F4F8' },
  navBtn: { padding: 10, backgroundColor: '#EBF0F7', borderRadius: 14 },
  monthNavLabel: { fontSize: 10, color: '#8A9BB0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  monthNavValue: { fontSize: 20, color: '#1C2B3A', fontWeight: '900', marginTop: 2 },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyStateContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EBF0F7', marginBottom: 10 },
  emptyIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C2B3A', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#8A9BB0', textAlign: 'center' },

  // ── Guest Mode ────────────────────────────────────────────────────────────
  guestContainer: { paddingBottom: 20 },
  heroSlideshow: { width, height: 300, overflow: 'hidden', marginBottom: 0, backgroundColor: '#1A2332' },
  heroSlideshowImage: { width: '100%', height: '100%' },
  heroBadgeRow: { position: 'absolute', top: 18, left: 20, right: 20, flexDirection: 'row' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  heroBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 20 },
  heroSlideTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginBottom: 4, letterSpacing: -0.3 },
  heroSlideSub: { color: 'rgba(224, 251, 252, 0.85)', fontSize: 13, fontWeight: '500', marginBottom: 14 },
  dotRow: { flexDirection: 'row', gap: 6 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 20, backgroundColor: '#FFFFFF' },
  dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.4)' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  featureCard: { width: (width - 52) / 2, backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EAECEE', shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  featureIconWrap: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureLabel: { fontSize: 14, fontWeight: '800', color: '#2C3E50', marginBottom: 2 },
  featureDesc: { fontSize: 11, color: '#95A5A6', fontWeight: '500' },
  botShowcase: { backgroundColor: '#F8F9FA', borderRadius: 24, padding: 20, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#EAECEE' },
  botHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  botAvatarContainer: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E0FBFC', justifyContent: 'center', alignItems: 'center' },
  botName: { fontSize: 15, fontWeight: '800', color: '#2C3E50' },
  botStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#27AE60' },
  botStatus: { fontSize: 11, color: '#27AE60', fontWeight: '600' },
  botBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  botBadgeText: { fontSize: 10, fontWeight: '800', color: '#0284C7' },
  mockChatContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E0E7ED', gap: 10 },
  mockUserBubble: { alignSelf: 'flex-end', backgroundColor: '#3D5A80', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, borderBottomRightRadius: 4 },
  mockUserText: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  mockBotBubble: { alignSelf: 'flex-start', backgroundColor: '#F4F6F7', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, borderBottomLeftRadius: 4, maxWidth: '92%' },
  mockBotText: { color: '#2C3E50', fontSize: 13, lineHeight: 19 },
  tryBotBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3D5A80', paddingVertical: 13, borderRadius: 16, gap: 8 },
  tryBotText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  ctaStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, padding: 20, borderRadius: 24, marginBottom: 8 },
  ctaLeft: { flex: 1 },
  ctaHeading: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  ctaSub: { fontSize: 11, color: 'rgba(224,251,252,0.75)', fontWeight: '500', marginTop: 2 },
  ctaBtn: { backgroundColor: '#E0FBFC', paddingVertical: 11, paddingHorizontal: 18, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 12 },
  ctaBtnText: { color: '#3D5A80', fontWeight: '800', fontSize: 13 },
});