import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Platform, StatusBar } from 'react-native';
import { Ionicons, FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Custom Modular Components
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';

export default function CommunityScreen({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Simulated Community Data
  const communityPosts = [
    {
      id: 1,
      user: "Farmer Juan",
      avatar: "https://avatar.iran.liara.run/public/12",
      time: "2h ago",
      content: "Just finished a batch scan in Taguig Pond A. Higher ratio of berried females this week! 🦞",
      image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400",
      likes: 24,
      comments: 5
    },
    {
      id: 2,
      user: "Researcher Maria",
      avatar: "https://avatar.iran.liara.run/public/70",
      time: "5h ago",
      content: "Testing water turbidity levels. High algae detection today. How are your ponds looking?",
      image: null,
      likes: 12,
      comments: 8
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3D5A80" />

      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
      />

      <Header 
        title="COMMUNITY" 
        onProfilePress={() => setSidebarVisible(true)} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- EXPANDED POST CREATION BOX --- */}
        <View style={[styles.createPost, styles.shadow]}>
          
          {/* Top Row: Avatar and Text Input */}
          <View style={styles.inputRow}>
            <Image 
              source={require('../../assets/profile-icon.png')} 
              style={styles.smallAvatar} 
            />
            <TextInput 
              style={styles.postInput}
              placeholder="Share your research findings..."
              placeholderTextColor="#BDC3C7"
              multiline={true}
            />
          </View>

          {/* Bottom Row: Actions Pushed to the Right */}
          <View style={styles.bottomActionsRow}>
            <View style={styles.createPostActions}>
              <TouchableOpacity style={styles.iconActionBtn}>
                <Ionicons name="image-outline" size={22} color="#3D5A80" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconActionBtn}>
                <Ionicons name="camera-outline" size={22} color="#3D5A80" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconActionBtn}>
                <Ionicons name="attach" size={24} color="#3D5A80" />
              </TouchableOpacity>
            </View>
            
            {/* Post Button */}
            <TouchableOpacity style={styles.postBtn}>
              <Text style={styles.postBtnText}>Post</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Community Feed */}
        {communityPosts.map((post) => (
          <View key={post.id} style={[styles.postCard, styles.shadow]}>
            <View style={styles.postHeader}>
              <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
              <View style={styles.postUserMeta}>
                <Text style={styles.postUsername}>{post.user}</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.postTimeRight}>{post.time}</Text>
              </View>
            </View>

            <Text style={styles.postContentText}>{post.content}</Text>
            
            {post.image && (
              <Image source={{ uri: post.image }} style={styles.postImage} />
            )}

            {/* Feed Actions (Left Aligned) */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="heart-outline" size={22} color="#546E7A" />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={20} color="#546E7A" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="mail-outline" size={22} color="#546E7A" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar navigation={navigation} activeTab="Community" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 15 },
  
  // --- UPDATED CREATE POST CONTAINER ---
  createPost: { 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 20 
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15
  },
  smallAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
  postInput: { 
    flex: 1, 
    fontSize: 15, 
    color: '#2C3E50',
    minHeight: 40,
    paddingTop: 10
  },
  
  // Moves the actions to the right side of the container
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // <--- This pushes everything to the far right
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F3F4',
    paddingTop: 12
  },
  createPostActions: {
    flexDirection: 'row',
    gap: 15,
    marginRight: 20 // Spacing between the icons and the POST button
  },
  iconActionBtn: { padding: 5 },
  
  // Added a POST button to complete the look
  postBtn: {
    backgroundColor: '#3D5A80',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15
  },
  postBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  // --- EXISTING POST CARD STYLES ---
  postCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 20 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  postAvatar: { width: 45, height: 45, borderRadius: 22.5 },
  postUserMeta: { flex: 1, marginLeft: 12 },
  postUsername: { fontSize: 15, fontWeight: '700', color: '#2C3E50' },
  headerRight: { justifyContent: 'center' },
  postTimeRight: { fontSize: 11, color: '#BDC3C7', fontWeight: '500' },
  postContentText: { fontSize: 14, color: '#546E7A', lineHeight: 22, marginBottom: 15 },
  postImage: { width: '100%', height: 200, borderRadius: 15, marginBottom: 15 },
  
  actionRow: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#F4F7F9', 
    paddingTop: 12, 
    justifyContent: 'flex-start',
    gap: 25 
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, color: '#546E7A', fontWeight: '600' },

  shadow: {
    ...Platform.select({
      ios: { shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  }
});