import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // Logic for authentication goes here
    navigation.replace('Home');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* 1. EXIT BUTTON - Positioned absolutely to stay on top of the gradient */}
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 2. TOP BRANDING SECTION */}
        <LinearGradient colors={['#293241', '#3D5A80']} style={styles.headerSection}>
          <Image 
            source={require('../../assets/crayfish.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.brandName}>CRAYAI</Text>
          <Text style={styles.tagline}>Automated Crayfish Profiling System</Text>
        </LinearGradient>

        {/* 3. LOGIN FORM CARD */}
        <View style={styles.formCard}>
          <Text style={styles.greeting}>Welcome Back</Text>
          <Text style={styles.subGreeting}>Sign in to access your data</Text>

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
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

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
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#BDC3C7" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Credentials?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <LinearGradient colors={['#3D5A80', '#293241']} style={styles.btnGradient}>
              <Text style={styles.loginBtnText}>SIGN IN</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.registerLink}>
            <Text style={styles.noAccountText}>New to the system? </Text>
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
  
  // New Close Button Styles
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },

  headerSection: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  logo: { width: 80, height: 80, tintColor: '#FFF', marginBottom: 15 },
  brandName: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 5, textTransform: 'uppercase' },

  formCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 25,
    marginTop: -50,
    borderRadius: 30,
    padding: 30,
    elevation: 10,
    shadowColor: '#293241',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    marginBottom: 40,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#293241', marginBottom: 5 },
  subGreeting: { fontSize: 14, color: '#7F8C8D', marginBottom: 30 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', color: '#3D5A80', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#293241', fontSize: 14, fontWeight: '500' },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: '#3D5A80', fontSize: 13, fontWeight: '700' },

  loginBtn: { borderRadius: 15, overflow: 'hidden', elevation: 5 },
  btnGradient: { 
    flexDirection: 'row', 
    height: 55, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 10 
  },
  loginBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },

  registerLink: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 25 
  },
  noAccountText: { color: '#7F8C8D', fontSize: 14, fontWeight: '500' },
  registerText: { color: '#3D5A80', fontSize: 14, fontWeight: '800' }
});