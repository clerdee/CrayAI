import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, Dimensions, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// 1. Accepts 'user' (object) and 'onLogout' (function) from Home
export default function Sidebar({ visible, onClose, navigation, user, onLogout }) {
  
  const confirmLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: onLogout
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={onClose}>
      <View style={styles.drawerCard}>
        
        {/* PROFILE HEADER */}
        <LinearGradient 
          colors={user ? ['#3D5A80', '#293241'] : ['#98C1D9', '#3D5A80']} 
          style={styles.profileHeader}
        >
          <View style={styles.avatarWrapper}>
            <Image 
              source={user?.profilePic ? { uri: user.profilePic } : require('../../assets/profile-icon.png')} 
              style={[styles.profilePic, !user && { tintColor: '#3D5A80', opacity: 0.5 }]} 
            />
          </View>
          
          <Text style={styles.userName}>
            {user ? (user.fullName || user.firstName) : "Guest Researcher"}
          </Text>
          <Text style={styles.userRole}>
            {user ? (user.role || "Authorized User") : "Not Logged In"}
          </Text>
        </LinearGradient>

        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          
          {/* GUEST VIEW */}
          {!user ? (
            <View style={styles.authContainer}>
              <Text style={styles.authDesc}>
                Access the full CrayAI Research Suite by signing into your account.
              </Text>

              <TouchableOpacity 
                style={[styles.authBtn, { backgroundColor: '#3D5A80' }]}
                onPress={() => { onClose(); navigation.navigate('Login'); }}
              >
                <Ionicons name="log-in-outline" size={20} color="#FFF" />
                <Text style={styles.authBtnText}>LOGIN</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.authBtn, { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#3D5A80' }]}
                onPress={() => { onClose(); navigation.navigate('Register'); }}
              >
                <Ionicons name="person-add-outline" size={20} color="#3D5A80" />
                <Text style={[styles.authBtnText, { color: '#3D5A80' }]}>CREATE ACCOUNT</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* LOGGED IN VIEW */
            <View>
              <Text style={styles.sectionTitle}>General</Text>
              
              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('Profile'); }}>
                <View style={styles.iconCircle}><Ionicons name="person-outline" size={20} color="#3D5A80" /></View>
                <Text style={styles.menuLabel}>Your Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('EditProfile'); }}>
                <View style={styles.iconCircle}><Ionicons name="create-outline" size={20} color="#3D5A80" /></View>
                <Text style={styles.menuLabel}>Edit Profile</Text>
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Account & Security</Text>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('SecuritySettings'); }}>
                <View style={styles.iconCircle}><Ionicons name="shield-checkmark-outline" size={20} color="#3D5A80" /></View>
                <Text style={styles.menuLabel}>Security Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('EmailPreferences'); }}>
                <View style={styles.iconCircle}><Ionicons name="mail-outline" size={20} color="#3D5A80" /></View>
                <Text style={styles.menuLabel}>Email Preferences</Text>
              </TouchableOpacity>
              
              {/* Other menu items... */}

              <View style={styles.divider} />
              
              <TouchableOpacity style={styles.menuItem} onPress={confirmLogout}>
                <View style={[styles.iconCircle, { backgroundColor: '#FDECEA' }]}><Ionicons name="log-out-outline" size={20} color="#E76F51" /></View>
                <Text style={[styles.menuLabel, { color: '#E76F51' }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(41, 50, 65, 0.5)', zIndex: 1000 },
  drawerCard: { width: width * 0.78, height: '100%', backgroundColor: '#FFF', borderTopRightRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
  profileHeader: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 30, paddingHorizontal: 25, alignItems: 'center' },
  avatarWrapper: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF', padding: 3, marginBottom: 15, justifyContent: 'center', alignItems: 'center' },
  profilePic: { width: '100%', height: '100%', borderRadius: 45 },
  userName: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  userRole: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  menuScroll: { flex: 1, padding: 25 },
  authContainer: { marginTop: 10 },
  authDesc: { fontSize: 14, color: '#7F8C8D', lineHeight: 22, marginBottom: 30, textAlign: 'center' },
  authBtn: { flexDirection: 'row', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15, gap: 10 },
  authBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#BDC3C7', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F4F7F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: '#293241' },
  divider: { height: 1, backgroundColor: '#F4F7F9', marginVertical: 20 },
});