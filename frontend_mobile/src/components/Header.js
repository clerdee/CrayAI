import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Header({ onProfilePress, title = "CRAYAI", context = "Home" }) {
  const [modalVisible, setModalVisible] = useState(false);

  // CHANGED: Content now represents FAQs (Question/Answer) instead of generic tips
  const tips = {
    Home: [
      { t: 'How do I start scanning?', d: 'Tap the "Quick Scan" banner or the camera icon to begin AI classification.', icon: 'scan-circle-outline' },
      { t: 'Where are my results?', d: 'Your recent scans are saved automatically in the "History" section below.', icon: 'time-outline' }
    ],
    Community: [
      { t: 'How do I post?', d: 'Tap the (+) button to share your crayfish findings with other researchers.', icon: 'add-circle-outline' },
      { t: 'Why was my post removed?', d: 'Our AI filters harassing language. Please keep discussions respectful.', icon: 'shield-half-outline' }
    ],
    Chat: [
      { t: 'Why can\'t I reply?', d: 'You can only chat with "Mutual Followers". If you don\'t follow each other, check Requests.', icon: 'lock-closed-outline' },
      { t: 'What are Requests?', d: 'Messages from people you don\'t follow appear here for your approval first.', icon: 'mail-unread-outline' }
    ],
    Alerts: [
      { t: 'What notifications appear?', d: 'You will see likes, comments, new followers, and system updates here.', icon: 'notifications-outline' },
      { t: 'How to clear badges?', d: 'Tap on a notification to read it. The red badge count will decrease automatically.', icon: 'checkmark-done-circle-outline' }
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
                {/* CHANGED TITLE TO REFLECT FAQS */}
                <Text style={styles.modalTitle}>Help & FAQs</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeIconBtn}>
                  <Ionicons name="close-circle" size={28} color="#BDC3C7" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {sections.map((s, idx) => (
                  <View key={`${context}-tip-${idx}`} style={styles.instructionStep}>
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
                <Text style={styles.modalCloseBtnText}>GOT IT</Text>
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
            <Ionicons name="help-circle-outline" size={24} color="#FFF" />
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
  
  iconContainer: { 
    width: 38, 
    height: 38, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 18, 
    marginTop: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#3D5A80', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: '#546E7A', lineHeight: 20 },
  modalCloseBtn: { backgroundColor: '#3D5A80', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  modalCloseBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});