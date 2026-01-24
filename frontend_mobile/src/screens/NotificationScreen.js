import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Platform, FlatList, StatusBar 
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Custom Modular Components
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';

export default function NotificationScreen({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Mock Notification Data
  const notifications = [
    { 
      id: '1', 
      user: 'Juan', 
      action: 'Liked your post.', 
      time: '01/19/26', 
      type: 'like', 
      section: 'New',
      avatar: 'https://avatar.iran.liara.run/public/12'
    },
    { 
      id: '2', 
      user: 'Maria', 
      action: 'Liked your post.', 
      time: '01/18/26', 
      type: 'like', 
      section: 'New',
      avatar: 'https://avatar.iran.liara.run/public/70'
    },
    { 
      id: '3', 
      user: 'Dr. Lee', 
      action: 'Direct Messaged You!', 
      time: '01/14/26', 
      type: 'message', 
      section: 'Previous',
      avatar: 'https://avatar.iran.liara.run/public/33'
    },
  ];

  const renderNotification = (item) => (
    <View key={item.id} style={[styles.notiCard, styles.shadow]}>
      <Image source={{ uri: item.avatar }} style={styles.notiAvatar} />
      
      <View style={styles.notiContent}>
        <Text style={styles.userName}>{item.user}</Text>
        <Text style={styles.actionText}>{item.action}</Text>
      </View>

      <View style={styles.metaContainer}>
        <Text style={styles.dateText}>{item.time}</Text>
        {item.type === 'like' ? (
          <Ionicons name="heart-outline" size={18} color="#E76F51" />
        ) : (
          <Ionicons name="paper-plane-outline" size={18} color="#3D5A80" />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      <Header title="ACTIVITY" onProfilePress={() => setSidebarVisible(true)} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* NEW SECTION */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}>
             <Text style={styles.badgeText}>New</Text>
          </View>
        </View>
        {notifications.filter(n => n.section === 'New').map(renderNotification)}

        {/* PREVIOUS SECTION */}
        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <View style={[styles.sectionBadge, { backgroundColor: '#98C1D9' }]}>
             <Text style={styles.badgeText}>Previous</Text>
          </View>
        </View>
        {notifications.filter(n => n.section === 'Previous').map(renderNotification)}
      </ScrollView>

      <BottomNavBar navigation={navigation} activeTab="Alerts" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },

  // Section Headers (Tags)
  sectionHeader: { marginBottom: 15, alignItems: 'flex-start' },
  sectionBadge: { 
    backgroundColor: '#3D5A80', 
    paddingHorizontal: 15, 
    paddingVertical: 5, 
    borderRadius: 20,
    elevation: 3
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

  // Notification Cards
  notiCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1'
  },
  notiAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  notiContent: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '800', color: '#293241', marginBottom: 2 },
  actionText: { fontSize: 13, color: '#7F8C8D', fontWeight: '500' },

  // Right Side Date/Icon
  metaContainer: { alignItems: 'flex-end', justifyContent: 'space-between', height: 40 },
  dateText: { fontSize: 10, color: '#BDC3C7', fontWeight: '700', marginBottom: 5 },

  shadow: {
    ...Platform.select({
      ios: { shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  }
});