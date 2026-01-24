import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown'; // 1. IMPORT DROPDOWN
import { phCities } from '../data/ph_cities';

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(null); // Updated to null for dropdown
  const [country, setCountry] = useState('Philippines');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocus, setIsFocus] = useState(false); // Dropdown focus state

  const handleRegister = () => {
    navigation.replace('Home');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
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
          <Text style={styles.greeting}>Join the Community</Text>
          <Text style={styles.subGreeting}>Connect with crayfish farmers near you</Text>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}>
              <Ionicons name="logo-facebook" size={20} color="#FFF" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#DB4437' }]}>
              <Ionicons name="logo-google" size={20} color="#FFF" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR REGISTER WITH EMAIL</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Juan" placeholderTextColor="#BDC3C7" value={firstName} onChangeText={setFirstName} />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} placeholder="Dela Cruz" placeholderTextColor="#BDC3C7" value={lastName} onChangeText={setLastName} />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="juan@gmail.com" placeholderTextColor="#BDC3C7" value={email} onChangeText={setEmail} keyboardType="email-address" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="+63 912 345 6789" placeholderTextColor="#BDC3C7" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Unit/Street, Barangay" placeholderTextColor="#BDC3C7" value={street} onChangeText={setStreet} />
            </View>
          </View>

          {/* --- 3. UPDATED LOCATION ROW WITH CITY DROPDOWN --- */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>City</Text>
              <Dropdown
                style={[styles.dropdown, isFocus && { borderColor: '#3D5A80' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                data={phCities}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? 'Select City' : '...'}
                searchPlaceholder="Search city..."
                value={city}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                  setCity(item.value);
                  setIsFocus(false);
                }}
                renderLeftIcon={() => (
                  <Ionicons name="business-outline" size={18} color={isFocus ? '#3D5A80' : '#BDC3C7'} style={{ marginRight: 8 }} />
                )}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Country</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={country} editable={false} />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#BDC3C7" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#BDC3C7" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#BDC3C7" secureTextEntry={!showPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
            </View>
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
            <LinearGradient colors={['#3D5A80', '#293241']} style={styles.btnGradient}>
              <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginLink}>
            <Text style={styles.alreadyText}>Already a member? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 25 },
  headerSection: { height: 260, justifyContent: 'center', alignItems: 'center', paddingTop: 30, borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },
  logo: { width: 60, height: 60, tintColor: '#FFF', marginBottom: 10 },
  brandName: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', marginTop: 5, textTransform: 'uppercase' },
  formCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginTop: -40, borderRadius: 25, padding: 25, elevation: 10, shadowColor: '#293241', shadowOpacity: 0.1, shadowRadius: 15 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#293241', marginBottom: 5, textAlign: 'center' },
  subGreeting: { fontSize: 13, color: '#7F8C8D', marginBottom: 20, textAlign: 'center' },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 45, borderRadius: 12, marginHorizontal: 5, gap: 8 },
  socialText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#ECF0F1' },
  orText: { marginHorizontal: 10, fontSize: 11, color: '#BDC3C7', fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 11, fontWeight: '800', color: '#3D5A80', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 15, height: 48, borderWidth: 1, borderColor: '#ECF0F1' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#293241', fontSize: 13, fontWeight: '500' },
  
  // --- DROPDOWN STYLES ---
  dropdown: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderColor: '#ECF0F1',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
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