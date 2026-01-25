import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase Imports
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'; 
import { auth, db } from '../config/firebase'; 

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Notification State
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' or 'error'

  const showNotification = (text, type) => {
    setMessage({ text, type });
    // Auto-hide notification after 4 seconds
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleLogin = async () => {
    if (email === '' || password === '') {
      showNotification("Please enter email and password.", "error");
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. UPDATE "lastOnline" IN FIRESTORE
      await updateDoc(doc(db, "users", user.uid), {
        lastOnline: serverTimestamp()
      });
      
      showNotification("Logged in successfully!", "success");
      
      // --- THE FIX IS HERE ---
      // We explicitly navigate to Home after a 1-second delay so the user sees the success message.
      setTimeout(() => {
        setLoading(false);
        navigation.replace('Home');
      }, 1000); 
      
    } catch (error) {
      setLoading(false);
      let errorText = "Invalid login credentials.";
      
      // Detailed Firebase Error Handling
      if (error.code === 'auth/user-not-found') {
        errorText = "No account found with this email.";
      } else if (error.code === 'auth/wrong-password') {
        errorText = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/invalid-email') {
        errorText = "The email address is badly formatted.";
      } else if (error.code === 'auth/network-request-failed') {
        errorText = "Network error. Check your internet connection.";
      }
      
      showNotification(errorText, "error");
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
              <Text style={styles.registerText}>Apply for Access</Text>
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