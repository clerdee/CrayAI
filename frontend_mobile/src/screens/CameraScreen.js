import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, 
  Modal, ScrollView, ActivityIndicator, Animated, Vibration, Easing, Alert, Image
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

export default function CameraScreen({ navigation }) {
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
  
  // NEW: State to show the "Green Mask" image returned from Python
  const [liveMask, setLiveMask] = useState(null);
  
  const scanBuffer = useRef({ widths: [], heights: [], lastImage: null });

  const pulseAnim = useRef(new Animated.Value(1)).current; 
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null); 
  const timerRef = useRef(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  // --- SCANNING LOGIC ---
  const performScanLoop = async (currentCount = 0) => {
    if (!cameraRef.current) return;

    setScanStatus(`SCANNING ${currentCount + 1}/${SAMPLES_NEEDED}`);
    setIsScanningLoop(true);

    try {
      // 1. Take Low-Res Picture (Faster upload)
      const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.4, 
          base64: false,
          skipProcessing: true // Android only: speeds up capture
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

      if (data.measurements) {
        // --- NEW: SHOW THE MASK LIVE! ---
        // We set the processed image (with green lines) as an overlay
        if (data.image) {
            setLiveMask(`data:image/jpeg;base64,${data.image}`);
        }

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
          console.log("No target found, retrying...");
          performScanLoop(currentCount); 
        }
      } else {
        throw new Error("Invalid response");
      }

    } catch (error) {
      console.error("Scan Error:", error);
      setIsScanningLoop(false);
      setLiveMask(null); // Hide mask on error
      setScanStatus('searching');
      scanBuffer.current = { widths: [], heights: [], lastImage: null }; 
      Alert.alert("Connection Failed", "Ensure app.py is running on Port 5001.");
    }
  };

  const finishScanning = () => {
    Vibration.vibrate([0, 50, 100, 50]); 
    
    // ... Calculation Logic ...
    const widths = scanBuffer.current.widths;
    const heights = scanBuffer.current.heights;
    const avgW = widths.reduce((a, b) => a + b, 0) / widths.length;
    const avgH = heights.reduce((a, b) => a + b, 0) / heights.length;
    const minW = Math.min(...widths);
    const maxW = Math.max(...widths);
    
    const finalResult = {
        width_cm: parseFloat(avgW.toFixed(2)),
        height_cm: parseFloat(avgH.toFixed(2)),
        range_w: `${minW.toFixed(2)} - ${maxW.toFixed(2)}`,
        samples: widths.length
    };

    setLiveMask(null); // Clear overlay before navigating
    navigation.navigate('Results', { 
        imageUri: scanBuffer.current.lastImage, 
        type: 'image',
        measurements: [finalResult], 
        isAverage: true 
    });

    setIsScanningLoop(false);
    setScanStatus('locked');
    scanBuffer.current = { widths: [], heights: [], lastImage: null };
  };

  // ... (Animations and Timer Effects - SAME AS BEFORE) ...
  useEffect(() => {
    if (selectedMode === 'SCAN') {
      Animated.loop(
        Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
      
      Animated.loop(
        Animated.sequence([
            Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true })
        ])
      ).start();

      setScanStatus('searching');
      const t1 = setTimeout(() => { if (!isScanningLoop) setScanStatus('detecting'); }, 1500);
      const t2 = setTimeout(() => { 
          if (!isScanningLoop) {
             setScanStatus('locked');
             Vibration.vibrate(50);
             performScanLoop(0); 
          }
      }, 3500); 

      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setScanStatus('idle');
    }
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

  // ... (Helper Functions - SAME AS BEFORE) ...
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

    if (selectedMode === 'VIDEO') {
        if (isRecording) {
            cameraRef.current.stopRecording(); 
            setIsRecording(false);
        } else {
            setIsRecording(true);
            try {
              const video = await cameraRef.current.recordAsync();
              navigation.navigate('Results', { imageUri: video.uri, type: 'video' });
            } catch (e) { setIsRecording(false); }
        }
    } else if (selectedMode === 'PHOTO') {
       const photo = await cameraRef.current.takePictureAsync();
       navigation.navigate('Results', { imageUri: photo.uri, type: 'image' });
    } else if (selectedMode === 'SCAN') {
       performScanLoop(0);
    }
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCAN_HEIGHT/2, SCAN_HEIGHT/2]
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
        
        {/* --- LIVE MASK OVERLAY --- */}
        {/* This sits ON TOP of the camera but BELOW the UI controls */}
        {liveMask && isScanningLoop && (
            <Image 
                source={{ uri: liveMask }} 
                style={[StyleSheet.absoluteFillObject, { opacity: 0.8 }]} 
                resizeMode="contain" // Ensures alignment matches camera aspect ratio
            />
        )}

        {selectedMode === 'SCAN' && (
          <View style={styles.scanLayer}>
            <View style={styles.scanBox}>
               {/* Show Box UI only if we are NOT showing the live mask (to avoid clutter) */}
               {!liveMask && (
                 <>
                   <View style={[styles.corner, styles.tl]} />
                   <View style={[styles.corner, styles.tr]} />
                   <View style={[styles.corner, styles.bl]} />
                   <View style={[styles.corner, styles.br]} />
                   <View style={styles.gridOverlay}>
                     <View style={styles.gridLineHorizontal} />
                     <View style={styles.gridLineVertical} />
                   </View>
                 </>
               )}

               {!isScanningLoop && (
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

        {/* --- VIDEO RECORDING PILL --- */}
        {selectedMode === 'VIDEO' && isRecording && (
          <View style={styles.timerPill}>
            <View style={styles.recordDot} />
            <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>
          </View>
        )}

        {/* CONTROLS */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.blurBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFlashMode(!flashMode)} style={styles.blurBtn}>
                <Ionicons name={flashMode ? "flash" : "flash-off"} size={22} color="#FFF" />
            </TouchableOpacity>
        </View>

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
                   {selectedMode === 'SCAN' ? (
                       <TouchableOpacity onPress={() => performScanLoop(0)} disabled={isScanningLoop}>
                         <View style={[styles.scanPlaceholder, isScanningLoop && {borderColor: '#4CC9F0'}]}>
                            <MaterialCommunityIcons name="robot-outline" size={32} color={isScanningLoop ? "#4CC9F0" : "rgba(255,255,255,0.3)"} />
                         </View>
                       </TouchableOpacity>
                   ) : (
                       <TouchableOpacity onPress={handleManualCapture} style={styles.shutterOuter}>
                           <View style={styles.photoInner} />
                       </TouchableOpacity>
                   )}
                </View>

                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.sideActionBtn}>
                    <Ionicons name="help-circle-outline" size={28} color="#FFF" />
                </TouchableOpacity>
             </View>
        </View>

        {/* MODAL */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          {/* ... Modal content same as before ... */}
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
                      <Text style={styles.stepHeader}>1. Grip Securely</Text>
                      <Text style={styles.stepDesc}>Hold the crayfish by the back (thorax) to keep claws away.</Text>
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
  scanLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanBox: { width: SCAN_WIDTH, height: SCAN_HEIGHT, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#FFF', borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  gridOverlay: { width: '100%', height: '100%', opacity: 0.1, position: 'absolute' },
  gridLineHorizontal: { width: '100%', height: 1, backgroundColor: '#FFF', top: '50%' },
  gridLineVertical: { height: '100%', width: 1, backgroundColor: '#FFF', left: '50%', position: 'absolute' },
  laserLine: { width: '120%', height: 2, backgroundColor: '#4CC9F0', shadowColor: '#4CC9F0', shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  centerTarget: { position: 'absolute' },
  statusContainer: { 
    position: 'absolute',
    top: 120, 
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statusActive: { backgroundColor: 'rgba(0,0,0,0.6)' },
  statusLocked: { backgroundColor: '#06D6A0', borderColor: '#06D6A0' },
  statusText: { color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 1.2 },
  header: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  blurBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  timerPill: { position: 'absolute', top: 110, alignSelf: 'center', backgroundColor: '#EF476F', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFF' },
  timerText: { color: '#FFF', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.85)', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, paddingTop: 15 },
  modeRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 20 },
  modeItem: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  modeItemActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  modeLabel: { color: '#888', fontSize: 13, fontWeight: '600' },
  activeModeLabel: { color: '#FFF', fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  sideActionBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)' },
  shutterContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  scanPlaceholder: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  photoInner: { backgroundColor: '#FFF', width: 64, height: 64, borderRadius: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  dragHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  modalCloseBtn: { opacity: 0.8 },
  modalBody: { marginBottom: 10 },
  guideStep: { flexDirection: 'row', marginBottom: 25, gap: 15 },
  stepIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(76, 201, 240, 0.1)', justifyContent: 'center', alignItems: 'center' },
  stepTextContainer: { flex: 1, justifyContent: 'center' },
  stepHeader: { fontSize: 17, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  stepDesc: { fontSize: 14, color: '#AAA', lineHeight: 20 },
  primaryBtn: { backgroundColor: '#4CC9F0', paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});