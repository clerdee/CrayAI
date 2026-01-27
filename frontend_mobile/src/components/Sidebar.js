import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, Dimensions, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Firebase Imports
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // <--- CHANGED: Imported onSnapshot
import { auth, db } from '../config/firebase'; 

const { width } = Dimensions.get('window');

export default function Sidebar({ visible, onClose }) {
  const navigation = useNavigation();
  
  // Real Firebase State
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let unsubscribeSnapshot = () => {}; // Helper to clean up the data listener

    // 1. Listen for Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Clean up previous data listener if auth state changes
      unsubscribeSnapshot(); 

      if (user) {
        // 2. REAL-TIME LISTENER (Instead of getDoc)
        // This will fire every time the database document updates
        const userRef = doc(db, "users", user.uid);
        
        unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
        }, (error) => {
            console.error("Error fetching user data:", error);
        });
        
      } else {
        setUserData(null);
      }
    });

    // Cleanup when the Sidebar unmounts
    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  // --- LOGOUT LOGIC WITH NOTIFICATION ---
  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out of the community?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              onClose(); // Close sidebar
              
              // SUCCESS NOTIFICATION
              Alert.alert("Logged Out", "You have successfully signed out of CrayAI.");
              
            } catch (error) {
              console.error("Logout Error:", error);
              Alert.alert("Error", "Could not log out. Please check your connection.");
            }
          }
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={onClose}>
      <View style={styles.drawerCard}>
        
        {/* PROFILE HEADER - Colors change based on status */}
        <LinearGradient 
          colors={currentUser ? ['#3D5A80', '#293241'] : ['#98C1D9', '#3D5A80']} 
          style={styles.profileHeader}
        >
          <View style={styles.avatarWrapper}>
            <Image 
              source={userData?.profilePic ? { uri: userData.profilePic } : require('../../assets/profile-icon.png')} 
              style={[styles.profilePic, !currentUser && { tintColor: '#3D5A80', opacity: 0.5 }]} 
            />
          </View>
          <Text style={styles.userName}>
            {currentUser ? (userData?.fullName || "Researcher") : "Guest Researcher"}
          </Text>
          <Text style={styles.userRole}>
            {currentUser ? (userData?.role || "Authorized User") : "System Locked"}
          </Text>
        </LinearGradient>

        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {!currentUser ? (
            /* GUEST VIEW */
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
              
              <View style={styles.divider} />
              <TouchableOpacity style={styles.guestLink}>
                <Text style={styles.guestLinkText}>Trouble signing in? Contact Admin</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* AUTHENTICATED VIEW */
            <View>
              <Text style={styles.sectionTitle}>General</Text>
              
              {/* 1. View Profile */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('Profile'); }}>
                <View style={styles.iconCircle}><Ionicons name="person-outline" size={20} color="#3D5A80" /></View>
                <Text style={styles.menuLabel}>Your Profile</Text>
              </TouchableOpacity>

              {/* 2. Edit Profile */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('EditProfile'); }}>
                <View style={styles.iconCircle}><Ionicons name="create-outline" size={20} color="#3D5A80" /></View>
                <Text style={styles.menuLabel}>Edit Profile</Text>
              </TouchableOpacity>

              {/* 3. Security Settings */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('SecuritySettings'); }}>
                <View style={styles.iconCircle}><Ionicons name="shield-checkmark-outline" size={20} color="#3D5A80" /></View>
                <Text style={styles.menuLabel}>Security Settings</Text>
              </TouchableOpacity>

              {/* 4. Email Preferences */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('EmailPreferences'); }}>
                <View style={styles.iconCircle}><Ionicons name="mail-outline" size={20} color="#3D5A80" /></View>
                <Text style={styles.menuLabel}>Email Preferences</Text>
              </TouchableOpacity>

              <View style={styles.divider} />
              
              {/* 5. Sign Out */}
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
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
  guestLink: { marginTop: 10, alignItems: 'center' },
  guestLinkText: { fontSize: 12, color: '#BDC3C7', fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#BDC3C7', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F4F7F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: '#293241' },
  divider: { height: 1, backgroundColor: '#F4F7F9', marginVertical: 20 },
});