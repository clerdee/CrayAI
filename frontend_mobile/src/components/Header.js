import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Header({ onProfilePress, title = "CRAYAI", context = "Home" }) {
  const [modalVisible, setModalVisible] = useState(false);

  // Added 'icon' property to each tip object
  const tips = {
    Home: [
      { t: 'Welcome', d: 'Explore analytics and start an AI scan from the banner.', icon: 'rocket-outline' },
      { t: 'Shortcuts', d: 'Use the bottom bar to jump between tabs quickly.', icon: 'layers-outline' }
    ],
    Community: [
      { t: 'Be Respectful', d: 'Share constructively. Avoid bad words and harassment.', icon: 'heart-circle-outline' },
      { t: 'Quality Posts', d: 'Add clear photos or concise notes for better feedback.', icon: 'image-outline' },
      { t: 'Follow & Engage', d: 'Follow researchers and comment with helpful insights.', icon: 'people-outline' }
    ],
    Chat: [
      { t: 'Mutual Follows', d: 'Only mutual followers can chat. Others go to Requests.', icon: 'git-network-outline' },
      { t: 'Stay Kind', d: 'No spam or offensive messages. Keep it professional.', icon: 'shield-checkmark-outline' }
    ],
    Alerts: [
      { t: 'All Interactions', d: 'Likes, comments, follows, and chat updates show here.', icon: 'list-outline' },
      { t: 'Badges', d: 'Watch the alert badge count on the bottom bar.', icon: 'notifications-circle-outline' }
    ]
  };
  
  const sections = tips[context] || tips.Home;

  return (
    <View style={styles.fixedHeader}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        
        {/* --- INTERNAL SYSTEM GUIDE MODAL --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Guides & Tips</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeIconBtn}>
                  <Ionicons name="close-circle" size={28} color="#BDC3C7" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {sections.map((s, idx) => (
                  <View key={`${context}-tip-${idx}`} style={styles.instructionStep}>
                    {/* Render Icon instead of Index Number */}
                    <View style={[styles.iconContainer, {backgroundColor: idx % 2 === 0 ? '#3D5A80' : '#E76F51'}]}>
                      <Ionicons name={s.icon} size={18} color="#FFF" />
                    </View>
                    
                    <View style={styles.stepBody}>
                      <Text style={styles.stepTitle}>{s.t}</Text>
                      <Text style={styles.stepDesc}>{s.d}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseBtnText}>I UNDERSTAND</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* --- HEADER UI (FIXED SPACING) --- */}
        <View style={styles.headerContent}>
          {/* Profile Button - Pushed to Left */}
          <TouchableOpacity style={styles.headerActionBtn} onPress={onProfilePress}>
            <Ionicons name="person-circle-outline" size={28} color="#FFF" />
          </TouchableOpacity>
          
          {/* Logo - Centered */}
          <View style={styles.logoContainer}>
             <Text style={styles.logoTextMain}>
               {title.substring(0, 4)}
               <Text style={styles.logoTextSub}>{title.substring(4)}</Text>
             </Text>
          </View>
          
          {/* Help Button - Pushed to Right */}
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="help-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    backgroundColor: '#3D5A80',
    borderBottomWidth: 3,
    borderBottomColor: '#98C1D9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 8 },
    }),
  },
  headerSafeArea: { width: '100%' },
  headerContent: { 
    height: 60, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 10 
  },
  headerActionBtn: { padding: 5 },
  logoContainer: { 
    position: 'absolute', 
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1 
  },
  logoTextMain: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  logoTextSub: { color: '#98C1D9' },

  // --- Modal Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(41, 50, 65, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '88%', maxHeight: '75%', backgroundColor: '#FFF', borderRadius: 30, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 20, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#293241' },
  closeIconBtn: { padding: 5 },
  modalScroll: { marginBottom: 15 },
  
  instructionStep: { flexDirection: 'row', marginBottom: 24, alignItems: 'flex-start' },
  
  // Renamed from stepNumber to iconContainer for clarity
  iconContainer: { 
    width: 38, 
    height: 38, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 18, 
    marginTop: 2,
    // Added shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 17, fontWeight: '700', color: '#3D5A80', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: '#546E7A', lineHeight: 20 },
  modalCloseBtn: { backgroundColor: '#3D5A80', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  modalCloseBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});