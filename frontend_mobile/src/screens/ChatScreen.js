import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  TextInput, Platform, KeyboardAvoidingView, FlatList, StatusBar, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';
import client from '../api/client';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

const NAV_BAR_HEIGHT = 90; // The height of your floating bottom nav

export default function ChatScreen({ navigation, route }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); 
  const [activeChatUser, setActiveChatUser] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [sendingImage, setSendingImage] = useState(false);
  const [stagedImage, setStagedImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [contacts, setContacts] = useState([]); 
  const [requests, setRequests] = useState([]); 
  const [pending, setPending] = useState([]);   

  const flatListRef = useRef(null);

  // --- AUTH CHECK ---
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          if (mounted) { setCurrentUser(null); setLoadingContacts(false); }
          return; 
        }
        const res = await client.get('/auth/profile');
        if (mounted) setCurrentUser(res.data.user || null);
      } catch (error) {
        if (mounted) setCurrentUser(null);
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, []);

  // --- REFRESH DATA HANDLER ---
  const fetchListData = async () => {
    if (!currentUser) return;
    try {
      const [usersRes, chatsRes] = await Promise.all([
        client.get('/chat/users'),
        client.get('/chat/chats'),
      ]);
      const currentUserId = currentUser._id || currentUser.id;
      const rawUsers = (usersRes.data?.users || []);
      const chats = (chatsRes.data?.chats || []);

      const lastByPartner = {};
      chats.forEach(c => {
        const partner = c.participants.find(p => p._id !== currentUserId);
        if (partner) {
          lastByPartner[partner._id] = {
            chatId: c._id,
            status: c.status,
            initiator: c.initiator,
            text: c.lastMessage || (c.messages.length > 0 ? "Sent a file" : "No messages"),
            time: c.lastMessageTime
          };
        }
      });

      const merged = rawUsers.map(u => ({
        uid: u._id,
        name: u.name,
        profilePic: u.profilePic,
        chatId: lastByPartner[u._id]?.chatId,
        status: lastByPartner[u._id]?.status,
        initiator: lastByPartner[u._id]?.initiator,
        lastMessage: lastByPartner[u._id]?.text,
        isMutual: u.isMutualFollow
      }));

      setContacts(merged.filter(u => u.status === 'accepted' || u.isMutual));
      setRequests(merged.filter(u => u.status === 'pending' && u.initiator !== currentUserId));
      setPending(merged.filter(u => u.status === 'pending' && u.initiator === currentUserId));
    } catch (error) { console.log("Fetch List Error:", error); } 
    finally { setLoadingContacts(false); }
  };

  useEffect(() => { fetchListData(); }, [currentUser, activeTab]);

  // --- LOAD MESSAGES ---
  useEffect(() => {
    if (!activeChatUser) return;
    const loadMessages = async () => {
      try {
        const res = await client.get(`/chat/messages/${activeChatUser.uid}`);
        const currentId = currentUser._id || currentUser.id;
        const fetched = (res.data?.messages || []).map(m => ({
          id: m._id,
          text: m.text || '',
          sender: (m.sender?._id || m.sender) === currentId ? 'me' : 'other',
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: m.image ? 'image' : 'text',
          image: m.image || null,
        }));
        setMessages(fetched);
      } catch (err) { console.log("Load Msg Error:", err); }
    };
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [activeChatUser]);

  const handleSendMessage = async () => {
    if (!message.trim() && !stagedImage) return;
    const currentMsg = message;
    setMessage(''); 
    setSendingImage(true);
    let imageUrl = null;
    if (stagedImage) {
        const data = new FormData();
        data.append('file', { uri: stagedImage, type: 'image/jpeg', name: 'chat.jpg' });
        data.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        const res = await fetch(CLOUDINARY_CONFIG.apiUrl, { method: 'POST', body: data });
        const result = await res.json();
        imageUrl = result.secure_url;
    }
    try {
      await client.post('/chat/send', { receiverId: activeChatUser.uid, text: currentMsg, image: imageUrl });
      setStagedImage(null);
    } catch (error) { console.log(error); } 
    finally { setSendingImage(false); }
  };

  const renderMessage = ({ item }) => (
    <View style={item.sender === 'me' ? styles.myMsgWrapper : styles.otherMsgWrapper}>
      <View style={[item.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
        {item.type === 'image' && <Image source={{ uri: item.image }} style={styles.sentImage} />}
        {item.text !== '' && <Text style={item.sender === 'me' ? styles.myText : styles.otherText}>{item.text}</Text>}
      </View>
      <Text style={styles.timeLabel}>{item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} navigation={navigation} user={currentUser} />
      <Header title="CRAYCHAT" context="Chat" onProfilePress={() => setSidebarVisible(true)} />

      {!currentUser ? (
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed" size={60} color="#3D5A80" />
          <Text style={styles.largeTitle}>Login Required</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Login')}><Text style={styles.actionBtnText}>Log In</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContent}>
          {/* TAB BAR */}
          <View style={styles.tabContainer}>
            {['chats', 'requests', 'pending'].map(tab => (
              <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.activeTabButton]} onPress={() => { setActiveTab(tab); setActiveChatUser(null); }}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab.toUpperCase()}</Text>
                {tab === 'requests' && requests.length > 0 && <View style={styles.tabBadge} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* CONTACTS LIST */}
          <View style={[styles.contactsBar, activeTab !== 'chats' && { backgroundColor: '#2C3E50' }]}>
            <FlatList
              data={activeTab === 'requests' ? requests : activeTab === 'pending' ? pending : contacts}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.contactItem} onPress={() => setActiveChatUser(item)}>
                  <View style={[styles.avatarPlaceholder, activeChatUser?.uid === item.uid && { borderColor: '#98C1D9', borderWidth: 2 }]}>
                    <Image source={item.profilePic ? { uri: item.profilePic } : require('../../assets/profile-icon.png')} style={styles.contactImage} />
                  </View>
                  <Text style={styles.contactName} numberOfLines={1}>{item.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              )}
              horizontal showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* CHAT LAYER */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.chatEngine} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <View style={styles.chatLayer}>
              {!activeChatUser ? (
                <View style={styles.centerContainer}>
                  <Ionicons name="chatbubbles-outline" size={80} color="#E0E7ED" />
                  <Text style={styles.subText}>Start a conversation</Text>
                </View>
              ) : (
                <>
                  <View style={styles.chatPartnerHeader}>
                    <Text style={styles.partnerName}>{activeChatUser.name}</Text>
                    {activeTab !== 'chats' && <View style={styles.requestBadge}><Text style={styles.requestBadgeText}>{activeTab.toUpperCase()}</Text></View>}
                  </View>

                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                  />

                  {/* ACTION AREA (Above Nav Bar) */}
                  <View style={styles.actionContainer}>
                    {activeTab === 'requests' ? (
                      <View style={styles.acceptBanner}>
                        <Text style={styles.acceptTitle}>Message Request</Text>
                        <Text style={styles.acceptSubText}>Accept to reply to {activeChatUser.name}.</Text>
                        <View style={styles.acceptActionRow}>
                          <TouchableOpacity style={styles.ignoreBtn} onPress={() => setActiveChatUser(null)}>
                            <Text style={styles.ignoreText}>Ignore</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.acceptBtn} onPress={async () => {
                              const res = await client.post('/chat/accept', { chatId: activeChatUser.chatId });
                              if (res.data.success) { setActiveTab('chats'); fetchListData(); }
                          }}>
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.inputArea}>
                        <TouchableOpacity onPress={async () => {
                            let res = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
                            if (!res.canceled) setStagedImage(res.assets[0].uri);
                        }}><Ionicons name="image" size={26} color="#3D5A80" /></TouchableOpacity>
                        <TextInput style={styles.textInput} placeholder="Type a message..." value={message} onChangeText={setMessage} multiline />
                        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                          <Ionicons name="send" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                    {/* CRITICAL: Space for the Bottom Navigation Bar */}
                    <View style={styles.navBarSpacer} />
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
      <BottomNavBar navigation={navigation} activeTab="Chat" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  mainContent: { flex: 1 },
  
  // Tab Bar
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#ECF0F1' },
  tabButton: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 20 },
  activeTabButton: { backgroundColor: '#EBF5FB' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#95A5A6' },
  activeTabText: { color: '#3D5A80' },
  tabBadge: { position: 'absolute', top: -2, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E74C3C' },
  
  // Horizontal Contacts
  contactsBar: { backgroundColor: '#3D5A80', paddingVertical: 15, paddingLeft: 15, borderBottomRightRadius: 20, borderBottomLeftRadius: 20 },
  contactItem: { alignItems: 'center', marginRight: 15, width: 60 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', overflow: 'hidden' },
  contactImage: { width: '100%', height: '100%' },
  contactName: { fontSize: 10, color: '#FFF', marginTop: 5, fontWeight: '600' },
  
  // Chat Engine
  chatEngine: { flex: 1 },
  chatLayer: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, marginTop: -10, overflow: 'hidden' },
  chatPartnerHeader: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F3F4', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  partnerName: { fontSize: 16, fontWeight: '800', color: '#2C3E50' },
  messagesList: { padding: 15, paddingBottom: 20 },
  
  // Bubbles
  myMsgWrapper: { alignSelf: 'flex-end', marginBottom: 15, alignItems: 'flex-end', maxWidth: '80%' },
  otherMsgWrapper: { alignSelf: 'flex-start', marginBottom: 15, maxWidth: '80%' },
  myBubble: { backgroundColor: '#3D5A80', padding: 12, borderRadius: 15, borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: '#F4F6F7', padding: 12, borderRadius: 15, borderBottomLeftRadius: 2 },
  myText: { color: '#FFF', fontSize: 14 },
  otherText: { color: '#2C3E50', fontSize: 14 },
  sentImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5 },
  timeLabel: { fontSize: 9, color: '#BDC3C7', marginTop: 4 },

  // --- THE NEW ACTION AREA ---
  actionContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F3F4',
    // iOS shadow to give separation from Nav Bar
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  
  // Banner Styling
  acceptBanner: { padding: 20, alignItems: 'center' },
  acceptTitle: { fontWeight: '800', fontSize: 17, color: '#2C3E50' },
  acceptSubText: { fontSize: 12, color: '#7F8C8D', marginVertical: 8, textAlign: 'center' },
  acceptActionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  ignoreBtn: { flex: 1, paddingVertical: 14, borderRadius: 15, backgroundColor: '#F0F3F4', alignItems: 'center' },
  acceptBtn: { flex: 1, paddingVertical: 14, borderRadius: 15, backgroundColor: '#3D5A80', alignItems: 'center' },
  ignoreText: { color: '#7F8C8D', fontWeight: '700' },
  acceptBtnText: { color: '#FFF', fontWeight: '700' },

  // Input Area
  inputArea: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  textInput: { flex: 1, marginHorizontal: 12, backgroundColor: '#F8F9F9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, color: '#2C3E50' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3D5A80', justifyContent: 'center', alignItems: 'center' },

  // --- THE NAV BAR SPACER ---
  navBarSpacer: { height: 95 }, // Exact height to clear your floating menu

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  largeTitle: { fontSize: 22, fontWeight: '800', color: '#293241' },
  actionBtn: { backgroundColor: '#3D5A80', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 20 },
  actionBtnText: { color: '#FFF', fontWeight: '700' },
  requestBadge: { backgroundColor: '#E74C3C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  requestBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' }
});