import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client'; 

const BottomNavBar = ({ activeTab }) => {
  const navigation = useNavigation();
  const [alertsCount, setAlertsCount] = useState(0);
  const [chatCount, setChatCount] = useState(0); 

  // --- FETCH BADGE COUNTS ---
  useFocusEffect(
    useCallback(() => {
      const fetchCounts = async () => {
        try {
          // 1. SAFETY CHECK: Ensure Token Exists
          const token = await AsyncStorage.getItem('userToken');
          if (!token) {
            setAlertsCount(0);
            return; 
          }

          // 2. Get Cached Alerts Count
          const cachedAlerts = await AsyncStorage.getItem('alertsCount');
          if (cachedAlerts) setAlertsCount(parseInt(cachedAlerts, 10));

          // 3. Fetch Fresh Count from Server
          const res = await client.get('/notification');
          if (res.data?.notifications) {
            const unread = res.data.notifications.filter(n => !n.isRead).length;
            setAlertsCount(unread);
            await AsyncStorage.setItem('alertsCount', String(unread));
          }

        } catch (error) {
          if (error.response && error.response.status === 401) {
             console.log("Badge fetch skipped: User not authenticated.");
          } else {
             console.log("Badge fetch error:", error.message);
          }
        }
      };

      fetchCounts();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        
        {/* 1. HOME */}
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Home')}>
          <Ionicons 
            name={activeTab === 'Home' ? "home" : "home-outline"} 
            size={24} 
            color={activeTab === 'Home' ? "#3D5A80" : "#95A5A6"} 
          />
          <Text style={[styles.label, activeTab === 'Home' && styles.activeLabel]}>Home</Text>
        </TouchableOpacity>

        {/* 2. COMMUNITY */}
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Community')}>
          <Ionicons 
            name={activeTab === 'Community' ? "people" : "people-outline"} 
            size={26} 
            color={activeTab === 'Community' ? "#3D5A80" : "#95A5A6"} 
          />
          <Text style={[styles.label, activeTab === 'Community' && styles.activeLabel]}>Community</Text>
        </TouchableOpacity>

        {/* 3. SCAN (Center with Crayfish Logo) */}
        <View style={styles.scanWrapper}>
          <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Camera')}>
            <Image 
              source={require('../../assets/crayfish.png')} 
              style={styles.scanIcon} 
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* 4. CHAT */}
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Chat')}>
          <View>
            <Ionicons 
              name={activeTab === 'Chat' ? "chatbubbles" : "chatbubbles-outline"} 
              size={24} 
              color={activeTab === 'Chat' ? "#3D5A80" : "#95A5A6"} 
            />
            {chatCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{chatCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.label, activeTab === 'Chat' && styles.activeLabel]}>Chat</Text>
        </TouchableOpacity>

        {/* 5. ALERTS */}
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Notification')}>
          <View>
            <Ionicons 
              name={activeTab === 'Alerts' ? "notifications" : "notifications-outline"} 
              size={24} 
              color={activeTab === 'Alerts' ? "#3D5A80" : "#95A5A6"} 
            />
            {alertsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {alertsCount > 99 ? '99+' : alertsCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.label, activeTab === 'Alerts' && styles.activeLabel]}>Alerts</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F3F4',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scanWrapper: {
    marginTop: -40, 
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E76F51', 
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E76F51',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#F4F7F9', 
  },
  // NEW STYLE FOR THE LOGO
  scanIcon: {
    width: 32,
    height: 32,
    tintColor: '#FFF',
  },
  label: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 4,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#3D5A80',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default BottomNavBar;