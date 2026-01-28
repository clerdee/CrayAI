import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// API Import
import client from '../api/client';

export default function SecuritySettingsScreen({ navigation }) {
  // Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Custom Notification Handler
  const showNotification = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

const handleChangePassword = async () => {
    // 1. Basic Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification("Please fill in all password fields.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification("New passwords do not match.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showNotification("New password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);

    try {
      // 2. Call Backend API
      const res = await client.post('/auth/change-password', {
        currentPassword: currentPassword,
        newPassword: newPassword
      });

      if (res.data && res.data.success) {
        // 3. Success handling
        showNotification("Password updated successfully!", "success");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }

    } catch (error) {
      console.error('Change password error:', error);
      if (error.response?.status === 401) {
        showNotification("Incorrect current password.", "error");
      } else {
        showNotification(error.response?.data?.message || "Failed to update password. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- NOTIFICATION BANNER --- */}
      {message.text !== '' && (
        <View style={[styles.notification, message.type === 'error' ? styles.errorBg : styles.successBg]}>
          <Ionicons name={message.type === 'error' ? "alert-circle" : "checkmark-circle"} size={20} color="#FFF" />
          <Text style={styles.notificationText}>{message.text}</Text>
        </View>
      )}

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#293241" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* --- SECURITY ILLUSTRATION (Optional header icon) --- */}
        <View style={styles.iconSection}>
          <View style={styles.iconHolder}>
            <Ionicons name="shield-checkmark" size={60} color="#3D5A80" />
          </View>
          <Text style={styles.subHeaderText}>Keep your CrayAI account secure by updating your password regularly.</Text>
        </View>

        {/* --- FORM CARD --- */}
        <View style={styles.formCard}>
          
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                secureTextEntry={!showCurrent}
                value={currentPassword} 
                onChangeText={setCurrentPassword} 
                placeholder="Enter current password"
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color="#7F8C8D" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                secureTextEntry={!showNew}
                value={newPassword} 
                onChangeText={setNewPassword} 
                placeholder="Enter new password"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#7F8C8D" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="checkmark-done-outline" size={18} color="#3D5A80" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                secureTextEntry={!showNew}
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                placeholder="Confirm new password"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
            <LinearGradient colors={['#3D5A80', '#293241']} style={styles.btnGradient}>
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text style={styles.saveBtnText}>UPDATE PASSWORD</Text>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
                </>
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
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20, backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F7F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#293241' },
  iconSection: { alignItems: 'center', marginTop: 30, marginBottom: 20, paddingHorizontal: 30 },
  iconHolder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#293241', shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 15 },
  subHeaderText: { fontSize: 13, color: '#7F8C8D', textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  formCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 25, padding: 25, elevation: 10, shadowColor: '#293241', shadowOpacity: 0.1, shadowRadius: 15 },
  divider: { height: 1, backgroundColor: '#ECF0F1', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 11, fontWeight: '800', color: '#3D5A80', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 15, height: 48, borderWidth: 1, borderColor: '#ECF0F1' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#293241', fontSize: 13, fontWeight: '500' },
  saveBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  btnGradient: { flexDirection: 'row', height: 50, justifyContent: 'center', alignItems: 'center', gap: 10 },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },
  notification: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 30, left: 20, right: 20, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', zIndex: 1000, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  successBg: { backgroundColor: '#2ECC71' },
  errorBg: { backgroundColor: '#E74C3C' },
  notificationText: { color: '#FFF', fontWeight: '700', marginLeft: 10, fontSize: 13 },
});