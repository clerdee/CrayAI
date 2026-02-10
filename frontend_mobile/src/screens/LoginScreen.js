import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// API Client
import client from '../api/client';

// IMPORTANT: needed for web browser redirect to work correctly
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Notification State
  const [message, setMessage] = useState({ text: '', type: '' });

  // --- GOOGLE AUTH CONFIGURATION ---
  // You need to get these IDs from Google Cloud Console
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  const showNotification = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), type === 'error' ? 5000 : 3000);
  };

  // --- GOOGLE RESPONSE HANDLER ---
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchGoogleUserProfile(authentication.accessToken);
    }
  }, [response]);

  const fetchGoogleUserProfile = async (token) => {
    setGoogleLoading(true);
    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await response.json();
      
      // Send Google Data to Your Backend
      handleBackendSocialLogin(user);
    } catch (error) {
      console.log('Google User Fetch Error:', error);
      showNotification("Failed to get Google profile.", "error");
      setGoogleLoading(false);
    }
  };

  const handleBackendSocialLogin = async (googleUser) => {
    try {
      const payload = {
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        profilePic: googleUser.picture,
        providerId: 'google',
        uid: googleUser.id
      };

      const res = await client.post('/auth/social-login', payload);

      if (res.status === 200 && res.data.success) {
        // Save Session
        await AsyncStorage.setItem('userToken', res.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(res.data.user));

        showNotification(`Welcome back, ${res.data.user.firstName}!`, "success");
        
        setTimeout(() => {
          setGoogleLoading(false);
          navigation.replace('Home');
        }, 1000);
      } else {
        throw new Error(res.data.message || 'Social login failed');
      }
    } catch (error) {
      console.log('Backend Social Login Error:', error);
      showNotification("Could not sync with server.", "error");
      setGoogleLoading(false);
    }
  };

  // --- NORMAL LOGIN ---
  const handleLogin = async () => {
    if (email === '' || password === '') {
      showNotification("Please enter email and password.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await client.post('/auth/login', {
        email: email,
        password: password
      });

      if (response.status === 200 && response.data.success) {
        const userData = response.data.user;

        // Validation Checks
        if (userData.role === 'admin') {
          showNotification("Admin End Mobile Coming Soon", "info");
          setLoading(false);
          return;
        }

        if (userData.accountStatus === 'Inactive' || userData.accountStatus === 'Deactivated') {
          const reason = userData.deactivationReason || "No specific reason provided.";
          showNotification(`Account Deactivated: ${reason}`, "error");
          setLoading(false);
          return;
        }

        // Success Flow
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
        
        showNotification(`Welcome back, ${userData.firstName}!`, "success");
        
        setTimeout(() => {
          setLoading(false);
          navigation.replace('Home');
        }, 1000);
      }
      
    } catch (error) {
      setLoading(false);
      console.log('[LoginScreen] Login error:', error);
      
      if (error.response) {
        const errorMsg = error.response.data.message || "Login failed.";
        showNotification(errorMsg, "error");
      } else if (error.request) {
        showNotification("Could not connect to server.", "error");
      } else {
        showNotification("An unexpected error occurred.", "error");
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* NOTIFICATION */}
      {message.text !== '' && (
        <View style={[styles.notification, message.type === 'error' ? styles.errorBg : message.type === 'info' ? styles.infoBg : styles.successBg]}>
          <Ionicons name={message.type === 'error' ? "alert-circle" : "checkmark-circle"} size={24} color="#FFF" />
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

          {/* Email */}
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

          {/* Password */}
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
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading || googleLoading}>
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
          

          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* --- GOOGLE BUTTON --- */}
          {/* <TouchableOpacity 
            style={styles.googleBtn} 
            onPress={() => promptAsync()} 
            disabled={!request || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#3D5A80" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#3D5A80" />
                <Text style={styles.googleBtnText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity> */}

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
  infoBg: { backgroundColor: '#3498DB' },
  notificationText: { color: '#FFF', fontWeight: '700', marginLeft: 10, fontSize: 13, flex: 1 },

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

  // --- GOOGLE BUTTON STYLES ---
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#E0E7ED' },
  separatorText: { marginHorizontal: 10, color: '#BDC3C7', fontWeight: '700', fontSize: 12 },
  
  googleBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#BDC3C7',
    borderRadius: 15, height: 55, marginBottom: 15
  },
  googleBtnText: { color: '#3D5A80', fontSize: 15, fontWeight: '700' },

  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  noAccountText: { color: '#7F8C8D', fontSize: 14 },
  registerText: { color: '#3D5A80', fontSize: 14, fontWeight: '800' }
});