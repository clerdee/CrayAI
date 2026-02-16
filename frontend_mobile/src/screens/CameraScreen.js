import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, 
  Modal, ScrollView, ActivityIndicator, Animated, Vibration, Easing, Image
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Import the AI CLIENT (Points to Port 5001)
import { aiClient } from '../api/client'; 

const { width, height } = Dimensions.get('window');
const SCAN_WIDTH = width * 0.75;
const SCAN_HEIGHT = height * 0.55;

// CONFIGURATION
const SAMPLES_NEEDED = 3; 
const MODES = ['SCAN', 'PHOTO', 'VIDEO'];

export default function CameraScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState('SCAN'); 

  // Video State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Scan State
  const [scanStatus, setScanStatus] = useState('searching'); 
  const [isScanningLoop, setIsScanningLoop] = useState(false);
  const [liveMask, setLiveMask] = useState(null);
  
  // Custom Error Modal State
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  
  // Buffer stores measurements and latest algae data
  const scanBuffer = useRef({ 
    widths: [], 
    heights: [], 
    lastImage: null,
    algaeLevel: 0,
    algaeDesc: '' 
  });

  // Animation Values
  const pulseAnim = useRef(new Animated.Value(1)).current; 
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null); 
  
  // Timers to control the scan loop restarts safely
  const timerRef = useRef(null);
  const searchTimerRef = useRef(null);
  const lockTimerRef = useRef(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  // Listen for reset signal from Results Screen or Discard button
  useEffect(() => {
    if (route.params?.resetScan) {
      startScanSequence();
    }
  }, [route.params?.resetScan]);

  // --- ANIMATION CONTROLLER ---
  const startAnimations = () => {
    pulseAnim.setValue(1);
    scanLineAnim.setValue(0);

    Animated.loop(
      Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    scanLineAnim.stopAnimation();
  };

  // --- SEQUENCE CONTROLLER ---
  const startScanSequence = () => {
    clearTimeout(searchTimerRef.current);
    clearTimeout(lockTimerRef.current);

    setScanStatus('searching');
    setIsScanningLoop(false);
    setLiveMask(null);
    setErrorModalVisible(false);
    
    // Reset buffer for a fresh scan
    scanBuffer.current = { widths: [], heights: [], lastImage: null, algaeLevel: 0, algaeDesc: '' };

    startAnimations();

    searchTimerRef.current = setTimeout(() => { 
        setScanStatus('detecting'); 
    }, 1500);

    lockTimerRef.current = setTimeout(() => { 
        setScanStatus('locked');
        Vibration.vibrate(50);
        performScanLoop(0); 
    }, 3500);
  };

  // --- SCANNING LOGIC ---
  const performScanLoop = async (currentCount = 0) => {
    if (!cameraRef.current) return;

    setScanStatus(`SCANNING ${currentCount + 1}/${SAMPLES_NEEDED}`);
    setIsScanningLoop(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.4, 
          base64: false,
          skipProcessing: true 
      });

      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'scan.jpg',
      });

      const response = await aiClient.post('/measure', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data, 
      });

      const data = response.data;

      // --- ENFORCED: NO CRAYFISH DETECTED LOGIC ---
      if (data.success === false || !data.measurements || data.measurements.length === 0) {
        if (data.image) {
          setLiveMask(`data:image/jpeg;base64,${data.image}`);
        }

        setIsScanningLoop(false);
        stopAnimations(); 
        Vibration.vibrate(400); 

        setTimeout(() => {
          setErrorModalVisible(true);
        }, 500); 

        return; // HALT THE PROCESS IMMEDIATELY
      }

      // --- CRAYFISH FOUND ---
      if (data.image) {
          setLiveMask(`data:image/jpeg;base64,${data.image}`);
      }

      // Capture algae data from the frame
      scanBuffer.current.algaeLevel = data.algae_level;
      scanBuffer.current.algaeDesc = data.algae_desc;

      const target = data.measurements.find(m => m.type === 'target');

      if (target) {
        scanBuffer.current.widths.push(target.width_cm);
        scanBuffer.current.heights.push(target.height_cm);
        scanBuffer.current.lastImage = `data:image/jpeg;base64,${data.image}`; 
        
        if (scanBuffer.current.widths.length >= SAMPLES_NEEDED) {
           finishScanning();
           return;
        }
        
        performScanLoop(scanBuffer.current.widths.length);
      } else {
        // If success returned but no target found, treat as failure
        setIsScanningLoop(false);
        setErrorModalVisible(true);
      }

    } catch (error) {
      console.error("Scan Error:", error);
      setIsScanningLoop(false);
      setLiveMask(null);
      stopAnimations();
      setErrorModalVisible(true);
    }
  };

  const finishScanning = () => {
    // SECURITY CHECK: Don't navigate if the buffer is empty
    if (scanBuffer.current.widths.length === 0) {
        setErrorModalVisible(true);
        return;
    }

    Vibration.vibrate([0, 50, 100, 50]); 
    stopAnimations();
    
    const widths = scanBuffer.current.widths;
    const heights = scanBuffer.current.heights;
    const avgW = widths.reduce((a, b) => a + b, 0) / widths.length;
    const avgH = heights.reduce((a, b) => a + b, 0) / heights.length;
    
    navigation.navigate('Results', { 
        imageUri: scanBuffer.current.lastImage, 
        type: 'image',
        measurements: [{ width_cm: parseFloat(avgW.toFixed(2)), height_cm: parseFloat(avgH.toFixed(2)) }], 
        algae_level: scanBuffer.current.algaeLevel,
        algae_desc: scanBuffer.current.algaeDesc
    });

    setIsScanningLoop(false);
    setScanStatus('locked');
    scanBuffer.current = { widths: [], heights: [], lastImage: null, algaeLevel: 0, algaeDesc: '' };
  };

  const handleRetryScan = () => {
    setErrorModalVisible(false); 
    setLiveMask(null); 
    startScanSequence(); 
  };

  // --- LIFECYCLE CONTROLS ---
  useEffect(() => {
    if (selectedMode === 'SCAN') {
      startScanSequence(); 
    } else {
      setScanStatus('idle');
      clearTimeout(searchTimerRef.current);
      clearTimeout(lockTimerRef.current);
      stopAnimations();
    }
    
    return () => {
        clearTimeout(searchTimerRef.current);
        clearTimeout(lockTimerRef.current);
        stopAnimations();
    };
  }, [selectedMode]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, 
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      navigation.navigate('Results', { imageUri: result.assets[0].uri, type: 'image' });
    }
  };

  const handleManualCapture = async () => {
    if (!cameraRef.current || isScanningLoop) return;

    if (selectedMode === 'PHOTO') {
       const photo = await cameraRef.current.takePictureAsync();
       navigation.navigate('Results', { imageUri: photo.uri, type: 'image' });
    } else if (selectedMode === 'SCAN') {
       startScanSequence();
    }
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCAN_HEIGHT/2.2, SCAN_HEIGHT/2.2]
  });

  if (!permission || !permission.granted) return <View style={styles.blackBg} />;

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <CameraView 
        ref={cameraRef} 
        style={StyleSheet.absoluteFillObject} 
        facing="back" 
        enableTorch={flashMode}
        mode={selectedMode === 'VIDEO' ? 'video' : 'picture'}
      >
        
        {/* LIVE MASK OVERLAY */}
        {liveMask && (isScanningLoop || errorModalVisible) && (
            <Image 
                source={{ uri: liveMask }} 
                style={[StyleSheet.absoluteFillObject, { opacity: 0.8 }]} 
                resizeMode="contain" 
            />
        )}

        {/* --- REINFORCED ERROR MODAL --- */}
        {errorModalVisible && (
            <View style={styles.customErrorOverlay}>
                <View style={styles.errorCard}>
                    <View style={styles.errorIconBg}>
                        <Ionicons name="warning-outline" size={40} color="#FF4757" />
                    </View>
                    <Text style={styles.errorTitle}>Detection Failed</Text>
                    <Text style={styles.errorDesc}>
                        We couldn't find a crayfish in the frame. Please adjust your camera and ensure the subject is clearly visible from 6 inches.
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetryScan}>
                        <Ionicons name="refresh" size={20} color="#FFF" />
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}

        {selectedMode === 'SCAN' && !errorModalVisible && (
          <View style={styles.scanLayer}>
            <View style={styles.scanBox}>
               {!liveMask && (
                 <>
                   <View style={[styles.corner, styles.tl]} />
                   <View style={[styles.corner, styles.tr]} />
                   <View style={[styles.corner, styles.bl]} />
                   <View style={[styles.corner, styles.br]} />
                 </>
               )}

               {!liveMask && scanStatus !== 'locked' && (
                   <Animated.View style={[styles.laserLine, { transform: [{ translateY: scanLineTranslateY }] }]} />
               )}

               {!liveMask && (
                   <Animated.View style={[styles.centerTarget, { transform: [{ scale: pulseAnim }] }]}>
                      {scanStatus.includes('SCANNING') ? (
                           <ActivityIndicator size="large" color="#4CC9F0" />
                      ) : (
                           scanStatus === 'searching' ? <Ionicons name="scan" size={48} color="rgba(255,255,255,0.7)" /> :
                           scanStatus === 'detecting' ? <Ionicons name="aperture" size={54} color="#FFD166" /> :
                           <Ionicons name="checkmark-circle" size={80} color="#06D6A0" />
                      )}
                   </Animated.View>
               )}
            </View>
            
            <View style={styles.statusContainer}>
              <View style={[
                  styles.statusBadge, 
                  (scanStatus === 'locked' || scanStatus.includes('SCANNING')) ? styles.statusLocked : styles.statusActive
              ]}>
                <Text style={styles.statusText}>
                  {scanStatus === 'searching' ? 'LOCATING SUBJECT...' : 
                   scanStatus === 'detecting' ? 'HOLD STEADY' : 
                   scanStatus}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.blurBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFlashMode(!flashMode)} style={styles.blurBtn}>
                <Ionicons name={flashMode ? "flash" : "flash-off"} size={22} color="#FFF" />
            </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
             <View style={styles.modeRow}>
                {MODES.map((m) => (
                  <TouchableOpacity 
                    key={m} 
                    onPress={() => !isScanningLoop && setSelectedMode(m)}
                    style={[styles.modeItem, selectedMode === m && styles.modeItemActive]}
                  >
                    <Text style={[styles.modeLabel, selectedMode === m && styles.activeModeLabel]}>{m}</Text>
                  </TouchableOpacity>
                ))}
             </View>

             <View style={styles.actionRow}>
                <TouchableOpacity onPress={pickImage} style={styles.sideActionBtn}>
                    <Ionicons name="images-outline" size={26} color="#FFF" />
                </TouchableOpacity>
                
                <View style={styles.shutterContainer}>
                   <TouchableOpacity onPress={() => startScanSequence()} disabled={isScanningLoop}>
                      <View style={[styles.scanPlaceholder, isScanningLoop && {borderColor: '#4CC9F0'}]}>
                         <MaterialCommunityIcons name="robot-outline" size={32} color={isScanningLoop ? "#4CC9F0" : "rgba(255,255,255,0.3)"} />
                      </View>
                   </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.sideActionBtn}>
                    <Ionicons name="help-circle-outline" size={28} color="#FFF" />
                </TouchableOpacity>
             </View>
        </View>

        {/* GUIDE MODAL */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={{flex:1}} onPress={() => setModalVisible(false)} />
            <View style={styles.modalSheet}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Scan Guide</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close-circle" size={30} color="#E5E5E5" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.guideStep}>
                   <View style={styles.stepIconContainer}>
                      <MaterialCommunityIcons name="hand-back-left" size={28} color="#4CC9F0" />
                   </View>
                   <View style={styles.stepTextContainer}>
                      <Text style={styles.stepHeader}>1. Anchor Gesture</Text>
                      <Text style={styles.stepDesc}>Place your middle finger on the surface and rest your phone on your extended thumb (~6 inches) for calibration.</Text>
                   </View>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.primaryBtnText}>I'm Ready</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  blackBg: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000' },
  
  // Custom Error Modal Styles
  customErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  errorCard: {
    backgroundColor: '#1E1E1E',
    width: width * 0.85,
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.4)',
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  errorIconBg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 10 },
  errorDesc: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  retryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF4757', paddingVertical: 16, paddingHorizontal: 30,
    borderRadius: 20, width: '100%', gap: 10,
  },
  retryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  // Scan Layer Styles
  scanLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanBox: { width: SCAN_WIDTH, height: SCAN_HEIGHT, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 35, height: 35, borderColor: '#FFF', borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 15 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 15 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 15 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 15 },
  
  laserLine: { 
      width: '110%', 
      height: 3, 
      backgroundColor: '#4CC9F0', 
      shadowColor: '#4CC9F0', 
      shadowOpacity: 1, 
      shadowRadius: 15, 
      elevation: 10 
  },
  
  centerTarget: { position: 'absolute' },
  statusContainer: { position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 35 },
  statusActive: { backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statusLocked: { backgroundColor: '#06D6A0' },
  statusText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  
  header: { position: 'absolute', top: 60, left: 25, right: 25, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  blurBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.9)', borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingBottom: 50, paddingTop: 20 },
  modeRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 25, gap: 25 },
  modeItem: { paddingVertical: 8, paddingHorizontal: 15 },
  modeItemActive: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  modeLabel: { color: '#666', fontSize: 14, fontWeight: '700' },
  activeModeLabel: { color: '#FFF' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  sideActionBtn: { width: 55, height: 55, justifyContent: 'center', alignItems: 'center', borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  shutterContainer: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center' },
  scanPlaceholder: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30 },
  dragHandle: { width: 50, height: 5, backgroundColor: '#333', borderRadius: 3, alignSelf: 'center', marginBottom: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  modalCloseBtn: { opacity: 0.8 },
  modalBody: { marginBottom: 15 },
  guideStep: { flexDirection: 'row', marginBottom: 30, gap: 15 },
  stepIconContainer: { width: 55, height: 55, borderRadius: 28, backgroundColor: 'rgba(76, 201, 240, 0.1)', justifyContent: 'center', alignItems: 'center' },
  stepTextContainer: { flex: 1, justifyContent: 'center' },
  stepHeader: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 5 },
  stepDesc: { fontSize: 15, color: '#AAA', lineHeight: 22 },
  primaryBtn: { backgroundColor: '#4CC9F0', paddingVertical: 18, borderRadius: 22, alignItems: 'center', marginTop: 15 },
  primaryBtnText: { color: '#000', fontSize: 18, fontWeight: '800' },
});