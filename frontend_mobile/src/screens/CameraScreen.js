import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, 
  Modal, ScrollView, ActivityIndicator, Animated, Vibration, Easing, Image
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { aiClient } from '../api/client'; 

const { width, height } = Dimensions.get('window');
const SCAN_WIDTH = width * 0.75;
const SCAN_HEIGHT = height * 0.55;
const SAMPLES_NEEDED = 3; 

const MODES = ['SCAN', 'PHOTO'];

export default function CameraScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState('SCAN'); 

  const [scanStatus, setScanStatus] = useState('searching'); 
  const [isScanningLoop, setIsScanningLoop] = useState(false);
  const [liveMask, setLiveMask] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  
  // ADDED: gender and genderConfidence storage
  const scanBuffer = useRef({ 
    widths: [], 
    heights: [], 
    genders: [], // Store genders to find most frequent
    lastImage: null,
    algaeLevel: 0,
    algaeDesc: '',
    turbidityLevel: 2,
    processingTime: 0,
    modelVersion: ''
  });

  const pulseAnim = useRef(new Animated.Value(1)).current; 
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null); 
  const searchTimerRef = useRef(null);
  const lockTimerRef = useRef(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  useEffect(() => {
    if (route.params?.resetScan) {
      if (selectedMode === 'SCAN') startScanSequence();
      else setScanStatus('READY');
    }
  }, [route.params?.resetScan]);

  const startAnimations = () => {
    pulseAnim.setValue(1);
    scanLineAnim.setValue(0);

    Animated.loop(Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
    ])).start();
    
    Animated.loop(Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    scanLineAnim.stopAnimation();
  };

  const startScanSequence = () => {
    clearTimeout(searchTimerRef.current);
    clearTimeout(lockTimerRef.current);
    setScanStatus('searching');
    setIsScanningLoop(false);
    setLiveMask(null);
    setErrorModalVisible(false);
    
    // Reset Buffer
    scanBuffer.current = { 
        widths: [], heights: [], genders: [], 
        lastImage: null, algaeLevel: 0, algaeDesc: '', 
        turbidityLevel: 2, processingTime: 0, modelVersion: '' 
    };

    startAnimations();
    searchTimerRef.current = setTimeout(() => { setScanStatus('detecting'); }, 1500);
    lockTimerRef.current = setTimeout(() => { 
        setScanStatus('locked');
        Vibration.vibrate(50);
        performScanLoop(0); 
    }, 3500);
  };

  const performScanLoop = async (currentCount = 0) => {
    if (!cameraRef.current) return;
    
    setScanStatus(`SCANNING ${currentCount + 1}/${SAMPLES_NEEDED}`);
    setIsScanningLoop(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.4, base64: false, skipProcessing: true });
      const formData = new FormData();
      formData.append('photo', { uri: photo.uri, type: 'image/jpeg', name: 'scan.jpg' });

      const startTimeMs = Date.now();
      const response = await aiClient.post('measure', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data, 
      });
      const endTimeMs = Date.now();
      const timeTakenInSeconds = ((endTimeMs - startTimeMs) / 1000).toFixed(2);

      const data = response.data;

      if (data.success === false || !data.measurements || data.measurements.length === 0) {
        if (data.image) setLiveMask(`data:image/jpeg;base64,${data.image}`);
        handleScanFailure();
        return; 
      }

      if (data.image) setLiveMask(`data:image/jpeg;base64,${data.image}`);

      scanBuffer.current.algaeLevel = data.algae_level;
      scanBuffer.current.algaeDesc = data.algae_desc;
      scanBuffer.current.turbidityLevel = data.turbidity_level || 2; 
      scanBuffer.current.processingTime = timeTakenInSeconds;
      scanBuffer.current.modelVersion = data.model_version || 'Local Fallback';

      const target = data.measurements.find(m => m.type === 'target');

      if (target) {
        scanBuffer.current.widths.push(target.width_cm);
        scanBuffer.current.heights.push(target.height_cm);
        
        // --- FIX: Check both snake_case and camelCase to be safe ---
        const conf = target.gender_confidence || target.genderConfidence || 0;

        // Push object with gender info
        scanBuffer.current.genders.push({ 
            gender: target.gender || "Not Defined", 
            confidence: conf
        });

        scanBuffer.current.lastImage = `data:image/jpeg;base64,${data.image}`; 
        
        if (scanBuffer.current.widths.length >= SAMPLES_NEEDED) {
           finishScanning();
           return;
        }
        performScanLoop(scanBuffer.current.widths.length);
      } else {
        handleScanFailure();
      }

    } catch (error) {
      console.error("Scan Error:", error);
      handleScanFailure();
    }
  };

  const finishScanning = () => {
    if (scanBuffer.current.widths.length === 0) {
        handleScanFailure();
        return;
    }

    Vibration.vibrate([0, 50, 100, 50]); 
    stopAnimations();
    
    const widths = scanBuffer.current.widths;
    const heights = scanBuffer.current.heights;
    const avgW = widths.reduce((a, b) => a + b, 0) / widths.length;
    const avgH = heights.reduce((a, b) => a + b, 0) / heights.length;
    
    // Logic to pick the best gender (pick the one with highest confidence)
    const bestGenderObj = scanBuffer.current.genders.reduce((prev, current) => {
        return (prev.confidence > current.confidence) ? prev : current;
    }, { gender: "Not Defined", confidence: 0 });

    const generatedScanId = `CRY-${Math.floor(Date.now() / 1000)}`;

    navigation.navigate('Results', { 
        imageUri: scanBuffer.current.lastImage, 
        type: 'image',
        measurements: [{ width_cm: parseFloat(avgW.toFixed(2)), height_cm: parseFloat(avgH.toFixed(2)) }], 
        algae_level: scanBuffer.current.algaeLevel,
        algae_desc: scanBuffer.current.algaeDesc,
        turbidity_level: scanBuffer.current.turbidityLevel, 
        processing_time: `${scanBuffer.current.processingTime}s`,
        model_version: scanBuffer.current.modelVersion,
        scan_id: generatedScanId,
        gender: bestGenderObj.gender,            // <--- PASSING GENDER
        gender_confidence: bestGenderObj.confidence // <--- PASSING CONFIDENCE
    });

    setIsScanningLoop(false);
    setScanStatus('locked');
    scanBuffer.current = { widths: [], heights: [], genders: [], lastImage: null, algaeLevel: 0, algaeDesc: '', turbidityLevel: 2, processingTime: 0, modelVersion: '' };
  };

  const takeSinglePhotoAI = async () => {
    if (!cameraRef.current || isScanningLoop) return;
    
    setScanStatus('CAPTURING...');
    setIsScanningLoop(true); 
    setLiveMask(null);
    startAnimations();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.4, base64: false, skipProcessing: true });
      const formData = new FormData();
      formData.append('photo', { uri: photo.uri, type: 'image/jpeg', name: 'photo.jpg' });

      const startTimeMs = Date.now();
      const response = await aiClient.post('measure', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data, 
      });
      const timeTakenInSeconds = ((Date.now() - startTimeMs) / 1000).toFixed(2);
      const data = response.data;

      if (data.success === false || !data.measurements || data.measurements.length === 0) {
        if (data.image) setLiveMask(`data:image/jpeg;base64,${data.image}`);
        handleScanFailure();
        return; 
      }

      const target = data.measurements.find(m => m.type === 'target');
      
      if (target) {
        Vibration.vibrate([0, 50, 100, 50]); 
        stopAnimations();
        setIsScanningLoop(false);

        const generatedScanId = `CRY-${Math.floor(Date.now() / 1000)}`;

        // --- FIX: Check both snake_case and camelCase ---
        const conf = target.gender_confidence || target.genderConfidence || 0;

        navigation.navigate('Results', { 
            imageUri: `data:image/jpeg;base64,${data.image}`, 
            type: 'image',
            measurements: [{ width_cm: parseFloat(target.width_cm.toFixed(2)), height_cm: parseFloat(target.height_cm.toFixed(2)) }], 
            algae_level: data.algae_level,
            algae_desc: data.algae_desc,
            turbidity_level: data.turbidity_level || 2,
            processing_time: `${timeTakenInSeconds}s`,
            model_version: data.model_version || 'Local Fallback',
            scan_id: generatedScanId,
            gender: target.gender || "Not Defined",
            gender_confidence: conf  // <--- FIXED
        });
        setScanStatus('READY');
      } else {
        handleScanFailure();
      }

    } catch (error) {
      console.error("Photo Error:", error);
      handleScanFailure();
    }
  };

  const handleGalleryPick = async () => {
    if (isScanningLoop) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setScanStatus('ANALYZING GALLERY IMAGE...');
      setIsScanningLoop(true); 
      setLiveMask(null);
      startAnimations();

      try {
        const formData = new FormData();
        formData.append('photo', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'gallery.jpg' });

        const startTimeMs = Date.now();
        const response = await aiClient.post('measure', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          transformRequest: (data) => data, 
        });
        
        const timeTakenInSeconds = ((Date.now() - startTimeMs) / 1000).toFixed(2);
        const data = response.data;

        if (data.success === false || !data.measurements || data.measurements.length === 0) {
          if (data.image) setLiveMask(`data:image/jpeg;base64,${data.image}`);
          handleScanFailure();
          return; 
        }

        const target = data.measurements.find(m => m.type === 'target');
        
        if (target) {
          Vibration.vibrate([0, 50, 100, 50]); 
          stopAnimations();
          setIsScanningLoop(false);

          const generatedScanId = `CRY-${Math.floor(Date.now() / 1000)}`;

          // --- FIX: Check both snake_case and camelCase ---
          const conf = target.gender_confidence || target.genderConfidence || 0;

          navigation.navigate('Results', { 
              imageUri: `data:image/jpeg;base64,${data.image}`, 
              type: 'image',
              measurements: [{ width_cm: parseFloat(target.width_cm.toFixed(2)), height_cm: parseFloat(target.height_cm.toFixed(2)) }], 
              algae_level: data.algae_level,
              algae_desc: data.algae_desc,
              turbidity_level: data.turbidity_level || 2,
              processing_time: `${timeTakenInSeconds}s`,
              model_version: data.model_version || 'Local Fallback',
              scan_id: generatedScanId,
              gender: target.gender || "Not Defined",
              gender_confidence: conf // <--- FIXED
          });
          
          if (selectedMode === 'PHOTO') setScanStatus('READY');
          else setScanStatus('searching');

        } else {
          handleScanFailure();
        }

      } catch (error) {
        console.error("Gallery AI Error:", error);
        handleScanFailure();
      }
    }
  };

  const handleScanFailure = () => {
    setIsScanningLoop(false);
    stopAnimations(); 
    Vibration.vibrate(400); 
    setTimeout(() => { setErrorModalVisible(true); }, 500); 
  };

  const handleRetryScan = () => {
    setErrorModalVisible(false); 
    setLiveMask(null); 
    if (selectedMode === 'SCAN') startScanSequence(); 
    else setScanStatus('READY');
  };

  useEffect(() => {
    if (selectedMode === 'SCAN') { 
        startScanSequence(); 
    } else {
      setScanStatus('READY');
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

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCAN_HEIGHT/2.2, SCAN_HEIGHT/2.2]
  });

  if (!permission || !permission.granted) return <View style={styles.blackBg} />;

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* 1. CameraView closed immediately. No children inside! */}
      <CameraView 
        ref={cameraRef} 
        style={StyleSheet.absoluteFillObject} 
        facing="back" 
        enableTorch={flashMode} 
        mode="picture" 
      />
        
      {/* 2. All overlays are now Siblings, floating on top securely */}
      {liveMask && (isScanningLoop || errorModalVisible) && (
          <Image source={{ uri: liveMask }} style={[StyleSheet.absoluteFillObject, { opacity: 0.8 }]} resizeMode="contain" />
      )}

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

      {!errorModalVisible && (
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

              {!liveMask && scanStatus !== 'locked' && scanStatus !== 'READY' && selectedMode === 'SCAN' && (
                  <Animated.View style={[styles.laserLine, { transform: [{ translateY: scanLineTranslateY }] }]} />
              )}

              {!liveMask && (
                  <Animated.View style={[styles.centerTarget, { transform: [{ scale: pulseAnim }] }]}>
                    {scanStatus.includes('SCANNING') || scanStatus.includes('CAPTURING') || scanStatus.includes('ANALYZING') ? (
                          <ActivityIndicator size="large" color="#4CC9F0" />
                    ) : (
                          scanStatus === 'searching' ? <Ionicons name="scan" size={48} color="rgba(255,255,255,0.7)" /> :
                          scanStatus === 'detecting' ? <Ionicons name="aperture" size={54} color="#FFD166" /> :
                          scanStatus === 'locked' ? <Ionicons name="checkmark-circle" size={80} color="#06D6A0" /> :
                          <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.5)" /> 
                    )}
                  </Animated.View>
              )}
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, (scanStatus === 'locked' || scanStatus.includes('SCANNING') || scanStatus.includes('CAPTURING') || scanStatus.includes('ANALYZING')) ? styles.statusLocked : styles.statusActive]}>
              <Text style={styles.statusText}>
                {scanStatus === 'searching' ? 'LOCATING SUBJECT...' : scanStatus === 'detecting' ? 'HOLD STEADY' : scanStatus}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.blurBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFlashMode(!flashMode)} style={styles.blurBtn}>
              <Ionicons name={flashMode ? "flash" : "flash-off"} size={22} color="#FFF" />
          </TouchableOpacity>
      </View>

      <View style={styles.footer}>
            <View style={styles.modeRow}>
              {MODES.map((m) => (
                <TouchableOpacity key={m} onPress={() => !isScanningLoop && setSelectedMode(m)} style={[styles.modeItem, selectedMode === m && styles.modeItemActive]}>
                  <Text style={[styles.modeLabel, selectedMode === m && styles.activeModeLabel]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={handleGalleryPick} style={styles.sideActionBtn}>
                  <Ionicons name="images-outline" size={26} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.shutterContainer}>
                  
                  <TouchableOpacity 
                      onPress={() => {
                          if (selectedMode === 'SCAN') startScanSequence();
                          else takeSinglePhotoAI();
                      }} 
                      disabled={isScanningLoop}
                  >
                    <View style={[styles.scanPlaceholder, isScanningLoop && {borderColor: '#4CC9F0'}]}>
                        <MaterialCommunityIcons 
                          name={selectedMode === 'SCAN' ? "robot-outline" : "camera-iris"} 
                          size={32} 
                          color={isScanningLoop ? "#4CC9F0" : "rgba(255,255,255,0.8)"} 
                        />
                    </View>
                  </TouchableOpacity>

              </View>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.sideActionBtn}>
                  <Ionicons name="help-circle-outline" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  blackBg: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000' },
  customErrorOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  errorCard: { backgroundColor: '#1E1E1E', width: width * 0.85, borderRadius: 28, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 71, 87, 0.4)', shadowColor: '#FF4757', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  errorIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 71, 87, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 10 },
  errorDesc: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  retryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF4757', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 20, width: '100%', gap: 10 },
  retryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  scanLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanBox: { width: SCAN_WIDTH, height: SCAN_HEIGHT, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 35, height: 35, borderColor: '#FFF', borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 15 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 15 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 15 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 15 },
  laserLine: { width: '110%', height: 3, backgroundColor: '#4CC9F0', shadowColor: '#4CC9F0', shadowOpacity: 1, shadowRadius: 15, elevation: 10 },
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