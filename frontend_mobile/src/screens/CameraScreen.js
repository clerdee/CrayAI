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

export default function CameraScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [scanMode, setScanMode] = useState('OVERALL'); // 'OVERALL' or 'ENVIRONMENT'

  const [scanStatus, setScanStatus] = useState('READY'); 
  const [isScanningLoop, setIsScanningLoop] = useState(false);
  const [liveMask, setLiveMask] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

  const [frozenImageUri, setFrozenImageUri] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current; 
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null); 

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  useEffect(() => {
    if (route.params?.resetScan) {
      resetCameraState();
    }
  }, [route.params?.resetScan]);

  const startAnimations = () => {
    pulseAnim.setValue(1);
    scanLineAnim.setValue(0);

    Animated.loop(Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true })
    ])).start();
    
    Animated.loop(Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    scanLineAnim.stopAnimation();
  };

  const resetCameraState = () => {
    setIsScanningLoop(false);
    stopAnimations();
    setLiveMask(null);
    setFrozenImageUri(null);
    setErrorModalVisible(false);
    setScanStatus('READY');
  };

  const handleClose = () => {
    resetCameraState();
    navigation.navigate('Home');
  };

  const captureAndScan = async () => {
    if (!cameraRef.current || isScanningLoop) return;

    setIsScanningLoop(true);
    setScanStatus('CAPTURING...');
    setErrorModalVisible(false);
    setLiveMask(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, base64: false, skipProcessing: true });

      setFrozenImageUri(photo.uri);
      
      Vibration.vibrate(50);
      setScanStatus('ANALYZING...');
      startAnimations(); 

      await processAiScan(photo.uri);

    } catch (error) {
      console.error("Capture Error:", error);
      handleScanFailure();
    }
  };

  const processAiScan = async (photoUri) => {
    try {
      const formData = new FormData();
      formData.append('photo', { uri: photoUri, type: 'image/jpeg', name: 'scan.jpg' });
      
      // CRITICAL: Tells Python whether to look for A5 paper or skip it
      formData.append('mode', scanMode); 

      const startTimeMs = Date.now();
      const response = await aiClient.post('measure', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data, 
      });
      const timeTakenInSeconds = ((Date.now() - startTimeMs) / 1000).toFixed(2);
      const data = response.data;

      if (data.image) setLiveMask(`data:image/jpeg;base64,${data.image}`);

      if (scanMode === 'OVERALL') {
        const target = data.measurements?.find(m => m.type === 'target');
        if (data.success === false || !target) {
          handleScanFailure();
          return;
        }
        finishScanning(data, target, timeTakenInSeconds);
      } else {
        if (data.turbidity_level === undefined || data.algae_level === undefined) {
          handleScanFailure();
          return;
        }
        finishScanning(data, null, timeTakenInSeconds);
      }

    } catch (error) {
      console.error("AI Processing Error:", error);
      handleScanFailure();
    }
  };

  const finishScanning = (data, target, timeTaken) => {
    Vibration.vibrate([0, 50, 100, 50]); 
    stopAnimations();
    setIsScanningLoop(false);
    
    const generatedScanId = `CRY-${Math.floor(Date.now() / 1000)}`;

    // Default to N/A for Environment Scans
    let conf = 0;
    let gender = "N/A";
    let measurements = [];

    // Only populate crayfish data if it's an OVERALL scan and a target was found
    if (scanMode === 'OVERALL' && target) {
      conf = target.gender_confidence || target.genderConfidence || 0;
      gender = target.gender || "Not Defined";
      measurements = [{ 
        width_cm: parseFloat(target.width_cm.toFixed(2)), 
        height_cm: parseFloat(target.height_cm.toFixed(2)) 
      }];
    }

    navigation.navigate('Results', { 
        scanMode: scanMode, 
        imageUri: `data:image/jpeg;base64,${data.image}`, 
        measurements: measurements, 
        algae_level: data.algae_level, 
        algae_desc: data.algae_desc,
        turbidity_level: data.turbidity_level || 2, 
        ai_environment_status: data.ai_environment_status || "No textual analysis provided.",
        processing_time: `${timeTaken}s`,
        model_version: data.model_version || 'Local Fallback',
        scan_id: generatedScanId,
        gender: gender,             
        gender_confidence: conf 
    });

    setFrozenImageUri(null);
    setScanStatus('READY');
  };

  const handleGalleryPick = async () => {
    if (isScanningLoop) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // Ensures the original uncropped picture is selected
      quality: 1,           
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
 
      setFrozenImageUri(selectedUri);
      setLiveMask(null);
      setIsScanningLoop(true);
      setScanStatus('ANALYZING...');
      startAnimations();
      
      await processAiScan(selectedUri);
    }
  };

  const handleScanFailure = () => {
    setIsScanningLoop(false);
    stopAnimations(); 
    Vibration.vibrate(400); 
    setTimeout(() => { setErrorModalVisible(true); }, 500); 
  };

  const handleRetryScan = () => {
    resetCameraState(); 
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCAN_HEIGHT/2.2, SCAN_HEIGHT/2.2]
  });

  if (!permission || !permission.granted) return <View style={styles.blackBg} />;

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* 1. LIVE CAMERA FEED */}
      <CameraView 
        ref={cameraRef} 
        style={StyleSheet.absoluteFillObject} 
        facing="back" 
        enableTorch={flashMode} 
        mode="picture" 
      />
      
      {/* 2. FROZEN SCREENSHOT (Overlays Camera when capturing/analyzing) */}
      {frozenImageUri && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}>
          <Image 
            source={{ uri: frozenImageUri }} 
            style={StyleSheet.absoluteFillObject} 
            resizeMode="contain" // FIXED: Displays the full, uncropped original image
          />
        </View>
      )}
        
      {/* 3. AI RETURNED MASK (Overlays frozen image if AI sends back a marked image) */}
      {liveMask && (isScanningLoop || errorModalVisible) && (
          <Image source={{ uri: liveMask }} style={[StyleSheet.absoluteFillObject, { opacity: 0.8 }]} resizeMode="contain" />
      )}

      {/* ERROR MODAL */}
      {errorModalVisible && (
          <View style={styles.customErrorOverlay}>
              <View style={styles.errorCard}>
                  <View style={styles.errorIconBg}>
                      <Ionicons name="warning-outline" size={40} color="#FF4757" />
                  </View>
                  <Text style={styles.errorTitle}>Detection Failed</Text>
                  <Text style={styles.errorDesc}>
                      {scanMode === 'OVERALL' 
                        ? "We couldn't detect the crayfish or the calibration markers. Please ensure the subject is inside the A5 container and well-lit."
                        : "We couldn't analyze the water quality. Please ensure the image is clear and well-lit."}
                  </Text>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetryScan}>
                      <Ionicons name="refresh" size={20} color="#FFF" />
                      <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
              </View>
          </View>
      )}

      {/* SCANNING UI (Box, Corners, Lasers) */}
      {!errorModalVisible && (
        <View style={styles.scanLayer}>
          <View style={styles.scanBox}>
              
              {/* Only show calibration corners if in OVERALL mode */}
              {!liveMask && scanMode === 'OVERALL' && (
                <>
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                </>
              )}

              {/* Laser Line */}
              {!liveMask && isScanningLoop && (
                  <Animated.View style={[
                    styles.laserLine, 
                    { 
                      transform: [{ translateY: scanLineTranslateY }],
                      backgroundColor: scanMode === 'OVERALL' ? '#0FA958' : '#3D5A80',
                      shadowColor: scanMode === 'OVERALL' ? '#0FA958' : '#3D5A80'
                    }
                  ]} />
              )}

              {/* Center Pulsing Target */}
              {!liveMask && (
                  <Animated.View style={[styles.centerTarget, { transform: [{ scale: pulseAnim }] }]}>
                    {isScanningLoop ? (
                          <ActivityIndicator size="large" color={scanMode === 'OVERALL' ? "#0FA958" : "#3D5A80"} />
                    ) : (
                          <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.5)" /> 
                    )}
                  </Animated.View>
              )}
          </View>
          
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, isScanningLoop ? styles.statusLocked : styles.statusActive]}>
              <Text style={styles.statusText}>{scanStatus}</Text>
            </View>
          </View>
        </View>
      )}

      {/* TOP HEADER CONTROLS */}
      <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.blurBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFlashMode(!flashMode)} style={styles.blurBtn}>
              <Ionicons name={flashMode ? "flash" : "flash-off"} size={22} color="#FFF" />
          </TouchableOpacity>
      </View>

      {/* BOTTOM FOOTER CONTROLS */}
      <View style={styles.footer}>
            {/* Mode Switcher Pill */}
            <View style={styles.modeContainer}>
              <TouchableOpacity 
                onPress={() => !isScanningLoop && setScanMode('OVERALL')} 
                style={[styles.modePill, scanMode === 'OVERALL' && styles.modePillActive]}
              >
                <MaterialCommunityIcons name="cube-scan" size={16} color={scanMode === 'OVERALL' ? '#000' : '#888'} />
                <Text style={[styles.modeLabel, scanMode === 'OVERALL' && styles.modeLabelActive]}>Overall</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => !isScanningLoop && setScanMode('ENVIRONMENT')} 
                style={[styles.modePill, scanMode === 'ENVIRONMENT' && styles.modePillActive]}
              >
                <MaterialCommunityIcons name="water" size={16} color={scanMode === 'ENVIRONMENT' ? '#000' : '#888'} />
                <Text style={[styles.modeLabel, scanMode === 'ENVIRONMENT' && styles.modeLabelActive]}>Environment</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              {/* Gallery Button */}
              <TouchableOpacity onPress={handleGalleryPick} style={styles.sideActionBtn}>
                  <Ionicons name="images-outline" size={26} color="#FFF" />
              </TouchableOpacity>

              {/* Shutter Button */}
              <View style={styles.shutterContainer}>
                  <TouchableOpacity onPress={captureAndScan} disabled={isScanningLoop}>
                    <View style={[
                      styles.scanPlaceholder, 
                      isScanningLoop && {borderColor: scanMode === 'OVERALL' ? '#0FA958' : '#3D5A80'}
                    ]}>
                        <MaterialCommunityIcons 
                          name={scanMode === 'OVERALL' ? "robot-outline" : "water-opacity"} 
                          size={32} 
                          color={isScanningLoop ? (scanMode === 'OVERALL' ? '#0FA958' : '#3D5A80') : "rgba(255,255,255,0.8)"} 
                        />
                    </View>
                  </TouchableOpacity>
              </View>

              {/* Help Button */}
              <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.sideActionBtn}>
                  <Ionicons name="help-circle-outline" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>
      </View>

      {/* GUIDE MODAL */}
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
              
              <Text style={styles.sectionTitle}>Overall Scan (Crayfish)</Text>
              <View style={styles.guideStep}>
                  <View style={styles.stepIconContainer}>
                    <MaterialCommunityIcons name="cube-scan" size={24} color="#0FA958" />
                  </View>
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepHeader}>1. Use the A5 Container</Text>
                    <Text style={styles.stepDesc}>Ensure the crayfish is placed flat inside the standardized A5 container.</Text>
                  </View>
              </View>
              <View style={styles.guideStep}>
                  <View style={styles.stepIconContainer}>
                    <MaterialCommunityIcons name="target" size={24} color="#0FA958" />
                  </View>
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepHeader}>2. Align Markers</Text>
                    <Text style={styles.stepDesc}>Make sure all four 2x2cm blue squares are visible in the frame.</Text>
                  </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Environment Scan (Water)</Text>
              <View style={styles.guideStep}>
                  <View style={styles.stepIconContainer}>
                    <MaterialCommunityIcons name="water" size={24} color="#3D5A80" />
                  </View>
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepHeader}>1. Clear View</Text>
                    <Text style={styles.stepDesc}>Take a top-down photo of the pond or tank water. Ensure no reflections block the water surface.</Text>
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
  errorCard: { backgroundColor: '#1E1E1E', width: width * 0.85, borderRadius: 28, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 71, 87, 0.4)' },
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
  laserLine: { width: '110%', height: 3, elevation: 10 },
  centerTarget: { position: 'absolute' },
  statusContainer: { position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 35 },
  statusActive: { backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statusLocked: { backgroundColor: '#0FA958' },
  statusText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  header: { position: 'absolute', top: 60, left: 25, right: 25, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  blurBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.9)', borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingBottom: 50, paddingTop: 25 },
  modeContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30, alignSelf: 'center', padding: 4, marginBottom: 25 },
  modePill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 26, gap: 6 },
  modePillActive: { backgroundColor: '#FFF' },
  modeLabel: { color: '#888', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  modeLabelActive: { color: '#000' },
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
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  guideStep: { flexDirection: 'row', marginBottom: 20, gap: 15 },
  stepIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  stepTextContainer: { flex: 1, justifyContent: 'center' },
  stepHeader: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  stepDesc: { fontSize: 14, color: '#AAA', lineHeight: 20 },
  primaryBtn: { backgroundColor: '#4CC9F0', paddingVertical: 18, borderRadius: 22, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: '#000', fontSize: 18, fontWeight: '800' },
});