import React, { useState, useRef, useEffect } from 'react';
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
  Platform,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import client from '../api/client'; // Uses your configured Axios client

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BUBBLE_SIZE = 60; 
const MARGIN = 15;
const INITIAL_BOTTOM = 100;

const FloatingChatbot = ({ user }) => {
  
  const initialMessage = { 
    id: 'init', 
    type: 'bot', 
    text: `👋 Hi ${user?.firstName || 'there'}! I'm CrayBot. Ask me about crayfish care, breeding, or gender ID!` 
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const scrollViewRef = useRef();
  
  // ANIMATED VALUES
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const baseBottom = useRef(new Animated.Value(INITIAL_BOTTOM)).current; 
  const opacityAnim = useRef(new Animated.Value(0)).current; 

  // RESET CHAT ON LOGOUT / HIDE LOGIC
  useEffect(() => {
    if (!user) {
      setMessages([initialMessage]);
      setIsExpanded(false);
    }
  }, [user]);

  // KEYBOARD LISTENERS
  useEffect(() => {
    if (!user) return; 

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (event) => {
      Animated.parallel([
        Animated.timing(keyboardOffset, {
          toValue: event.endCoordinates.height, 
          duration: 250,
          useNativeDriver: false, 
        }),
        Animated.timing(baseBottom, {
          toValue: 10, 
          duration: 250,
          useNativeDriver: false,
        })
      ]).start();
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const onKeyboardHide = () => {
      Animated.parallel([
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(baseBottom, {
          toValue: INITIAL_BOTTOM,
          duration: 250,
          useNativeDriver: false,
        })
      ]).start();
    };

    const showListener = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideListener = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [user]);

  // DRAGGABLE BUBBLE LOGIC
  const [position, setPosition] = useState({ 
    x: screenWidth - BUBBLE_SIZE - MARGIN, 
    y: screenHeight - 150 
  });
  
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
        const currentX = pan.x._value;
        const currentY = pan.y._value;

        // Snap to left or right
        const centerOfBubble = currentX + (BUBBLE_SIZE / 2);
        const centerOfScreen = screenWidth / 2;
        let finalX = centerOfBubble < centerOfScreen ? MARGIN : screenWidth - BUBBLE_SIZE - MARGIN;

        // Keep within vertical bounds
        let finalY = currentY;
        const topLimit = 100; 
        const bottomLimit = screenHeight - 150; 
        if (finalY < topLimit) finalY = topLimit;
        if (finalY > bottomLimit) finalY = bottomLimit;

        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          friction: 6, 
          tension: 40, 
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  if (!user) return null;

  // --- API CONNECTION LOGIC (FIXED) ---
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // 1. Display User Message immediately
    const userMsg = { id: Date.now().toString(), type: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    
    const questionToSend = inputText; // Capture text before clearing
    setInputText('');
    setLoading(true);
    
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // 2. Call Node.js Proxy -> Calls Python
      const response = await client.post('/chatbot/ask', { 
        question: questionToSend 
      });

      // ✅ FIX: Python returns 'response', Proxy error returns 'answer'
      // We check for both to cover success and error cases safely.
      const botReply = response.data?.response || response.data?.answer || "I'm connected, but I received an empty response.";

      const botMsg = { id: (Date.now() + 1).toString(), type: 'bot', text: botReply };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error('Chatbot Error:', error);
      
      // Handle network errors (e.g., Node server down)
      const errorText = error.response?.data?.answer || "Sorry, I can't reach the server right now. Please try again later.";
      
      const errorMsg = { 
        id: (Date.now() + 1).toString(), 
        type: 'bot', 
        text: errorText
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const toggleExpand = () => {
    if (isExpanded) {
      Animated.timing(opacityAnim, { 
        toValue: 0, 
        duration: 200, 
        useNativeDriver: false
      }).start(() => setIsExpanded(false));
      Keyboard.dismiss();
    } else {
      setIsExpanded(true);
      Animated.timing(opacityAnim, { 
        toValue: 1, 
        duration: 200, 
        useNativeDriver: false
      }).start();
    }
  };

  const chatWindowStyle = {
    opacity: opacityAnim,
    bottom: Animated.add(baseBottom, keyboardOffset), 
    right: 20,
    width: screenWidth - 40,
    height: 450, 
    transform: [{ scale: opacityAnim }] 
  };

  return (
    <>
      {/* FLOATING BUBBLE */}
      {!isExpanded && (
        <Animated.View
          style={[
            styles.bubbleContainer,
            pan.getLayout(),
            { width: BUBBLE_SIZE, height: BUBBLE_SIZE }
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity style={styles.floatingButton} onPress={toggleExpand} activeOpacity={0.9}>
            <Text style={styles.crayIcon}>🦐</Text> 
            <View style={styles.badge} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* EXPANDED CHAT WINDOW */}
      {isExpanded && (
        <Animated.View style={[styles.chatWindow, chatWindowStyle]}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
               <Text style={{fontSize: 20, marginRight: 8}}>🦐</Text>
               <View>
                 <Text style={styles.title}>CrayBot</Text>
                 <Text style={styles.subtitle}>Research Assistant • Online</Text>
               </View>
            </View>
            <TouchableOpacity onPress={toggleExpand} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer} 
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageWrapper, msg.type === 'user' ? styles.userWrapper : styles.botWrapper]}>
                {msg.type === 'bot' && <View style={styles.botAvatar}><Text>🦐</Text></View>}
                <View style={[styles.messageBubble, msg.type === 'user' ? styles.userBubble : styles.botBubble]}>
                  <Text style={[styles.messageText, msg.type === 'user' ? styles.userText : styles.botText]}>{msg.text}</Text>
                </View>
              </View>
            ))}
            {/* Typing Indicator */}
            {loading && (
               <View style={[styles.messageWrapper, styles.botWrapper]}>
                  <View style={styles.botAvatar}><Text>🦐</Text></View>
                  <View style={[styles.messageBubble, styles.botBubble, {paddingVertical: 8}]}>
                     <ActivityIndicator size="small" color="#3D5A80" />
                  </View>
               </View>
            )}
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
            <TouchableOpacity 
              style={[styles.sendButton, (!inputText.trim() || loading) && {backgroundColor:'#BDC3C7'}]} 
              onPress={handleSendMessage} 
              disabled={!inputText.trim() || loading}
            >
              <Ionicons name="arrow-up" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  floatingButton: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#3D5A80', 
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  crayIcon: { fontSize: 30 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E76F51', 
    borderWidth: 2,
    borderColor: '#FFF',
  },
  chatWindow: {
    position: 'absolute',
    zIndex: 10000,
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25,
    borderWidth: 1,
    borderColor: '#D1D9E6',
    overflow: 'hidden',
  },
  header: { 
    backgroundColor: '#3D5A80', 
    padding: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center' },
  title: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  subtitle: { color: '#E0FBFC', fontSize: 11, fontWeight: '600' },
  closeBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 15 },
  messagesContainer: { flex: 1, backgroundColor: '#F2F4F6' },
  messagesContent: { padding: 15, paddingBottom: 10 },
  messageWrapper: { marginVertical: 5, flexDirection: 'row', alignItems: 'flex-end' },
  userWrapper: { justifyContent: 'flex-end' },
  botWrapper: { justifyContent: 'flex-start' },
  botAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 2, borderWidth: 1, borderColor: '#E0E7ED' },
  messageBubble: { padding: 12, borderRadius: 18, maxWidth: '75%', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  userBubble: { backgroundColor: '#3D5A80', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E0E7ED' },
  userText: { color: '#FFF', fontSize: 14 },
  botText: { color: '#2C3E50', fontSize: 14 },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#E0E7ED', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: '#FFF' 
  },
  input: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    borderWidth: 1,
    borderColor: '#E0E7ED',
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    maxHeight: 100, 
    fontSize: 14, 
    color: '#2C3E50' 
  },
  sendButton: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: '#E76F51', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#E76F51',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
});

export default FloatingChatbot;