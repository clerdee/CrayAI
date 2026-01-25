import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  TextInput, Platform, KeyboardAvoidingView, FlatList, StatusBar, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Custom Modular Components
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';

// Firebase Imports
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export default function ChatScreen({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [message, setMessage] = useState('');
  
  // Real-Time & UI States
  const [contacts, setContacts] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [sendingImage, setSendingImage] = useState(false);
  const [stagedImage, setStagedImage] = useState(null);

  const currentUserId = auth.currentUser?.uid;
  const isGuest = !currentUserId; 

  // ==========================================
  // 1. FETCH USERS & LISTEN FOR UNREAD/LAST MSG
  // ==========================================
  useEffect(() => {
    if (isGuest) {
      setLoadingContacts(false);
      return; 
    }

    let unsubscribeFunctions = [];

    const fetchUsersAndChatData = async () => {
      try {
        const q = query(collection(db, "users"), where("uid", "!=", currentUserId));
        const querySnapshot = await getDocs(q);
        let usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), unreadCount: 0, lastMessage: null }));

        usersList.forEach(otherUser => {
          const chatId = [currentUserId, otherUser.uid].sort().join('_');
          const chatRef = collection(db, `chats/${chatId}/messages`);
          const qChat = query(chatRef, orderBy('createdAt', 'desc')); 

          const unsub = onSnapshot(qChat, (snapshot) => {
            const allMessages = snapshot.docs.map(d => d.data());
            const lastMsgData = allMessages[0];
            const lastMsgText = lastMsgData ? (lastMsgData.text ? lastMsgData.text : '📷 Image') : 'No messages';
            const unreadCount = allMessages.filter(m => m.senderId === otherUser.uid && m.status === 'delivered').length;

            setContacts(prevContacts => prevContacts.map(u => 
              u.uid === otherUser.uid 
                ? { ...u, unreadCount: unreadCount, lastMessage: lastMsgText } 
                : u
            ));
          });
          unsubscribeFunctions.push(unsub);
        });

        setContacts(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchUsersAndChatData();

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [currentUserId, isGuest]);

  // ==========================================
  // 2. LISTEN FOR ACTIVE CHAT MESSAGES & MARK AS SEEN
  // ==========================================
  useEffect(() => {
    if (isGuest || !activeChatUser || !currentUserId) return;

    const chatId = [currentUserId, activeChatUser.uid].sort().join('_');

    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text || '',
          sender: data.senderId === currentUserId ? 'me' : 'other',
          time: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
          type: data.image ? 'image' : 'text',
          image: data.image || null,
          status: data.status || 'delivered'
        };
      });
      setMessages(fetchedMessages);
    });

    const markMessagesAsSeen = async () => {
      try {
        const unreadQuery = query(collection(db, `chats/${chatId}/messages`), where('senderId', '==', activeChatUser.uid), where('status', '==', 'delivered'));
        const querySnapshot = await getDocs(unreadQuery);
        if (!querySnapshot.empty) {
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => batch.update(doc.ref, { status: 'seen' }));
          await batch.commit(); 
        }
      } catch (err) {
        console.error("Error updating seen status:", err);
      }
    };

    markMessagesAsSeen();

    return unsubscribe;
  }, [activeChatUser, currentUserId, isGuest]);

  // ==========================================
  // 3. SEND MESSAGE LOGIC
  // ==========================================
  const uploadImageAsync = async (uri) => {
    const data = new FormData();
    data.append('file', { uri, type: 'image/jpeg', name: 'chat_image.jpg' });
    data.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    data.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    
    let res = await fetch(CLOUDINARY_CONFIG.apiUrl, { method: 'POST', body: data });
    let result = await res.json();
    return result.secure_url;
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) setStagedImage(result.assets[0].uri); 
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !stagedImage) || !activeChatUser) return;

    setSendingImage(true);
    let imageUrl = null;
    if (stagedImage) imageUrl = await uploadImageAsync(stagedImage);

    const textToSend = message;
    setMessage(''); 
    setStagedImage(null); 

    const chatId = [currentUserId, activeChatUser.uid].sort().join('_');
    
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      text: textToSend,
      image: imageUrl,
      senderId: currentUserId,
      status: 'delivered', 
      createdAt: serverTimestamp()
    });

    setSendingImage(false);
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => setActiveChatUser(item)}>
      <View style={[styles.avatarPlaceholder, activeChatUser?.uid === item.uid && styles.activeAvatarBorder]}>
        <Image 
          source={item.profilePic ? { uri: item.profilePic } : require('../../assets/profile-icon.png')} 
          style={styles.contactImage} 
        />
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.contactName, activeChatUser?.uid === item.uid && styles.activeContactText, item.unreadCount > 0 && {fontWeight: '900', color: '#FFF'}]} numberOfLines={1}>
        {item.firstName || "User"}
      </Text>
      <Text style={[styles.lastMessagePreview, item.unreadCount > 0 && {color: '#FFF', fontWeight: '700'}]} numberOfLines={1}>
        {item.lastMessage || '...'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      <Header title="CRAYCHAT" onProfilePress={() => setSidebarVisible(true)} />

      {/* --- GUEST VIEW --- */}
      {isGuest ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#BDC3C7" />
          <Text style={styles.largeTitle}>Welcome to Craychat!</Text>
          <Text style={styles.subText}>Sign in to connect with other researchers and start a discussion.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.actionBtnText}>Log In to Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* --- CONTACTS BAR --- */}
          <View style={styles.contactsBar}>
            {loadingContacts ? (
              <ActivityIndicator color="#FFF" style={{ marginTop: 10 }} />
            ) : (
              <FlatList
                data={contacts}
                renderItem={renderContact}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contactsList}
              />
            )}
          </View>

          {/* --- CHAT ENGINE AREA --- */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.chatEngine}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.chatLayer}>
              
              {!activeChatUser ? (
                <View style={styles.centerContainer}>
                  <Ionicons name="people-circle-outline" size={80} color="#BDC3C7" />
                  <Text style={[styles.largeTitle, {marginTop: 15}]}>Your Messages</Text>
                  <Text style={styles.subText}>Tap a researcher's profile above to start a discussion or view your chat history.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.chatPartnerHeader}>
                    <Text style={styles.partnerName}>
                      Discussion with {activeChatUser.fullName}
                    </Text>
                  </View>

                  <ScrollView 
                    contentContainerStyle={styles.messagesList} 
                    showsVerticalScrollIndicator={false}
                  >
                    {messages.map((msg) => (
                      <View key={msg.id} style={msg.sender === 'me' ? styles.myMsgWrapper : styles.otherMsgWrapper}>
                        <View style={[msg.sender === 'me' ? styles.myBubble : styles.otherBubble, msg.type === 'image' && styles.imageBubble]}>
                          {msg.type === 'image' && <Image source={{ uri: msg.image }} style={styles.sentImage} />}
                          {msg.text !== '' && (
                            <Text style={[msg.sender === 'me' ? styles.myText : styles.otherText, msg.type === 'image' && {marginTop: 5}]}>
                              {msg.text}
                            </Text>
                          )}
                        </View>
                        <View style={styles.statusRow}>
                          <Text style={styles.timeLabel}>{msg.time}</Text>
                          
                          {/* 1 TICK FOR DELIVERED, 2 TICKS FOR SEEN */}
                          {msg.sender === 'me' && (
                            <Ionicons 
                              name={msg.status === 'seen' ? "checkmark-done" : "checkmark"} 
                              size={14} 
                              color={msg.status === 'seen' ? "#3498db" : "#BDC3C7"} 
                              style={{ marginLeft: 4, marginTop: 4 }}
                            />
                          )}

                        </View>
                      </View>
                    ))}
                    {sendingImage && <ActivityIndicator color="#3D5A80" style={{ alignSelf: 'flex-end', margin: 10 }} />}
                  </ScrollView>

                  {stagedImage && (
                    <View style={styles.stagedImageContainer}>
                      <Image source={{ uri: stagedImage }} style={styles.stagedImage} />
                      <TouchableOpacity style={styles.cancelImageBtn} onPress={() => setStagedImage(null)}>
                        <Ionicons name="close" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.inputArea}>
                    <View style={styles.inputMain}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#BDC3C7" style={{ marginRight: 10 }} />
                      <TextInput 
                        style={styles.textInput}
                        placeholder={stagedImage ? "Add a caption..." : "Write a message..."}
                        placeholderTextColor="#BDC3C7"
                        value={message}
                        onChangeText={setMessage}
                      />
                      <TouchableOpacity style={styles.iconBtn} onPress={handlePickImage}>
                        <Ionicons name="image-outline" size={22} color="#3D5A80" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                      <Ionicons name="paper-plane" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </>
      )}

      <View style={styles.navSpacer} />
      <BottomNavBar navigation={navigation} activeTab="Chat" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  largeTitle: { fontSize: 24, fontWeight: '800', color: '#3D5A80', marginTop: 10 },
  subText: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  actionBtn: { backgroundColor: '#3D5A80', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 30 },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  contactsBar: { backgroundColor: '#98C1D9', paddingVertical: 15 },
  contactsList: { paddingHorizontal: 20 },
  contactItem: { alignItems: 'center', marginRight: 22, maxWidth: 65 }, 
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF', padding: 2, position: 'relative' },
  contactImage: { width: '100%', height: '100%', borderRadius: 25 },
  activeAvatarBorder: { borderWidth: 3, borderColor: '#3D5A80' },
  
  unreadBadge: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#E74C3C', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#98C1D9' },
  unreadText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  contactName: { fontSize: 10, fontWeight: '700', color: '#293241', marginTop: 6, opacity: 0.6 },
  activeContactText: { opacity: 1, color: '#3D5A80' },
  lastMessagePreview: { fontSize: 9, color: '#5D6D7E', opacity: 0.7, marginTop: 2, textAlign: 'center' },

  chatEngine: { flex: 1 },
  chatLayer: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#ECF0F1' },
  chatPartnerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F4F7F9' },
  partnerName: { fontSize: 14, fontWeight: '800', color: '#3D5A80' },

  messagesList: { padding: 20, paddingBottom: 30 },
  myMsgWrapper: { alignSelf: 'flex-end', alignItems: 'flex-end', marginBottom: 20 },
  otherMsgWrapper: { alignSelf: 'flex-start', alignItems: 'flex-start', marginBottom: 20 },
  myBubble: { backgroundColor: '#3D5A80', padding: 14, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: 280 },
  otherBubble: { backgroundColor: '#F4F7F9', padding: 14, borderRadius: 20, borderBottomLeftRadius: 4, maxWidth: 280 },
  imageBubble: { padding: 5, borderRadius: 15 },
  sentImage: { width: 220, height: 150, borderRadius: 12 },
  myText: { color: '#FFF', fontSize: 13, lineHeight: 18 },
  otherText: { color: '#2C3E50', fontSize: 13, lineHeight: 18 },
  
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  timeLabel: { fontSize: 9, color: '#BDC3C7', marginTop: 5, fontWeight: '700' },

  stagedImageContainer: { position: 'relative', marginHorizontal: 15, marginBottom: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 10, overflow: 'hidden' },
  stagedImage: { width: 80, height: 80 },
  cancelImageBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },

  inputArea: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F4F7F9' },
  inputMain: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 25, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: '#ECF0F1' },
  textInput: { flex: 1, fontSize: 13, color: '#2C3E50' },
  iconBtn: { padding: 5 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3D5A80', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  navSpacer: { height: 100 }
});