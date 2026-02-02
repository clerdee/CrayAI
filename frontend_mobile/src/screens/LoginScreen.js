import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REPLACE FIREBASE WITH YOUR API CLIENT
import client from '../api/client';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Notification State
  const [message, setMessage] = useState({ text: '', type: '' });

  const showNotification = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleLogin = async () => {
    if (email === '' || password === '') {
      showNotification("Please enter email and password.", "error");
      return;
    }

    setLoading(true);

    try {
      // 1. Call your Node.js Backend
      const response = await client.post('/auth/login', {
        email: email,
        password: password
      });

      console.log('[LoginScreen] Login response:', {
        status: response.status,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        success: response.data.success
      });

      // 2. Success!
      if (response.status === 200 && response.data.success && response.data.token) {
        // Save token and user data to AsyncStorage
        console.log('[LoginScreen] Saving token to AsyncStorage...');
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.user));
        
        // Verify it was saved
        const savedToken = await AsyncStorage.getItem('userToken');
        console.log('[LoginScreen] Token saved verification:', savedToken ? 'SUCCESS' : 'FAILED');
        
        showNotification(`Welcome back, ${response.data.user.firstName}!`, "success");
        
        // Wait a moment so they see the success message
        setTimeout(() => {
          setLoading(false);
          navigation.replace('Home');
        }, 1000);
      }
      
    } catch (error) {
      setLoading(false);
      console.log('[LoginScreen] Login error:', error);
      
      // Handle Errors from Backend
      if (error.response) {
        // The server responded with a status code other than 2xx (e.g., 400, 404)
        console.log('[LoginScreen] Response error:', error.response.data);
        showNotification(error.response.data.message, "error");
      } else if (error.request) {
        // The request was made but no response was received (Network Error)
        console.log('[LoginScreen] Request error - no response');
        showNotification("Could not connect to server. Check your internet.", "error");
      } else {
        console.log('[LoginScreen] Error:', error.message);
        showNotification("An unexpected error occurred.", "error");
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* --- FLOATING NOTIFICATION --- */}
      {message.text !== '' && (
        <View style={[styles.notification, message.type === 'error' ? styles.errorBg : styles.successBg]}>
          <Ionicons 
            name={message.type === 'error' ? "alert-circle" : "checkmark-circle"} 
            size={20} color="#FFF" 
          />
          <Text style={styles.notificationText}>{message.text}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#293241', '#3D5A80']} style={styles.headerSection}>
          <Image source={require('../../assets/crayfish.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandName}>CRAYAI</Text>
          <Text style={styles.tagline}>The Red Claw Community</Text>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.greeting}>Welcome Back</Text>
          <Text style={styles.subGreeting}>Sign in to access your research data</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#3D5A80" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="researcher@crayai.com"
                placeholderTextColor="#BDC3C7"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Access Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#3D5A80" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#BDC3C7"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#BDC3C7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={['#3D5A80', '#293241']} style={styles.btnGradient}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.loginBtnText}>SIGN IN</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.registerLink}>
            <Text style={styles.noAccountText}>New to the community? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Create New Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContainer: { flexGrow: 1 },
  
  notification: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  successBg: { backgroundColor: '#2ECC71' },
  errorBg: { backgroundColor: '#E74C3C' },
  notificationText: { color: '#FFF', fontWeight: '700', marginLeft: 10, fontSize: 13 },

  closeButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, zIndex: 10, padding: 10 },
  headerSection: { height: 320, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },
  logo: { width: 80, height: 80, tintColor: '#FFF', marginBottom: 15 },
  brandName: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 5, textTransform: 'uppercase' },
  formCard: { backgroundColor: '#FFF', marginHorizontal: 25, marginTop: -50, borderRadius: 30, padding: 30, elevation: 10, marginBottom: 40 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#293241', marginBottom: 5 },
  subGreeting: { fontSize: 14, color: '#7F8C8D', marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', color: '#3D5A80', textTransform: 'uppercase', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#ECF0F1' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#293241', fontSize: 14, fontWeight: '500' },
  loginBtn: { borderRadius: 15, overflow: 'hidden', marginTop: 10, elevation: 5 },
  btnGradient: { height: 55, justifyContent: 'center', alignItems: 'center' },
  loginBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  noAccountText: { color: '#7F8C8D', fontSize: 14 },
  registerText: { color: '#3D5A80', fontSize: 14, fontWeight: '800' }
});