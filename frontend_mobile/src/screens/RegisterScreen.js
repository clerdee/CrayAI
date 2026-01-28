import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown'; 
import * as ImagePicker from 'expo-image-picker';

// --- NEW BACKEND IMPORT ---
import client from '../api/client'; 

// Cloudinary Imports (Keep this for now to generate the image URL)
import { CLOUDINARY_CONFIG } from '../config/cloudinary';
import { phCities } from '../data/ph_cities';

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
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // --- IMAGE PICKING LOGIC ---
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

  // ==========================================
  // NEW MERN REGISTRATION LOGIC
  // ==========================================
  const handleEmailRegister = async () => {
    // 1. Validation
    if (!image || !firstName || !lastName || !email || !phone || !street || !city || !password || !confirmPassword) { 
      showNotification("Please upload a photo and fill in all fields.", "error"); 
      return; 
    }

    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      showNotification("Names can only contain letters.", "error");
      return;
    }

    // Basic Email Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification("Please enter a valid email address.", "error");
      return;
    }

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
      // 2. Upload Image First (Frontend Upload)
      // Note: In a full production app, you might send the file to backend, 
      // but keeping frontend upload is faster for this transition.
      const profilePicUrl = await uploadImageAsync(image);

      if (!profilePicUrl) {
        throw new Error("Failed to upload image. Please try again.");
      }

      // 3. Call The Node.js Backend
      // We send email/pass to trigger OTP generation
      const response = await client.post('/auth/signup', {
        email: email,
        password: password
      });

      // 4. Success Handling
      if (response.status === 201) {
        showNotification("Verification code sent!", "success");
        
        // 5. Navigate to OTP Screen
        // IMPORTANT: We pass the extra profile data to the next screen
        // so we can save it to the database AFTER verification.
        setTimeout(() => {
          setLoading(false);
          navigation.navigate('VerifyOtpScreen', { 
            email: email,
            profileData: {
              firstName,
              lastName,
              phone,
              street,
              city,
              country,
              profilePic: profilePicUrl
            }
          });
        }, 1000);
      }

    } catch (error) {
      setLoading(false);
      console.log('Registration Error:', error);
      
      if (error.response) {
        // Backend returned an error message (like "User already exists")
        showNotification(error.response.data.message, "error");
      } else if (error.request) {
        // Network error (Server might be down or IP is wrong)
        showNotification("Could not connect to server. Check your internet or IP config.", "error");
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