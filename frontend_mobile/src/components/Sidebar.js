import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, Dimensions, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native'; // 1. IMPORT THIS HOOK

const { width } = Dimensions.get('window');

export default function Sidebar({ visible, onClose }) {
  const navigation = useNavigation(); // 2. INITIALIZE THE HOOK
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  if (!visible) return null;

  return (
    <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={onClose}>
      <View style={styles.drawerCard}>
        
        <LinearGradient 
          colors={isLoggedIn ? ['#3D5A80', '#293241'] : ['#98C1D9', '#3D5A80']} 
          style={styles.profileHeader}
        >
          <View style={styles.avatarWrapper}>
            <Image 
              source={require('../../assets/profile-icon.png')} 
              style={[styles.profilePic, !isLoggedIn && { tintColor: '#3D5A80', opacity: 0.5 }]} 
            />
          </View>
          <Text style={styles.userName}>{isLoggedIn ? "Hanna Clerdee" : "Guest Researcher"}</Text>
          <Text style={styles.userRole}>{isLoggedIn ? "Lead Researcher" : "System Locked"}</Text>
        </LinearGradient>

        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {!isLoggedIn ? (
            <View style={styles.authContainer}>
              <Text style={styles.authDesc}>
                Access the full CrayAI Research Suite by signing into your account.
              </Text>

              {/* 3. NAVIGATION CALLS WILL NOW WORK PERFECTLY */}
              <TouchableOpacity 
                style={[styles.authBtn, { backgroundColor: '#3D5A80' }]}
                onPress={() => { 
                  onClose(); 
                  navigation.navigate('Login'); 
                }}
              >
                <Ionicons name="log-in-outline" size={20} color="#FFF" />
                <Text style={styles.authBtnText}>LOGIN</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.authBtn, { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#3D5A80' }]}
                onPress={() => { 
                  onClose(); 
                  navigation.navigate('Register'); 
                }}
              >
                <Ionicons name="person-add-outline" size={20} color="#3D5A80" />
                <Text style={[styles.authBtnText, { color: '#3D5A80' }]}>CREATE ACCOUNT</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              <TouchableOpacity style={styles.guestLink}>
                <Text style={styles.guestLinkText}>Trouble signing in? Contact Admin</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>General</Text>
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.iconCircle}><Ionicons name="person-outline" size={20} color="#3D5A80" /></View>
                <Text style={styles.menuLabel}>Researcher Profile</Text>
              </TouchableOpacity>
              {/* Add more researcher links here... */}
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
  profilePic: { width: '80%', height: '80%', borderRadius: 45 },
  userName: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  userRole: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },

  menuScroll: { flex: 1, padding: 25 },
  
  // Auth Section Styles
  authContainer: { marginTop: 10 },
  authDesc: { fontSize: 14, color: '#7F8C8D', lineHeight: 22, marginBottom: 30, textAlign: 'center' },
  authBtn: { flexDirection: 'row', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15, gap: 10 },
  authBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  guestLink: { marginTop: 10, alignItems: 'center' },
  guestLinkText: { fontSize: 12, color: '#BDC3C7', fontWeight: '600' },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#BDC3C7', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F4F7F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: '#293241' },
  divider: { height: 1, backgroundColor: '#F4F7F9', marginVertical: 20 },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 25, borderTopWidth: 1, borderTopColor: '#F4F7F9' },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#E76F51', marginLeft: 10 }
});