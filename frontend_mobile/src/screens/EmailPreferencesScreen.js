import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  SafeAreaView, Platform, Alert, TextInput, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// API Import
import client from '../api/client';

export default function EmailPreferencesScreen() {
  const navigation = useNavigation();
  const [currentEmail, setCurrentEmail] = useState('');

  // --- STATE ---
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch current email on load
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await client.get('/auth/profile');
        if (res.data && res.data.user) {
          setCurrentEmail(res.data.user.email);
        }
      } catch (error) {
        console.log('Error fetching email:', error);
      }
    };
    fetchEmail();
  }, []);

  // --- REGEX VALIDATION HELPER ---
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // --- LOGIC: UPDATE EMAIL ---
  const handleUpdateEmail = async () => {
    // 1. Basic Validation
    if (!newEmail || !password) {
      Alert.alert("Missing Information", "Please enter a new email address and your current password.");
      return;
    }

    if (!isValidEmail(newEmail)) {
      Alert.alert("Invalid Format", "Please enter a valid email address (e.g., name@example.com).");
      return;
    }

    if (newEmail === currentEmail) {
      Alert.alert("No Change", "The new email is the same as your current email.");
      return;
    }

    setIsUpdatingEmail(true);

    try {
      // 2. Call Backend API to update email
      const res = await client.post('/auth/update-email', {
        newEmail: newEmail,
        password: password
      });

      if (res.data && res.data.success) {
        // 3. Success Alert
        Alert.alert(
          "Verification Sent",
          `We have sent a confirmation email to ${newEmail}.\n\nPlease click the link in that email to finalize the change.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
      
    } catch (error) {
      console.error('Update email error:', error);
      if (error.response?.status === 401) {
        Alert.alert("Incorrect Password", "The password you entered is incorrect.");
      } else if (error.response?.data?.message?.includes('already')) {
        Alert.alert("Email Taken", "This email is already associated with another account.");
      } else {
        Alert.alert("Error", error.response?.data?.message || "Failed to update email. Try again.");
      }
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#293241" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageDescription}>
            Update your account's primary email address. You will need to verify the new email before the change takes effect.
          </Text>

          <View style={styles.card}>
            <Text style={styles.inputLabel}>Current Email</Text>
            <View style={styles.readOnlyContainer}>
              <Ionicons name="mail-outline" size={20} color="#7F8C8D" style={{marginRight: 10}}/>
              <Text style={styles.readOnlyText}>{currentEmail || "Loading..."}</Text>
            </View>
            
            <View style={styles.divider} />

            <Text style={styles.inputLabel}>New Email Address</Text>
            <TextInput 
              style={styles.input}
              placeholder="example@research.com"
              placeholderTextColor="#BDC3C7"
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Confirm Current Password</Text>
            
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.passwordInput}
                placeholder="Required to verify identity"
                placeholderTextColor="#BDC3C7"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#7F8C8D" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.updateButton, (!newEmail || !password) && styles.disabledButton]} 
              onPress={handleUpdateEmail}
              disabled={!newEmail || !password || isUpdatingEmail}
            >
              {isUpdatingEmail ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Send Verification Email</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EDF2F7'
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#293241' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  pageDescription: { fontSize: 14, color: '#7F8C8D', marginBottom: 25, lineHeight: 22 },
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#293241', marginBottom: 8, marginTop: 5 },
  readOnlyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F7F9', padding: 12, borderRadius: 10, marginBottom: 5 },
  readOnlyText: { fontSize: 15, color: '#546E7A', fontWeight: '500' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#293241', marginBottom: 20 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, marginBottom: 20 },
  passwordInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#293241' },
  eyeIcon: { padding: 10, marginRight: 5 },
  updateButton: { backgroundColor: '#3D5A80', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  disabledButton: { backgroundColor: '#B0BEC5', shadowOpacity: 0, elevation: 0 },
  updateButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F4F7F9', marginVertical: 20 },
});