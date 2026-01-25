import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown'; 
import * as ImagePicker from 'expo-image-picker';

// --- NEW SOCIAL AUTH IMPORTS ---
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as AuthSession from 'expo-auth-session';

// Firebase Imports
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase'; 
import { GOOGLE_OAUTH_KEYS, FACEBOOK_APP_ID } from '../config/keys';

// Cloudinary Imports
import { CLOUDINARY_CONFIG } from '../config/cloudinary';
import { phCities } from '../data/ph_cities';

// Required for Expo Auth Session
WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen({ navigation }) {
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(null); 
  const [country, setCountry] = useState('Philippines');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  // --- NOTIFICATION STATE ---
  const [message, setMessage] = useState({ text: '', type: '' });

  const showNotification = (text, type) => {
    setMessage({ text, type });
    // Auto-hide notification after 4 seconds
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // ==========================================
  // 1. GOOGLE AUTH SETUP
  // ==========================================
  const [requestGoogle, responseGoogle, promptAsyncGoogle] = Google.useAuthRequest({
    webClientId: GOOGLE_OAUTH_KEYS.webClientId,
    iosClientId: GOOGLE_OAUTH_KEYS.iosClientId,
    androidClientId: GOOGLE_OAUTH_KEYS.androidClientId,
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }), 
  });

  useEffect(() => {
    if (responseGoogle?.type === 'success') {
      const { id_token } = responseGoogle.params;
      const credential = GoogleAuthProvider.credential(id_token);
      handleSocialLogin(credential, 'Google');
    }
  }, [responseGoogle]);

  // ==========================================
  // 2. FACEBOOK AUTH SETUP
  // ==========================================
  const [requestFb, responseFb, promptAsyncFb] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
  });

  useEffect(() => {
    if (responseFb?.type === 'success') {
      const { access_token } = responseFb.params;
      const credential = FacebookAuthProvider.credential(access_token);
      handleSocialLogin(credential, 'Facebook');
    }
  }, [responseFb]);

  // ==========================================
  // 3. SOCIAL REGISTRATION (FIRESTORE) LOGIC
  // ==========================================
  const handleSocialLogin = async (credential, providerName) => {
    setLoading(true);
    try {
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const names = user.displayName ? user.displayName.split(' ') : ['User', ''];
        
        await setDoc(userDocRef, {
          uid: user.uid,
          firstName: names[0],
          lastName: names.length > 1 ? names[names.length - 1] : '',
          fullName: user.displayName || 'Social User', 
          email: user.email,
          profilePic: user.photoURL || '',
          city: 'Taguig', 
          role: "user", 
          accountStatus: "Active",
          provider: providerName,
          lastOnline: serverTimestamp(),
          createdAt: serverTimestamp(), 
        });
      }

      showNotification(`Connected via ${providerName}!`, "success");
      setTimeout(() => {
        setLoading(false);
        navigation.replace('Home'); // Redirect to Home
      }, 1500);

    } catch (error) {
      setLoading(false);
      showNotification(`${providerName} login failed.`, "error");
      console.error(error);
    }
  };

  // --- IMAGE PICKING LOGIC ---
  // NOTE: Kept native Alert.alert here because it is a prompt with 3 button choices, not a notification.
  const showImageOptions = () => {
    Alert.alert("Profile Picture", "Choose a source", [
      { text: "📷 Camera", onPress: () => pickImage(true) },
      { text: "🖼️ Gallery", onPress: () => pickImage(false) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const pickImage = async (fromCamera) => {
    let result;
    if (fromCamera) {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    } else {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    }
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const uploadImageAsync = async (uri) => {
    const data = new FormData();
    data.append('file', { uri, type: 'image/jpeg', name: 'profile.jpg' });
    data.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    data.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    let res = await fetch(CLOUDINARY_CONFIG.apiUrl, { method: 'POST', body: data });
    let result = await res.json();
    return result.secure_url || "";
  };

  // --- STANDARD EMAIL REGISTRATION LOGIC ---
  const handleEmailRegister = async () => {
    // 1. Check for empty fields
    if (!image || !firstName || !lastName || !email || !phone || !street || !city || !password || !confirmPassword) { 
      showNotification("Please upload a photo and fill in all fields.", "error"); 
      return; 
    }

    // 2. Name Validation: Letters, spaces, hyphens, and apostrophes only
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      showNotification("Names can only contain letters.", "error");
      return;
    }

    // 3. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification("Please enter a valid email address.", "error");
      return;
    }

    // 4. Philippine Mobile Number Validation
    const cleanPhone = phone.replace(/[\s-]/g, ''); 
    const phPhoneRegex = /^(09|\+639)\d{9}$/; 
    if (!phPhoneRegex.test(cleanPhone)) {
      showNotification("Please enter a valid PH mobile number.", "error");
      return;
    }

    // 5. Street Address Validation: At least 5 characters
    if (street.trim().length < 5) {
      showNotification("Please enter a more complete street address.", "error");
      return;
    }

    // 6. Password Validation
    if (password.length < 6) {
      showNotification("Your password must be at least 6 characters long.", "error");
      return;
    }
    if (password !== confirmPassword) { 
      showNotification("Passwords do not match.", "error"); 
      return; 
    }

    setLoading(true); 
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const profilePicUrl = await uploadImageAsync(image);

      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid, 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        fullName: `${firstName.trim()} ${lastName.trim()}`, 
        email: email.toLowerCase().trim(), 
        phone: cleanPhone, 
        street: street.trim(), 
        city, 
        profilePic: profilePicUrl, 
        role: "user", 
        accountStatus: "Active", 
        provider: "Email", 
        lastOnline: serverTimestamp(), 
        createdAt: serverTimestamp(), 
      });

      showNotification("Welcome to CrayAI!", "success");
      
      // Delay navigation so the user sees the success message
      setTimeout(() => {
        setLoading(false);
        navigation.replace('Home'); // Adjust 'Home' to your main app screen
      }, 1500);

    } catch (error) {
      setLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        showNotification("That email address is already in use.", "error");
      } else {
        showNotification(error.message, "error");
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

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={26} color="#FFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#3D5A80', '#293241']} style={styles.headerSection}>
          <Image source={require('../../assets/crayfish.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandName}>CRAYAI</Text>
          <Text style={styles.tagline}>The Red Claw Community</Text>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.greeting}>Create Account</Text>
          
          <View style={styles.avatarPickerContainer}>
            <TouchableOpacity onPress={showImageOptions} style={styles.avatarHolder}>
              {image ? <Image source={{ uri: image }} style={styles.avatarImage} /> : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera" size={30} color="#3D5A80" />
                  <Text style={styles.avatarText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* --- SOCIAL BUTTONS --- */}
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} 
              disabled={!requestFb}
              onPress={() => promptAsyncFb()}
            >
              <Ionicons name="logo-facebook" size={20} color="#FFF" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialBtn, { backgroundColor: '#DB4437' }]} 
              disabled={!requestGoogle}
              onPress={() => promptAsyncGoogle()}
            >
              <Ionicons name="logo-google" size={20} color="#FFF" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} /><Text style={styles.dividerText}>OR REGISTER WITH EMAIL</Text><View style={styles.dividerLine} />
          </View>

          {/* ... Inputs ... */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Juan" value={firstName} onChangeText={setFirstName} />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} placeholder="Dela Cruz" value={lastName} onChangeText={setLastName} />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="juan@gmail.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="+63 912 345 6789" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Unit/Street, Barangay" value={street} onChangeText={setStreet} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>City</Text>
              <Dropdown
                style={styles.dropdown} placeholderStyle={styles.placeholderStyle} selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle} data={phCities} search maxHeight={300} labelField="label" valueField="value"
                placeholder="Select City" searchPlaceholder="Search..." value={city} onChange={item => setCity(item.value)}
                renderLeftIcon={() => (<Ionicons name="business-outline" size={18} color="#3D5A80" style={{ marginRight: 8 }} />)}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Country</Text>
              <View style={styles.inputWrapper}><TextInput style={styles.input} value={country} editable={false} /></View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••••" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#BDC3C7" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••••" secureTextEntry={!showPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
            </View>
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={handleEmailRegister} disabled={loading}>
            <LinearGradient colors={['#3D5A80', '#293241']} style={styles.btnGradient}>
              {loading ? <ActivityIndicator size="small" color="#FFF" /> : (
                <><Text style={styles.registerBtnText}>CREATE ACCOUNT</Text><Ionicons name="checkmark-circle-outline" size={18} color="#FFF" /></>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginLink}>
            <Text style={styles.alreadyText}>Already a member? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={styles.loginText}>Sign In</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  
  // --- NOTIFICATION STYLES ---
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

  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 25 },
  headerSection: { height: 260, justifyContent: 'center', alignItems: 'center', paddingTop: 30, borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },
  logo: { width: 60, height: 60, tintColor: '#FFF', marginBottom: 10 },
  brandName: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', marginTop: 5, textTransform: 'uppercase' },
  formCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginTop: -40, borderRadius: 25, padding: 25, elevation: 10, shadowColor: '#293241', shadowOpacity: 0.1, shadowRadius: 15 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#293241', marginBottom: 20, textAlign: 'center' },
  avatarPickerContainer: { alignItems: 'center', marginBottom: 20 },
  avatarHolder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ECF0F1', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { alignItems: 'center' },
  avatarText: { fontSize: 10, fontWeight: '800', color: '#3D5A80', marginTop: 5 },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 12, marginHorizontal: 5, gap: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  socialText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ECF0F1' },
  dividerText: { marginHorizontal: 15, fontSize: 11, color: '#BDC3C7', fontWeight: '800', letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 11, fontWeight: '800', color: '#3D5A80', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 15, height: 48, borderWidth: 1, borderColor: '#ECF0F1' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#293241', fontSize: 13, fontWeight: '500' },
  dropdown: { height: 48, backgroundColor: '#F8FAFC', borderColor: '#ECF0F1', borderWidth: 1, borderRadius: 12, paddingHorizontal: 15 },
  placeholderStyle: { fontSize: 13, color: '#BDC3C7' },
  selectedTextStyle: { fontSize: 13, color: '#293241', fontWeight: '500' },
  inputSearchStyle: { height: 40, fontSize: 14, borderRadius: 8 },
  registerBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  btnGradient: { flexDirection: 'row', height: 50, justifyContent: 'center', alignItems: 'center', gap: 10 },
  registerBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  alreadyText: { color: '#7F8C8D', fontSize: 13, fontWeight: '500' },
  loginText: { color: '#3D5A80', fontSize: 13, fontWeight: '800' }
});