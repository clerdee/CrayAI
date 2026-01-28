import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ADDED: activeTab prop to know which icon to highlight
export default function BottomNavBar({ navigation, activeTab, alertsCount = 0 }) {
  
  // Helper function to set colors based on the active tab
  const getIconColor = (tabName) => activeTab === tabName ? '#2C5364' : '#999';
  const getTextColor = (tabName) => activeTab === tabName ? '#2C5364' : '#999';

  return (
    <View style={[styles.bottomNav, styles.shadow]}>
      
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
      
      {/* 3. Scan (The Floating Action Button) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, styles.shadow]} onPress={() => navigation.navigate('Camera')}>
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

      {/* 5. Notification */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Notification')}>
        <View style={{ alignItems: 'center' }}>
          <Feather name="bell" size={24} color={getIconColor('Notification')} />
          {alertsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{alertsCount > 99 ? '99+' : alertsCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.navText, { color: getTextColor('Notification') }]}>Alerts</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#FFF', flexDirection: 'row', borderRadius: 25, height: 70, justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  fabContainer: { position: 'relative', top: -30, flex: 1, alignItems: 'center' },
  fab: { width: 65, height: 65, borderRadius: 33, backgroundColor: '#FFF', padding: 5 },
  fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  shadow: { ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 5 } }) },
  badge: { position: 'absolute', top: -8, right: -12, backgroundColor: '#E74C3C', borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' }
});