import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import client from '../api/client';

export default function VerifyOtpScreen({ route, navigation }) {
  const { email, profileData } = route.params; 
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); 
  const inputRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle OTP Input (Updated for alphanumeric and pasting)
  const handleOtpChange = (text, index) => {
    // 1. Strip out anything that isn't a letter or number, and capitalize
    const cleanText = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // 2. Handle clearing the input (Backspace)
    if (cleanText === '') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // 3. Handle pasting a full code or SMS autofill
    if (cleanText.length > 1) {
      const chars = cleanText.split('').slice(0, 6);
      const newOtp = [...otp];
      
      chars.forEach((c, i) => {
        if (index + i < 6) newOtp[index + i] = c;
      });
      
      setOtp(newOtp);
      
      // Auto-focus the next empty box or the last box
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // 4. Handle standard single-character typing
    const newOtp = [...otp];
    // Take the last character in case rapid typing grouped them
    newOtp[index] = cleanText.slice(-1); 
    setOtp(newOtp);

    // 5. Auto-focus next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (text, index) => {
    if (!text && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // --- 1. AUTO LOGIN LOGIC (VERIFY) ---
  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the full 6-character code.");
      return;
    }

    setLoading(true);

    try {
      const response = await client.post('/auth/verify-otp', {
        email: email,
        otp: otpCode,
        profileData: profileData 
      });

      if (response.status === 200 && response.data.success) {
        const { token, user } = response.data;
        
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        
        Alert.alert("Success", "Account Verified! Logging you in...");
        navigation.replace('Home'); 
      }

    } catch (error) {
      if (error.response) {
        Alert.alert("Failed", error.response.data.message);
      } else {
        Alert.alert("Error", "Network Error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 2. RESEND LOGIC ---
  const handleResend = async () => {
    if (timer > 0) {
       Alert.alert("Wait", `Please wait ${formatTime(timer)} before resending.`);
       return;
    }

    setLoading(true);
    try {
      const response = await client.post('/auth/resend-otp', { email });
      
      if (response.status === 200) {
        Alert.alert("Sent!", "A new code has been sent to your email.");
        setTimer(600); 
        setOtp(['', '', '', '', '', '']); 
      }
    } catch (error) {
       Alert.alert("Error", "Could not resend code. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={26} color="#293241" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-open-outline" size={80} color="#3D5A80" />
        </View>

        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          We have sent the verification code to your email address
        </Text>
        <Text style={styles.emailText}>{email}</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => inputRefs.current[index] = ref}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              keyboardType="default"
              autoCapitalize="characters"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={6} 
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  handleBackspace(digit, index);
                }
              }}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} disabled={loading}>
          <LinearGradient colors={['#3D5A80', '#293241']} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={styles.verifyBtnText}>CONFIRM</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <Text style={styles.resendText}>
            Didn't receive code? 
            <Text 
              style={[styles.resendLink, timer > 0 && { color: '#bdc3c7' }]} 
              onPress={handleResend}
            > Resend</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  iconContainer: { marginBottom: 30, backgroundColor: '#E0E6ED', padding: 20, borderRadius: 100 },
  title: { fontSize: 24, fontWeight: '800', color: '#293241', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', marginBottom: 5 },
  emailText: { fontSize: 15, fontWeight: '700', color: '#3D5A80', marginBottom: 40 },
  
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  otpInput: { 
    width: 45, height: 55, 
    borderWidth: 1, borderColor: '#BDC3C7', borderRadius: 12, 
    fontSize: 24, textAlign: 'center', color: '#293241', backgroundColor: '#FFF' 
  },
  otpInputFilled: { borderColor: '#3D5A80', backgroundColor: '#F0F4F8' },

  verifyBtn: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  btnGradient: { height: 55, justifyContent: 'center', alignItems: 'center' },
  verifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  timerContainer: { marginTop: 30, alignItems: 'center' },
  timerText: { fontSize: 18, fontWeight: '700', color: '#3D5A80', marginBottom: 10 },
  resendText: { color: '#7F8C8D' },
  resendLink: { color: '#E74C3C', fontWeight: '700' }
});