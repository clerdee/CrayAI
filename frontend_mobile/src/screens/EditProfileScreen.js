import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown'; 
import * as ImagePicker from 'expo-image-picker';

// API & Data Imports
import client from '../api/client';
import { phCities } from '../data/ph_cities';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export default function EditProfileScreen({ navigation }) {
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(null);
  const [country, setCountry] = useState('Philippines'); // <--- NEW COUNTRY STATE
  const [bio, setBio] = useState('');
  
  // Image State
  const [currentProfilePic, setCurrentProfilePic] = useState(null); 
  const [newImage, setNewImage] = useState(null); 

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Custom Notification Handler
  const showNotification = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // ==========================================
  // 1. FETCH CURRENT USER DATA ON LOAD
  // ==========================================
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await client.get('/auth/profile');
        if (res.data && res.data.success && res.data.user) {
          const data = res.data.user;
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setPhone(data.phone || '');
          setStreet(data.street || '');
          setCity(data.city || null);
          setCountry(data.country || 'Philippines');
          setCurrentProfilePic(data.profilePic || null);
          setBio(data.bio || '');
        }
      } catch (error) {
        console.log('Error loading profile:', error);
        showNotification("Failed to load profile data.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Image Upload Logic...
  const pickImage = async () => {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setNewImage(result.assets[0].uri);
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
  // 2. STRICT REGEX VALIDATION & SAVE
  // ==========================================
  const handleSave = async () => {
    // REGEX PATTERNS
    const nameRegex = /^[a-zA-ZñÑ\s-]{2,40}$/; 
    const phoneRegex = /^(09|\+639)\d{9}$/; 
    const streetRegex = /^[a-zA-Z0-9\s,.#-]{5,100}$/;
    const countryRegex = /^[a-zA-Z\s]{2,50}$/; 
    const bioRegex = /^[^<>{}]*$/;

    // VALIDATION CHECKS
    if (!firstName || !lastName || !phone || !street || !city || !country) {
      showNotification("Please fill in all required fields.", "error");
      return;
    }
    if (!nameRegex.test(firstName.trim())) {
      showNotification("Invalid First Name. Use letters only (Min 2 chars).", "error");
      return;
    }
    if (!nameRegex.test(lastName.trim())) {
      showNotification("Invalid Last Name. Use letters only (Min 2 chars).", "error");
      return;
    }
    if (!bioRegex.test(bio)) {
      showNotification("Bio contains invalid characters (No <>{} tags).", "error");
      return;
    }
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      showNotification("Invalid Mobile Number. Use PH format (e.g. 09171234567).", "error");
      return;
    }
    if (!streetRegex.test(street.trim())) {
      showNotification("Invalid Street. Must be at least 5 characters.", "error");
      return;
    }
    if (!countryRegex.test(country.trim())) {
      showNotification("Invalid Country name. Use letters only.", "error");
      return;
    }

    setSaving(true);
    try {
      let updatedPicUrl = currentProfilePic;

      if (newImage) updatedPicUrl = await uploadImageAsync(newImage);

      // Update via Backend API
      const res = await client.put('/auth/profile/update', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.replace(/\s/g, ''),
        street: street.trim(),
        city: city,
        country: country.trim(),
        profilePic: updatedPicUrl,
        bio: bio.trim(),
      });

      if (res.data && res.data.success) {
        showNotification("Profile updated successfully!", "success");
        
        setTimeout(() => {
          setSaving(false);
          navigation.goBack(); 
        }, 1500);
      }

    } catch (error) {
      setSaving(false);
      console.log('Error saving profile:', error);
      showNotification(error.response?.data?.message || "Failed to save updates. Try again.", "error");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D5A80" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {message.text !== '' && (
        <View style={[styles.notification, message.type === 'error' ? styles.errorBg : styles.successBg]}>
          <Ionicons name={message.type === 'error' ? "alert-circle" : "checkmark-circle"} size={20} color="#FFF" />
          <Text style={styles.notificationText}>{message.text}</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#293241" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* AVATAR */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarHolder}>
            <Image 
              source={{ uri: newImage || currentProfilePic || 'https://via.placeholder.com/150' }} 
              style={styles.avatarImage} 
            />
            <View style={styles.editIconBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="John" />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Doe" />
              </View>
            </View>
          </View>

          {/* BIO FIELD */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio (Optional)</Text>
            <View style={[styles.inputWrapper, styles.bioWrapper]}>
              <TextInput 
                style={[styles.input, styles.bioInput]} 
                value={bio} 
                onChangeText={setBio} 
                multiline={true}
                numberOfLines={3}
                maxLength={150}
                placeholder="Tell the community about yourself..."
              />
            </View>
          </View>

          {/* PHONE */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09XXXXXXXXX" />
            </View>
          </View>

          {/* STREET */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} value={street} onChangeText={setStreet} placeholder="123 Crayfish St." />
            </View>
          </View>

          {/* CITY DROPDOWN & COUNTRY ROW */}
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

            {/* --- NEW COUNTRY FIELD --- */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Country</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="earth-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
                <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Philippines" />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <LinearGradient colors={['#3D5A80', '#293241']} style={styles.btnGradient}>
              {saving ? <ActivityIndicator color="#FFF" /> : (
                <><Text style={styles.saveBtnText}>SAVE CHANGES</Text><Ionicons name="checkmark-circle-outline" size={18} color="#FFF" /></>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7F9' },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20, backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F7F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#293241' },
  avatarSection: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  avatarHolder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFF', elevation: 5, shadowColor: '#293241', shadowOpacity: 0.1, shadowRadius: 10, position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 55 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EE6C4D', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F4F7F9' },
  formCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 25, padding: 25, elevation: 10, shadowColor: '#293241', shadowOpacity: 0.1, shadowRadius: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 11, fontWeight: '800', color: '#3D5A80', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 15, height: 48, borderWidth: 1, borderColor: '#ECF0F1' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#293241', fontSize: 13, fontWeight: '500' },
  
  bioWrapper: { height: 80, alignItems: 'flex-start', paddingTop: 10 },
  bioInput: { textAlignVertical: 'top', height: 60 },

  dropdown: { height: 48, backgroundColor: '#F8FAFC', borderColor: '#ECF0F1', borderWidth: 1, borderRadius: 12, paddingHorizontal: 15 },
  placeholderStyle: { fontSize: 13, color: '#BDC3C7' },
  selectedTextStyle: { fontSize: 13, color: '#293241', fontWeight: '500' },
  inputSearchStyle: { height: 40, fontSize: 14, borderRadius: 8 },
  saveBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  btnGradient: { flexDirection: 'row', height: 50, justifyContent: 'center', alignItems: 'center', gap: 10 },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },
  notification: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 30, left: 20, right: 20, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', zIndex: 1000, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  successBg: { backgroundColor: '#2ECC71' },
  errorBg: { backgroundColor: '#E74C3C' },
  notificationText: { color: '#FFF', fontWeight: '700', marginLeft: 10, fontSize: 13 },
});