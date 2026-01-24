import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SCAN_WIDTH = width * 0.7;
const SCAN_HEIGHT = height * 0.5;

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [isScanning, setIsScanning] = useState(true);
  const [liveResult, setLiveResult] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState('photo'); // 'photo' or 'video'
  
  const cameraRef = useRef(null); 

  useEffect(() => {
    if (!permission) requestPermission();
    
    const timer = setTimeout(() => {
      setLiveResult({ gender: "MALE", confidence: "94%" });
      setIsScanning(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [permission]);

  // FIXED: Gallery now allows both Images and Videos
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Accepts both now
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      // Determine if it's a video or image based on file extension
      const isVideo = result.assets[0].type === 'video';
      navigation.navigate('Results', { imageUri: result.assets[0].uri, type: isVideo ? 'video' : 'image' });
    }
  };

  // FIXED: Recording now automatically navigates to Results when stopped
  const handleMainAction = async () => {
    if (!cameraRef.current) return;

    if (mode === 'photo') {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      navigation.navigate('Results', { imageUri: photo.uri, type: 'image' });
    } else {
      if (isRecording) {
        // This triggers the promise below to resolve
        cameraRef.current.stopRecording(); 
      } else {
        setIsRecording(true);
        // Start recording. This waits until stopRecording() is called.
        cameraRef.current.recordAsync().then((video) => {
          setIsRecording(false);
          // Send the recorded video to the Results Screen
          navigation.navigate('Results', { imageUri: video.uri, type: 'video' });
        });
      }
    }
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) return <Text style={styles.errorText}>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <CameraView 
        ref={cameraRef} 
        style={StyleSheet.absoluteFillObject} 
        facing="back" 
        enableTorch={flashMode}
        mode={mode}
      >
        
        {/* --- LIVE SCANNING OVERLAY --- */}
        <View style={styles.overlayContainer}>
          <View style={styles.overlayTop}>
             {isRecording ? (
                <View style={[styles.liveBadge, { backgroundColor: '#E74C3C' }]}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.liveResultText}>RECORDING SCAN...</Text>
                </View>
             ) : (
               liveResult ? (
                 <View style={styles.liveBadge}>
                   <Text style={styles.liveResultText}>DETECTION: {liveResult.gender}</Text>
                   <Text style={styles.liveConfText}>{liveResult.confidence}</Text>
                 </View>
               ) : (
                 <View style={styles.scanningBadge}>
                   <ActivityIndicator size="small" color="#FFF" style={{marginRight: 8}} />
                   <Text style={styles.liveResultText}>ANALYZING...</Text>
                 </View>
               )
             )}
          </View>

          <View style={styles.overlayMiddleRow}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <View style={[styles.scanLine, isRecording && { backgroundColor: '#E74C3C' }]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom} />
        </View>

        <View style={styles.topControls}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.modeToggle}>
             <TouchableOpacity onPress={() => setMode('photo')} style={[styles.modeBtn, mode === 'photo' && styles.activeMode]}>
               <Text style={[styles.modeText, mode === 'photo' && styles.activeModeText]}>PHOTO</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setMode('video')} style={[styles.modeBtn, mode === 'video' && styles.activeMode]}>
               <Text style={[styles.modeText, mode === 'video' && styles.activeModeText]}>VIDEO</Text>
             </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={() => setFlashMode(!flashMode)}>
            <Ionicons name={flashMode ? "flash" : "flash-off"} size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomControls}>
          {/* FIXED: Added onPress={pickImage} back to the media button */}
          <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
            <Ionicons name="image-outline" size={30} color="#FFF" />
            <Text style={styles.btnLabel}>Media</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButtonOuter} onPress={handleMainAction}>
            <View style={[
                styles.captureButtonInner, 
                mode === 'video' && { backgroundColor: '#E74C3C', borderRadius: isRecording ? 10 : 32.5 }
            ]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="information-circle-outline" size={32} color="#FFF" />
            <Text style={styles.btnLabel}>Guide</Text>
          </TouchableOpacity>
        </View>

      </CameraView>
    </View>
  );
}

const overlayColor = 'rgba(0,0,0,0.65)'; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlayContainer: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: overlayColor, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 25 },
  overlayBottom: { flex: 1, backgroundColor: overlayColor },
  overlayMiddleRow: { flexDirection: 'row', height: SCAN_HEIGHT },
  overlaySide: { flex: 1, backgroundColor: overlayColor },
  scanArea: { width: SCAN_WIDTH, height: SCAN_HEIGHT, position: 'relative' },

  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A9D8F', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 15, gap: 10, elevation: 10 },
  scanningBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3D5A80', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 15 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFF' },
  liveResultText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  liveConfText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },

  scanLine: { width: '100%', height: 2, backgroundColor: '#58D68D', position: 'absolute', top: '50%', opacity: 0.6 },

  modeToggle: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 4 },
  modeBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 18 },
  activeMode: { backgroundColor: '#FFF' },
  modeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  activeModeText: { color: '#293241' },

  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#58D68D', borderWidth: 5 },
  cornerTL: { top: -2, left: -2, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 20 },
  cornerTR: { top: -2, right: -2, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 20 },
  cornerBL: { bottom: -2, left: -2, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 20 },
  cornerBR: { bottom: -2, right: -2, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 20 },

  topControls: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },

  bottomControls: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  secondaryButton: { alignItems: 'center', gap: 5 },
  btnLabel: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  
  captureButtonOuter: { width: 85, height: 85, borderRadius: 42.5, borderWidth: 5, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  captureButtonInner: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#FFF' },
});