import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FloatingChatbot = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: '🦐 Hi! I\'m CrayBot, your friendly research assistant. How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 1. ADD REF FOR SCROLLVIEW
  const scrollViewRef = useRef();

  const [position, setPosition] = useState({ x: screenWidth - 90, y: screenHeight - 150 });
  const pan = useRef(new Animated.ValueXY({ x: position.x, y: position.y })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isExpanded,
      onMoveShouldSetPanResponder: () => !isExpanded,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const margin = 10;
        let newX = pan.x._value;
        let newY = pan.y._value;

        // Boundary checks
        if (newX < margin) newX = margin;
        if (newX > screenWidth - 80) newX = screenWidth - 80;
        if (newY < margin) newY = margin;
        if (newY > screenHeight - 80) newY = screenHeight - 80;

        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const userMsg = { id: messages.length + 1, type: 'user', text: inputText };
    setMessages([...messages, userMsg]);
    setInputText('');
    
    setTimeout(() => {
      const botResponses = [
        '🦐 That\'s interesting! Tell me more about that.',
        '🦐 I understand. How can I assist you further?',
        '🦐 Great question! I\'m here to help you explore and share research.',
        '🦐 Thanks for sharing! Would you like to create a post about this?',
        '🦐 That sounds exciting! Remember to share your findings with the community.',
      ];
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      const botMsg = { id: messages.length + 2, type: 'bot', text: randomResponse };
      setMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const containerStyle = isExpanded 
    ? styles.expandedContainer 
    : pan.getLayout(); 

  return (
    <Animated.View
      style={[
        styles.baseContainer,
        containerStyle,
        !isExpanded && { width: 70, height: 70 }
      ]}
      {...(!isExpanded ? panResponder.panHandlers : {})}
    >
      {!isExpanded ? (
        <TouchableOpacity style={styles.floatingButton} onPress={toggleExpand} activeOpacity={0.8}>
          <Text style={styles.crayIcon}>🦐</Text>
        </TouchableOpacity>
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatbotBox}
        >
          <View style={styles.header}>
            <Text style={styles.title}>🦐 CrayChat</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={toggleExpand} style={styles.headerButton}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. USE THE REF CORRECTLY HERE */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer} 
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageWrapper, msg.type === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper]}>
                <View style={[styles.messageBubble, msg.type === 'user' ? styles.userMessage : styles.botMessage]}>
                  <Text style={[styles.messageText, msg.type === 'user' ? {color:'#FFF'} : {color:'#333'}]}>{msg.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={!inputText.trim()}>
              <MaterialIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  expandedContainer: {
    bottom: 90, 
    right: 20,
    width: screenWidth - 40,
    height: screenHeight * 0.55,
  },
  floatingButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#5B9BD5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FF9F43',
  },
  crayIcon: { fontSize: 35 },
  chatbotBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#5B9BD5',
  },
  header: { 
    backgroundColor: '#5B9BD5', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomWidth: 2, 
    borderBottomColor: '#FF9F43' 
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButton: { padding: 4 },
  messagesContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  messagesContent: { padding: 12, paddingBottom: 20 },
  messageWrapper: { marginVertical: 6, flexDirection: 'row' },
  userMessageWrapper: { justifyContent: 'flex-end' },
  botMessageWrapper: { justifyContent: 'flex-start' },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, maxWidth: '80%' },
  userMessage: { backgroundColor: '#5B9BD5', borderBottomRightRadius: 2 },
  botMessage: { backgroundColor: '#E0E0E0', borderBottomLeftRadius: 2 },
  messageText: { fontSize: 14 },
  inputContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#EEE', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#fff' 
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    maxHeight: 80, 
    fontSize: 14, 
    backgroundColor: '#F9F9F9' 
  },
  sendButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FF9F43', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});

export default FloatingChatbot;