import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Header({ onProfilePress, title = "CRAYAI" }) {
  const [modalVisible, setModalVisible] = useState(false);

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
                <Text style={styles.modalTitle}>System Guide</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeIconBtn}>
                  <Ionicons name="close-circle" size={28} color="#BDC3C7" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <View style={styles.instructionStep}>
                  <View style={[styles.stepNumber, {backgroundColor: '#3D5A80'}]}>
                    <Text style={styles.stepText}>1</Text>
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepTitle}>Positioning</Text>
                    <Text style={styles.stepDesc}>Hold the crayfish securely. Ensure the ventral side (belly) is facing the lens.</Text>
                  </View>
                </View>

                <View style={styles.instructionStep}>
                  <View style={[styles.stepNumber, {backgroundColor: '#58D68D'}]}>
                    <Text style={styles.stepText}>2</Text>
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepTitle}>Alignment</Text>
                    <Text style={styles.stepDesc}>Align within the white silhouette guide for best AI accuracy.</Text>
                  </View>
                </View>

                <View style={styles.instructionStep}>
                  <View style={[styles.stepNumber, {backgroundColor: '#F4A261'}]}>
                    <Text style={styles.stepText}>3</Text>
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepTitle}>Result</Text>
                    <Text style={styles.stepDesc}>The system will classify Gender, Size, and Maturity automatically.</Text>
                  </View>
                </View>
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

  // Modal Styles remain the same
  modalOverlay: { flex: 1, backgroundColor: 'rgba(41, 50, 65, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '88%', maxHeight: '75%', backgroundColor: '#FFF', borderRadius: 30, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 20, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#293241' },
  closeIconBtn: { padding: 5 },
  modalScroll: { marginBottom: 15 },
  instructionStep: { flexDirection: 'row', marginBottom: 24, alignItems: 'flex-start' },
  stepNumber: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 18, marginTop: 2 },
  stepText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 17, fontWeight: '700', color: '#3D5A80', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: '#546E7A', lineHeight: 20 },
  modalCloseBtn: { backgroundColor: '#3D5A80', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  modalCloseBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});