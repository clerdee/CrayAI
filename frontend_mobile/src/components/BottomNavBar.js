import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Image, 
  Animated 
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function BottomNavBar({ navigation, activeTab, alertsCount = 0 }) {
  
  const [showToast, setShowToast] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current; 

  // --- 1. ROBUST LOGIN CHECK (No Props Needed) ---
  // We check AsyncStorage directly on press to guarantee accuracy
  const handleScanPress = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        navigation.navigate('Camera');
      } else {
        triggerToast();
      }
    } catch (error) {
      triggerToast();
    }
  };

  const getIconColor = (tabName) => activeTab === tabName ? '#2C5364' : '#999';
  const getTextColor = (tabName) => activeTab === tabName ? '#2C5364' : '#999';

  const triggerToast = () => {
    if (showToast) return; 
    
    setShowToast(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 5, useNativeDriver: true })
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 300, useNativeDriver: true })
      ]).start(() => setShowToast(false));
    }, 2500);
  };

  return (
    <View style={[styles.bottomNav, styles.shadow]}>
      
      {/* --- GUEST ALERT PILL --- */}
      <Animated.View style={[
        styles.toastContainer, 
        { 
          opacity: fadeAnim,
          transform: [{ translateY: translateY }]
        }
      ]}>
        <View style={styles.toastContent}>
          <Ionicons name="lock-closed" size={16} color="#FFF" />
          <Text style={styles.toastText}>Please login to use Scanner</Text>
        </View>
        <View style={styles.toastArrow} />
      </Animated.View>

      {/* 1. Home */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
        <Feather name="home" size={24} color={getIconColor('Home')} />
        <Text style={[styles.navText, { color: getTextColor('Home') }]}>Home</Text>
      </TouchableOpacity>

      {/* 2. Community */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Community')}>
        <Feather name="users" size={24} color={getIconColor('Community')} />
        <Text style={[styles.navText, { color: getTextColor('Community') }]}>Community</Text>
      </TouchableOpacity>
      
      {/* 3. Scan (Direct Async Check) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, styles.shadow]} onPress={handleScanPress} activeOpacity={0.9}>
          <LinearGradient colors={['#FF6347', '#ff2727']} style={styles.fabGradient}>
            <Image 
              source={require('../../assets/crayfish.png')} 
              style={{ width: 32, height: 32, tintColor: '#FFF' }} 
              resizeMode="contain"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 4. Chat */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Chat')}>
        <Feather name="message-square" size={24} color={getIconColor('Chat')} />
        <Text style={[styles.navText, { color: getTextColor('Chat') }]}>Chat</Text>
      </TouchableOpacity>

      {/* 5. Notification / Alerts */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Notification')}>
        <View style={{ alignItems: 'center' }}>
          <Feather 
            name="bell" 
            size={24} 
            color={getIconColor('Alerts')} 
          />
          {alertsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{alertsCount > 99 ? '99+' : alertsCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.navText, { color: getTextColor('Alerts') }]}>Alerts</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#FFF', flexDirection: 'row', borderRadius: 25, height: 70, justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 10, zIndex: 100 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  
  fabContainer: { position: 'relative', top: -30, flex: 1, alignItems: 'center', zIndex: 101 },
  fab: { width: 65, height: 65, borderRadius: 33, backgroundColor: '#FFF', padding: 5 },
  fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  
  shadow: { ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 5 } }) },
  
  badge: { position: 'absolute', top: -8, right: -12, backgroundColor: '#E74C3C', borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  toastContainer: {
    position: 'absolute',
    top: -65, 
    alignSelf: 'center', 
    alignItems: 'center',
    zIndex: 200, 
    pointerEvents: 'none', 
  },
  toastContent: {
    backgroundColor: '#2C3E50',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  toastText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  toastArrow: {
    width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#2C3E50', 
    marginTop: -1, 
  }
});