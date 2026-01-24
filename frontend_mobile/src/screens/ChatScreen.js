import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  TextInput, Platform, KeyboardAvoidingView, FlatList, StatusBar, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Custom Modular Components
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Sidebar from '../components/Sidebar';

export default function ChatScreen({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState('JUAN'); 
  
  // Simulated Chat Data with Image Support
  const [messages, setMessages] = useState([
    { id: '1', text: "Team, I've updated the latest scan for Pond B.", sender: 'other', time: '10:00 AM', type: 'text' },
    { id: '2', text: "Looking at it now. The AI confidence is at 98%.", sender: 'me', time: '10:02 AM', type: 'text' },
  ]);

  const contacts = [
    { id: '1', name: 'JUAN', avatar: 'https://avatar.iran.liara.run/public/12' },
    { id: '2', name: 'MARIA', avatar: 'https://avatar.iran.liara.run/public/70' },
    { id: '3', name: 'DR. LEE', avatar: 'https://avatar.iran.liara.run/public/33' },
    { id: '4', name: 'SANTI', avatar: 'https://avatar.iran.liara.run/public/22' },
  ];

  // --- SEND IMAGE LOGIC ---
  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newMsg = {
        id: Date.now().toString(),
        image: result.assets[0].uri,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'image'
      };
      setMessages([...messages, newMsg]);
    }
  };

  const handleSendMessage = () => {
    if (message.trim().length > 0) {
      const newMsg = {
        id: Date.now().toString(),
        text: message,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };
      setMessages([...messages, newMsg]);
      setMessage('');
    }
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => setActiveChat(item.name)}>
      <View style={[styles.avatarPlaceholder, activeChat === item.name && styles.activeAvatarBorder]}>
        <Image source={{ uri: item.avatar }} style={styles.contactImage} />
        <View style={styles.onlineDot} />
      </View>
      <Text style={[styles.contactName, activeChat === item.name && styles.activeContactText]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      <Header title="CRAYCHAT" onProfilePress={() => setSidebarVisible(true)} />

      <View style={styles.contactsBar}>
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contactsList}
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.chatEngine}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatLayer}>
          <View style={styles.chatPartnerHeader}>
            <Text style={styles.partnerName}>Discussion with {activeChat}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.messagesList} showsVerticalScrollIndicator={false}>
            {messages.map((msg) => (
              <View key={msg.id} style={msg.sender === 'me' ? styles.myMsgWrapper : styles.otherMsgWrapper}>
                <View style={[msg.sender === 'me' ? styles.myBubble : styles.otherBubble, msg.type === 'image' && styles.imageBubble]}>
                  {msg.type === 'image' ? (
                    <Image source={{ uri: msg.image }} style={styles.sentImage} />
                  ) : (
                    <Text style={msg.sender === 'me' ? styles.myText : styles.otherText}>{msg.text}</Text>
                  )}
                </View>
                <Text style={styles.timeLabel}>{msg.time}</Text>
              </View>
            ))}
          </ScrollView>

          {/* INPUT AREA */}
          <View style={styles.inputArea}>
            <View style={styles.inputMain}>
              <Image source={require('../../assets/profile-icon.png')} style={styles.tinyAvatar} />
              <TextInput 
                style={styles.textInput}
                placeholder="Write a message..."
                placeholderTextColor="#BDC3C7"
                value={message}
                onChangeText={setMessage}
              />
              <TouchableOpacity style={styles.iconBtn} onPress={handlePickImage}>
                <Ionicons name="attach" size={22} color="#3D5A80" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
              <Ionicons name="paper-plane" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.navSpacer} />
      <BottomNavBar navigation={navigation} activeTab="Chat" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  contactsBar: { backgroundColor: '#98C1D9', paddingVertical: 15 },
  contactsList: { paddingHorizontal: 20 },
  contactItem: { alignItems: 'center', marginRight: 22 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF', padding: 2, position: 'relative' },
  contactImage: { width: '100%', height: '100%', borderRadius: 25 },
  activeAvatarBorder: { borderWidth: 3, borderColor: '#3D5A80' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#58D68D', borderWidth: 2, borderColor: '#98C1D9' },
  contactName: { fontSize: 10, fontWeight: '700', color: '#293241', marginTop: 6, opacity: 0.6 },
  activeContactText: { opacity: 1, color: '#3D5A80' },

  chatEngine: { flex: 1 },
  chatLayer: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#ECF0F1' },
  chatPartnerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F4F7F9' },
  partnerName: { fontSize: 14, fontWeight: '800', color: '#3D5A80' },

  messagesList: { padding: 20, paddingBottom: 30 },
  myMsgWrapper: { alignSelf: 'flex-end', alignItems: 'flex-end', marginBottom: 20 },
  otherMsgWrapper: { alignSelf: 'flex-start', alignItems: 'flex-start', marginBottom: 20 },
  myBubble: { backgroundColor: '#3D5A80', padding: 14, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: 280 },
  otherBubble: { backgroundColor: '#F4F7F9', padding: 14, borderRadius: 20, borderBottomLeftRadius: 4, maxWidth: 280 },
  
  // Image Message Specific Styles
  imageBubble: { padding: 5, borderRadius: 15 },
  sentImage: { width: 220, height: 150, borderRadius: 12 },

  myText: { color: '#FFF', fontSize: 13, lineHeight: 18 },
  otherText: { color: '#2C3E50', fontSize: 13, lineHeight: 18 },
  timeLabel: { fontSize: 9, color: '#BDC3C7', marginTop: 5, fontWeight: '700' },

  inputArea: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F4F7F9' },
  inputMain: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 25, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: '#ECF0F1' },
  tinyAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  textInput: { flex: 1, fontSize: 13, color: '#2C3E50' },
  iconBtn: { padding: 5 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3D5A80', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  navSpacer: { height: 100 }
});