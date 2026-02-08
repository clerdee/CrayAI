import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  TextInput, Platform, KeyboardAvoidingView, FlatList, StatusBar, ActivityIndicator, Animated
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';
import client from '../api/client';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

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

  const [myChats, setMyChats] = useState([]); 
  const [requests, setRequests] = useState([]); 

  const flatListRef = useRef(null);

  // --- TOAST STATE ---
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', body: '', type: 'info' });
  const toastAnim = useRef(new Animated.Value(-100)).current; 

  const showToast = (title, body, type = 'info') => {
    setToastMessage({ title, body, type });
    setToastVisible(true);
    Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }).start(() => setToastVisible(false));
    }, 3000);
  };

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

  // --- REFRESH DATA ---
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

      const incoming = merged.filter(u => u.status === 'pending' && u.initiator !== currentUserId);
      const active = merged.filter(u => 
        u.status === 'accepted' || 
        u.isMutual || 
        (u.status === 'pending' && u.initiator === currentUserId)
      );

      setRequests(incoming);
      setMyChats(active);

    } catch (error) { showToast("Error", "Could not load chats.", "error"); } 
    finally { setLoadingContacts(false); }
  };

  useEffect(() => { fetchListData(); }, [currentUser, activeTab]);

  // --- 1. HANDLE NAVIGATION FROM COMMUNITY SCREEN (FIXED) ---
  useEffect(() => {
    // If we have a targetUser passed from navigation
    if (route.params?.targetUser) {
        const target = route.params.targetUser;
        
        // --- FIX: Ensure targetId is a STRING, not an object ---
        let targetId = target.uid || target._id || target.id;
        if (typeof targetId === 'object') {
            targetId = targetId.toString(); // Fallback if somehow an object slips through
        }

        // Check if this user is already in My Chats
        const existingChat = myChats.find(u => String(u.uid) === String(targetId));
        // Check if this user is in Requests
        const existingRequest = requests.find(u => String(u.uid) === String(targetId));

        if (existingChat) {
            setActiveTab('chats');
            setActiveChatUser(existingChat);
        } else if (existingRequest) {
            setActiveTab('requests');
            setActiveChatUser(existingRequest);
        } else {
            // It's a new conversation
            setActiveTab('chats');
            setActiveChatUser({
                uid: targetId, // Explicit string ID
                name: target.name,
                profilePic: target.profilePic,
                status: 'new',
                chatId: null
            });
        }
    }
  }, [route.params, myChats, requests]); 

  // --- LOAD MESSAGES (FIXED) ---
  useEffect(() => {
    if (!activeChatUser || !currentUser) return;

    const loadMessages = async () => {
      try {
        // --- FIX: Explicitly cast UID to string to prevent [object Object] error ---
        const targetId = String(activeChatUser.uid); 
        
        const res = await client.get(`/chat/messages/${targetId}`);
        
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
      } catch (err) { 
        console.log("Load Msg Error:", err); 
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
    
  }, [activeChatUser, currentUser]);

  const handleLogout = async () => {
  await AsyncStorage.multiRemove(['userToken', 'userInfo', 'alertsCount']);
  setCurrentUser(null);
  setSidebarVisible(false);
  navigation.navigate('Login');
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !stagedImage) return;
    const currentMsg = message;
    setMessage(''); 
    setSendingImage(true);
    let imageUrl = null;
    try {
        if (stagedImage) {
            const data = new FormData();
            data.append('file', { uri: stagedImage, type: 'image/jpeg', name: 'chat.jpg' });
            data.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            data.append('cloud_name', CLOUDINARY_CONFIG.cloudName); // Make sure to send cloud_name if needed by your backend logic or if directly fetching cloudinary
            const res = await fetch(CLOUDINARY_CONFIG.apiUrl, { method: 'POST', body: data });
            const result = await res.json();
            imageUrl = result.secure_url;
        }
        
        // --- FIX: Ensure receiverId is a string ---
        await client.post('/chat/send', { 
            receiverId: String(activeChatUser.uid), 
            text: currentMsg, 
            image: imageUrl 
        });
        
        if (activeChatUser.status === 'new') {
            fetchListData();
        }
        
        setStagedImage(null);
    } catch (error) { showToast("Failed", "Message could not be sent.", "error"); } 
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

  const renderEmptyContacts = () => (
    <View style={styles.emptyListContainer}>
       <View style={styles.emptyListIcon}>
          <Ionicons name={activeTab === 'requests' ? "checkmark-done" : "people"} size={20} color="rgba(255,255,255,0.7)" />
       </View>
       <Text style={styles.emptyListText}>
          {activeTab === 'requests' ? "All caught up" : "No active chats"}
       </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

            <Sidebar 
              visible={sidebarVisible} 
              onClose={() => setSidebarVisible(false)} 
              navigation={navigation}
              user={currentUser}
              onLogout={handleLogout}
            />
            
      <Header title="CRAYCHAT" context="Chat" onProfilePress={() => setSidebarVisible(true)} />

      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
          <View style={[styles.toastBar, toastMessage.type === 'error' ? styles.toastWarning : toastMessage.type === 'success' ? styles.toastSuccess : styles.toastInfo]}>
            <Ionicons name={toastMessage.type === 'error' ? "alert-circle" : toastMessage.type === 'success' ? "checkmark-circle" : "information-circle"} size={20} color="#FFF" />
            <Text style={styles.toastText} numberOfLines={1}>{toastMessage.title}: {toastMessage.body}</Text>
          </View>
        </Animated.View>
      )}

      {!currentUser ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#BDC3C7" style={{ marginBottom: 20 }} />
          <Text style={styles.largeTitle}>Join the Chat</Text>
          <Text style={styles.subText}>Connect with other researchers directly.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.actionBtnText}>Log In to Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContent}>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'chats' && styles.activeTabButton]} onPress={() => { setActiveTab('chats'); setActiveChatUser(null); }}>
              <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>CHATS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'requests' && styles.activeTabButton]} onPress={() => { setActiveTab('requests'); setActiveChatUser(null); }}>
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>REQUESTS</Text>
              {requests.length > 0 && <View style={styles.tabBadge}><Text style={styles.badgeText}>{requests.length}</Text></View>}
            </TouchableOpacity>
          </View>

          {/* CONTACTS BAR */}
          <View style={[styles.contactsBar, activeTab === 'requests' && { backgroundColor: '#E76F51' }]}>
            <FlatList
              data={activeTab === 'requests' ? requests : myChats}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.contactItem} onPress={() => setActiveChatUser(item)}>
                  <View style={[styles.avatarPlaceholder, activeChatUser?.uid === item.uid && { borderColor: '#FFF', borderWidth: 2 }]}>
                    <Image source={item.profilePic ? { uri: item.profilePic } : require('../../assets/profile-icon.png')} style={styles.contactImage} />
                  </View>
                  <Text style={styles.contactName} numberOfLines={1}>{item.name.split(' ')[0]}</Text>
                  {activeTab === 'chats' && item.status === 'pending' && <View style={styles.pendingDot} />}
                </TouchableOpacity>
              )}
              horizontal 
              showsHorizontalScrollIndicator={false}
              ListEmptyComponent={renderEmptyContacts}
              contentContainerStyle={{ paddingHorizontal: 15 }}
            />
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.chatEngine} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
            <View style={styles.chatLayer}>
              {!activeChatUser ? (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateCircle}>
                      <Ionicons name="chatbubble-ellipses-outline" size={60} color="#3D5A80" />
                  </View>
                  <Text style={styles.emptyStateTitle}>
                    {activeTab === 'requests' ? 'Message Requests' : 'Your Conversations'}
                  </Text>
                  <Text style={styles.emptyStateSub}>
                    {activeTab === 'requests' 
                      ? 'People who aren\'t in your contacts yet.' 
                      : 'Select a user from the top bar to start chatting or find new people in Community.'}
                  </Text>
                  
                  {activeTab === 'chats' && (
                    <TouchableOpacity style={styles.findUsersBtn} onPress={() => navigation.navigate('Community')}>
                        <Feather name="search" size={16} color="#FFF" />
                        <Text style={styles.findUsersText}>Find Researchers</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <>
                  <View style={styles.chatPartnerHeader}>
                    <View>
                        <Text style={styles.partnerName}>{activeChatUser.name}</Text>
                        {activeTab === 'chats' && activeChatUser.status === 'pending' && (
                            <Text style={{fontSize: 10, color: '#95A5A6'}}>Request Sent • Pending</Text>
                        )}
                        {activeChatUser.status === 'new' && (
                            <Text style={{fontSize: 10, color: '#2A9D8F'}}>New Conversation</Text>
                        )}
                    </View>
                    {activeTab === 'requests' && <View style={styles.requestBadge}><Text style={styles.requestBadgeText}>REQUEST</Text></View>}
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

                  <View style={styles.actionContainer}>
                    {activeTab === 'requests' ? (
                      <View style={styles.acceptBanner}>
                        <Text style={styles.acceptTitle}>Message Request</Text>
                        <Text style={styles.acceptSubText}>Accept to reply to {activeChatUser.name}.</Text>
                        <View style={styles.acceptActionRow}>
                          <TouchableOpacity style={styles.ignoreBtn} onPress={() => setActiveChatUser(null)}><Text style={styles.ignoreText}>Ignore</Text></TouchableOpacity>
                          
                          <TouchableOpacity 
                              style={styles.acceptBtn} 
                              onPress={async () => {
                                try {
                                    const res = await client.post('/chat/accept', { chatId: activeChatUser.chatId });
                                    if (res.data.success) { 
                                        setActiveChatUser(prev => ({ ...prev, status: 'accepted' }));
                                        setActiveTab('chats'); 
                                        fetchListData(); 
                                        showToast("Accepted", "You can now chat.", "success");
                                    }
                                } catch (err) { showToast("Error", "Could not accept request.", "error"); }
                            }}
                          >
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
  
  // --- TOAST ---
  toastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 20, left: 20, right: 20, zIndex: 9999, alignItems: 'center' },
  toastBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  toastWarning: { backgroundColor: '#E76F51' }, 
  toastSuccess: { backgroundColor: '#2A9D8F' }, 
  toastInfo: { backgroundColor: '#3D5A80' },    
  toastText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 10, flex: 1 },

  // --- CENTER EMPTY STATES (GUEST & CHAT) ---
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  largeTitle: { fontSize: 22, fontWeight: '800', color: '#293241', textAlign: 'center', marginBottom: 10 },
  subText: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  actionBtn: { backgroundColor: '#3D5A80', paddingHorizontal: 35, paddingVertical: 14, borderRadius: 30, elevation: 4 },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // --- MAIN CHAT EMPTY STATE ---
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: -50 },
  emptyStateCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyStateTitle: { fontSize: 18, fontWeight: '800', color: '#2C3E50', marginBottom: 10 },
  emptyStateSub: { fontSize: 13, color: '#7F8C8D', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  findUsersBtn: { flexDirection: 'row', backgroundColor: '#3D5A80', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25, alignItems: 'center', gap: 8 },
  findUsersText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // --- HORIZONTAL LIST EMPTY STATE ---
  emptyListContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginLeft: 0 },
  emptyListIcon: { marginRight: 8 },
  emptyListText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },

  // Tab Bar
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#ECF0F1' },
  tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTabButton: { borderBottomColor: '#3D5A80' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#BDC3C7', letterSpacing: 1 },
  activeTabText: { color: '#3D5A80' },
  tabBadge: { position: 'absolute', top: 10, right: 30, backgroundColor: '#E74C3C', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  
  // Contacts Bar
  contactsBar: { backgroundColor: '#3D5A80', paddingVertical: 15, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, minHeight: 90 },
  contactItem: { alignItems: 'center', marginRight: 15, width: 60 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', overflow: 'hidden' },
  contactImage: { width: '100%', height: '100%' },
  contactName: { fontSize: 10, color: '#FFF', marginTop: 5, fontWeight: '600' },
  pendingDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#F1C40F', borderWidth: 1, borderColor: '#3D5A80' },
  
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

  // Action Area
  actionContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F3F4',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  
  acceptBanner: { padding: 20, alignItems: 'center' },
  acceptTitle: { fontWeight: '800', fontSize: 17, color: '#2C3E50' },
  acceptSubText: { fontSize: 12, color: '#7F8C8D', marginVertical: 8, textAlign: 'center' },
  acceptActionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  ignoreBtn: { flex: 1, paddingVertical: 14, borderRadius: 15, backgroundColor: '#F0F3F4', alignItems: 'center' },
  acceptBtn: { flex: 1, paddingVertical: 14, borderRadius: 15, backgroundColor: '#3D5A80', alignItems: 'center' },
  ignoreText: { color: '#7F8C8D', fontWeight: '700' },
  acceptBtnText: { color: '#FFF', fontWeight: '700' },

  inputArea: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  textInput: { flex: 1, marginHorizontal: 12, backgroundColor: '#F8F9F9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, color: '#2C3E50' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3D5A80', justifyContent: 'center', alignItems: 'center' },

  navBarSpacer: { height: 95 }, 
  requestBadge: { backgroundColor: '#E74C3C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  requestBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' }
});