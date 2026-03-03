import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, 
  Platform, StatusBar, Dimensions, ActivityIndicator,
  Animated, PanResponder
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import Svg, { Path, G, Polygon, Line, Rect } from 'react-native-svg';
import client from '../api/client'; 

import { CLOUDINARY_CONFIG } from '../config/cloudinary';

const { width, height } = Dimensions.get('window');

const GaugeChart = ({ levelIndex }) => {
  const needleRotations = [-67.5, -22.5, 22.5, 67.5];
  const rotation = needleRotations[levelIndex] || -67.5;
  return (
    <View style={styles.gaugeWrapper}>
      <Svg width="100%" height="160" viewBox="0 0 200 120">
        <Path d="M 20 100 A 80 80 0 0 1 43.43 43.43" fill="none" stroke="#0FA958" strokeWidth="35" />
        <Path d="M 43.43 43.43 A 80 80 0 0 1 100 20" fill="none" stroke="#FFE600" strokeWidth="35" />
        <Path d="M 100 20 A 80 80 0 0 1 156.57 43.43" fill="none" stroke="#E11A22" strokeWidth="35" />
        <Path d="M 156.57 43.43 A 80 80 0 0 1 180 100" fill="none" stroke="#A61016" strokeWidth="35" />
        <Line x1="100" y1="100" x2="43.43" y2="43.43" stroke="#FFF" strokeWidth="8" />
        <Line x1="100" y1="100" x2="100" y2="20" stroke="#FFF" strokeWidth="8" />
        <Line x1="100" y1="100" x2="156.57" y2="43.43" stroke="#FFF" strokeWidth="8" />
        <Rect x="0" y="100" width="200" height="20" fill="#FFF" />
        <G transform={`rotate(${rotation}, 100, 100)`}>
          <Polygon points="90,100 110,100 100,25" fill="#111" />
        </G>
      </Svg>
    </View>
  );
};

const TurbidityGraph = ({ level }) => {
  const colors = [ '#FFFFFF', '#FAF9F6', '#F3F0E0', '#EAE0C8', '#DCC9A0', '#C4A484', '#A67B5B', '#8B5A2B', '#5D4037', '#3E2723' ];
  const getStatusText = (val) => {
    if (val <= 3) return "Healthy conditions for crayfish.";
    if (val <= 6) return "Water losing oxygen; growth may be stunted.";
    return "Critical: Gills may clog; risk of suffocation.";
  };
  return (
    <View style={styles.turbidityContainer}>
      <View style={styles.turbidityBar}>
        {colors.map((color, index) => (
          <View key={index} style={styles.turbiditySegmentWrapper}>
             <View style={[styles.turbiditySegment, { backgroundColor: color }, level === index + 1 && styles.activeSegment]} />
             <Text style={[styles.turbidityLabel, level === index + 1 && styles.activeLabelText]}>{index + 1}</Text>
          </View>
        ))}
      </View>
      <View style={styles.turbidityInfo}>
         <Ionicons name="information-circle-outline" size={16} color="#5D4037" />
         <Text style={styles.turbidityStatusText}>{getStatusText(level)}</Text>
      </View>
    </View>
  );
};

export default function ResultsScreen({ route, navigation }) {
  const { 
    imageUri, 
    type = 'image', 
    measurements, 
    algae_level, 
    algae_desc, 
    turbidity_level = 2,
    processing_time = "N/A", 
    model_version = "Unknown Model",
    scan_id = "N/A",
    gender = "Not Defined",
    gender_confidence = 0
  } = route.params || {}; 
  
  const [activeTab, setActiveTab] = useState('specimen'); 
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [userLocation, setUserLocation] = useState('Unknown Location');
  const [scanTimestamp] = useState(new Date()); 

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToastAndNavigate = (message, type = 'success', targetScreen = 'Home') => {
    setToast({ visible: true, message, type });
    
    Animated.timing(toastAnim, {
      toValue: 60, 
      duration: 400,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -150,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setToast(prev => ({ ...prev, visible: false }));
        if(type === 'success' && targetScreen) {
          navigation.navigate(targetScreen);
        }
      });
    }, 2000);
  };

  const SNAP_TOP = 0; 
  const SNAP_BOTTOM = height * 0.55; 
  
  const translateY = useRef(new Animated.Value(SNAP_TOP)).current;
  const lastGestureDy = useRef(SNAP_TOP);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5, 
      onPanResponderGrant: () => {
        translateY.setOffset(lastGestureDy.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        const newY = lastGestureDy.current + gesture.dy;
        if (newY >= SNAP_TOP && newY <= SNAP_BOTTOM + 50) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        translateY.flattenOffset();
        if (gesture.vy > 0.5 || gesture.dy > 100) {
          Animated.spring(translateY, { toValue: SNAP_BOTTOM, useNativeDriver: true, bounciness: 4 }).start(() => { lastGestureDy.current = SNAP_BOTTOM; });
        } else if (gesture.vy < -0.5 || gesture.dy < -100) {
          Animated.spring(translateY, { toValue: SNAP_TOP, useNativeDriver: true, bounciness: 4 }).start(() => { lastGestureDy.current = SNAP_TOP; });
        } else {
          const target = (lastGestureDy.current + gesture.dy) > (SNAP_BOTTOM / 2) ? SNAP_BOTTOM : SNAP_TOP;
          Animated.spring(translateY, { toValue: target, useNativeDriver: true, bounciness: 4 }).start(() => { lastGestureDy.current = target; });
        }
      }
    })
  ).current;

  const imageTranslateY = translateY.interpolate({
      inputRange: [SNAP_TOP, SNAP_BOTTOM],
      outputRange: [-height * 0.20, 0], 
      extrapolate: 'clamp'
  });

  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('userInfo');
        if (userDataStr) {
          const user = JSON.parse(userDataStr);
          setUserLocation(user.street ? `${user.street}, ${user.city}` : (user.city || 'Unknown Location'));
        }
      } catch (error) {}
    };
    loadUserLocation();
  }, []);

  const scanData = measurements && measurements.length > 0 ? measurements[0] : null;

  const estimateAge = (sizeCm) => {
      if (!sizeCm) return "Unknown";
      if (sizeCm < 3) return "Crayling (< 1 month)";
      if (sizeCm >= 3 && sizeCm < 7) return "Juvenile (1-3 months)";
      if (sizeCm >= 7 && sizeCm < 11) return "Sub-Adult (3-6 months)";
      return "Adult/Breeder (> 6 months)";
  };

  const formattedDate = scanTimestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = scanTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const cmW = scanData ? scanData.width_cm.toFixed(2) : 0;
  const cmH = scanData ? scanData.height_cm.toFixed(2) : 0;
  const inW = scanData ? (scanData.width_cm / 2.54).toFixed(2) : 0;
  const inH = scanData ? (scanData.height_cm / 2.54).toFixed(2) : 0;

  const algaeLevels = [
    { id: 0, label: 'Low', color: '#0FA958' },       
    { id: 1, label: 'Moderate', color: '#FFE600' },  
    { id: 2, label: 'High', color: '#E11A22' },      
    { id: 3, label: 'Critical', color: '#A61016' }   
  ];
  
  const currentAlgaeIndex = algae_level !== undefined ? algae_level : 0;
  const currentAlgae = algaeLevels[currentAlgaeIndex];

  const calculatedAge = scanData ? estimateAge(scanData.height_cm) : "Unknown"; 

  const results = {
    sizeCm: scanData ? `${cmW}cm W x ${cmH}cm H` : "Measurement Failed",
    sizeIn: scanData ? `${inW}in W x ${inH}in H` : "",
    age: calculatedAge, 
    gender: gender || "Not Defined",
    confidence: gender_confidence || 0,
    turbidity: `Turbidity Level ${turbidity_level}`,
    scanDate: `${formattedDate} • ${formattedTime}`, 
  };

  const isFemale = results.gender === 'Female' || results.gender === 'Berried';
  const isMale = results.gender === 'Male';
  const mainColor = isFemale ? '#FF69B4' : (isMale ? '#3D5A80' : '#3D5A80');
  const genderIcon = isFemale ? "venus" : (isMale ? "mars" : "genderless");

  const handleDiscard = () => navigation.navigate('Camera', { resetScan: Date.now() });

  // --- CLOUDINARY UPLOAD FUNCTION ---
  const uploadToCloudinary = async (base64Image) => {
    try {
      const data = new FormData();
      data.append('file', base64Image); // Send base64 directly
      data.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      data.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
      data.append('folder', 'scanrecords');

      const response = await fetch(CLOUDINARY_CONFIG.apiUrl, {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.secure_url) {
        return { url: result.secure_url, public_id: result.public_id };
      } else {
        throw new Error('Cloudinary upload failed');
      }
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw error;
    }
  };

  const uploadAndSaveScan = async () => {
    // 1. Upload the image to Cloudinary first
    const cloudinaryResult = await uploadToCloudinary(imageUri);

    // 2. Prepare the NESTED payload matching backend controller structure
    const scanDataPayload = {
      scanId: scan_id,
      gender: results.gender,
      gender_confidence: results.confidence,
      
      image: {
        url: cloudinaryResult.url,
        public_id: cloudinaryResult.public_id
      },
     
      morphometrics: {
        width_cm: parseFloat(cmW),
        height_cm: parseFloat(cmH),
        estimated_age: results.age
      },
      
      environment: {
        algae_label: currentAlgae.label,
        turbidity_level: parseInt(turbidity_level)
      },
      
      // ✅ NESTED: metadata object
      metadata: {
        location: userLocation,
        processing_time: processing_time,
        model_version: model_version
      }
    };

    // 3. Save to Database
    await client.post('/scans/create', scanDataPayload);

    return cloudinaryResult.url; 
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await uploadAndSaveScan();
      showToastAndNavigate("Record saved to database!", "success", "Home");
    } catch (error) {
      console.error("Save Error:", error);
      showToastAndNavigate("Failed to save. Please try again.", "error", null);
    } finally { 
      setIsSaving(false); 
    }
  };

  const handlePostToFeed = async () => {
    setIsPosting(true);
    try {
      const uploadedImageUrl = await uploadAndSaveScan();

      const autoCaption = `Just scanned a ${results.gender !== "Not Defined" ? results.gender : ""} Australian Red Claw Crayfish! 🦞\n\n📏 Size: ${results.sizeCm}\n🎂 Est. Age: ${results.age}\n💧 Water Turbidity: Level ${turbidity_level}\n🌿 Algae: ${currentAlgae.label}`;

      navigation.navigate('Community', {
        prefillImage: uploadedImageUrl,
        prefillCaption: autoCaption
      });

    } catch (error) {
      console.error("Post Error:", error);
      showToastAndNavigate("Failed to process. Please try again.", "error", null);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.View style={[
        styles.toastContainer, 
        { transform: [{ translateY: toastAnim }] },
        toast.type === 'success' ? styles.toastSuccess : styles.toastError
      ]}>
        <Ionicons 
          name={toast.type === 'success' ? "checkmark-circle" : "warning"} 
          size={24} 
          color="#FFF" 
        />
        <Text style={styles.toastText}>{toast.message}</Text>
      </Animated.View>
      
      <Animated.View style={[styles.imageWrapper, { transform: [{ translateY: imageTranslateY }] }]}>
        <Image source={{ uri: imageUri }} style={styles.media} resizeMode="cover" />
      </Animated.View>
      
      <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.topGradient} />
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.glassBtn} onPress={handleDiscard}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.bottomSheetContainer, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View style={styles.dragHandle} />
        </View>
        
        <View style={styles.tabContainer}>
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('specimen')}>
                <Text style={[styles.tabText, activeTab === 'specimen' && styles.activeTabText]}>Specimen</Text>
                {activeTab === 'specimen' && <View style={[styles.activeIndicator, { backgroundColor: mainColor }]} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('env')}>
                <Text style={[styles.tabText, activeTab === 'env' && styles.activeTabText]}>Environment</Text>
                {activeTab === 'env' && <View style={[styles.activeIndicator, { backgroundColor: '#0FA958' }]} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('details')}>
                <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>Details</Text>
                {activeTab === 'details' && <View style={[styles.activeIndicator, { backgroundColor: '#F4A261' }]} />}
            </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {activeTab === 'specimen' && (
            <>
                <View style={[styles.card, styles.shadow]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>GENDER ID</Text>
                        <FontAwesome5 name={genderIcon} size={18} color={mainColor} />
                    </View>
                    <Text style={[styles.bigResult, { color: mainColor }]}>{results.gender}</Text>
                    <Text style={styles.subResult}>Australian Red Claw</Text>
                    
                    <View style={styles.meterContainer}>
                        <View style={styles.meterLabels}>
                            <Text style={styles.meterLabel}>AI Confidence</Text>
                            <Text style={styles.meterValue}>{results.confidence}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${results.confidence}%`, backgroundColor: mainColor }]} />
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Morphometrics</Text>
                <View style={styles.detailsList}>
                    <DetailRow icon="ruler-horizontal" label="Size Estimation" value={results.sizeCm} subValue={results.sizeIn} color={mainColor} />
                    <View style={styles.divider} />
                    <DetailRow icon="hourglass-half" label="Age Class" value={results.age} color="#F4A261" />
                </View>
            </>
          )}

          {activeTab === 'env' && (
            <>
                <View style={[styles.card, styles.shadow]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>WATER TURBIDITY</Text>
                        <MaterialCommunityIcons name="water-opacity" size={20} color="#8B5A2B" />
                    </View>
                    <Text style={[styles.bigResult, { color: '#8B5A2B', fontSize: 24 }]}>Level {turbidity_level}</Text>
                    <TurbidityGraph level={turbidity_level} />
                </View>

                <View style={[styles.card, styles.shadow]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>BLUE-GREEN ALGAE</Text>
                        <MaterialCommunityIcons name="sprout" size={20} color={currentAlgae.color} />
                    </View>
                    <GaugeChart levelIndex={currentAlgaeIndex} />
                    <View style={styles.algaeTextContainer}>
                        <Text style={[styles.algaeAlertValue, { color: currentAlgae.color }]}>{currentAlgae.label.toUpperCase()}</Text>
                    </View>
                </View>
            </>
          )}

          {activeTab === 'details' && (
            <>
                <Text style={styles.sectionTitle}>Capture Metadata</Text>
                <View style={styles.detailsList}>
                    <DetailRow icon="calendar-alt" label="Date & Time" value={results.scanDate} color="#546E7A" />
                    <View style={styles.divider} />
                    <DetailRow icon="map-marker-alt" label="Location" value={userLocation} color="#E76F51" />
                    <View style={styles.divider} />
                    <DetailRow icon="camera" label="Capture Method" value="Biometric Anchor" subValue="Fixed Focal Distance (~15cm)" color="#8E44AD" />
                </View>

                <Text style={styles.sectionTitle}>System Logs</Text>
                <View style={styles.detailsList}>
                    <DetailRow icon="fingerprint" label="Session ID" value={scan_id} color="#2A9D8F" />
                    <View style={styles.divider} />
                    <DetailRow icon="microchip" label="AI Model Used" value={model_version} color="#3D5A80" />
                    <View style={styles.divider} />
                    <DetailRow icon="stopwatch" label="Processing Time" value={processing_time} subValue="Network + Neural Net Latency" color="#F4A261" />
                </View>
            </>
          )}

          {/* ACTION BUTTONS */}
          <View style={styles.actionContainer}>
            <View style={styles.actionRowContainer}>
              
              {/* Button 1: Save Record */}
              <TouchableOpacity style={[styles.primaryActionBtn, styles.shadow]} onPress={handleSave} disabled={isSaving || isPosting}>
                <LinearGradient colors={['#293241', '#3D5A80']} style={styles.btnGradient}>
                  {isSaving ? <ActivityIndicator color="#FFF"/> : <><Feather name="save" size={18} color="#FFF" /><Text style={styles.btnText}>Save</Text></>}
                </LinearGradient>
              </TouchableOpacity>

              {/* Button 2: Post to Feed */}
              <TouchableOpacity style={[styles.primaryActionBtn, styles.shadow]} onPress={handlePostToFeed} disabled={isSaving || isPosting}>
                <LinearGradient colors={['#E76F51', '#D65A31']} style={styles.btnGradient}>
                  {isPosting ? <ActivityIndicator color="#FFF"/> : <><Feather name="share-2" size={18} color="#FFF" /><Text style={styles.btnText}>Post to Feed</Text></>}
                </LinearGradient>
              </TouchableOpacity>

            </View>

            {/* Button 3: Discard */}
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDiscard} disabled={isSaving || isPosting}>
                <Text style={styles.secondaryText}>Discard Result</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

const DetailRow = ({ icon, label, value, subValue, color }) => (
  <View style={styles.detailRow}>
    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}><FontAwesome5 name={icon} size={18} color={color} /></View>
    <View style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      {subValue && <Text style={styles.detailSubValue}>{subValue}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  imageWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
  media: { width: '100%', height: '100%' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 110, zIndex: 5 },
  navBar: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  glassBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  
  toastContainer: {
    position: 'absolute',
    top: 0, 
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  toastSuccess: { backgroundColor: '#0FA958' },
  toastError: { backgroundColor: '#E11A22' },
  toastText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 12, flex: 1 },

  bottomSheetContainer: { position: 'absolute', bottom: 0, width: '100%', height: height * 0.70, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 20, zIndex: 10 },
  dragHandleArea: { width: '100%', paddingVertical: 18, alignItems: 'center', backgroundColor: 'transparent' },
  dragHandle: { width: 45, height: 5, backgroundColor: '#CCC', borderRadius: 3 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 15, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#AAA' },
  activeTabText: { color: '#293241', fontWeight: '800' },
  activeIndicator: { position: 'absolute', bottom: -1, width: 35, height: 4, borderRadius: 2 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  shadow: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 1 },
  bigResult: { fontSize: 28, fontWeight: '800' },
  subResult: { fontSize: 14, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 10 },
  meterContainer: { marginTop: 10 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  meterLabel: { fontSize: 12, color: '#666' },
  meterValue: { fontSize: 12, fontWeight: '800' },
  progressBarBg: { height: 8, backgroundColor: '#EEE', borderRadius: 4 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, color: '#293241', marginTop: 5 },
  detailsList: { backgroundColor: '#F9F9F9', borderRadius: 15, padding: 15, marginBottom: 25 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#293241' },
  detailSubValue: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#EEE', marginLeft: 55 },
  gaugeWrapper: { alignItems: 'center', height: 140, marginBottom: 10 },
  algaeTextContainer: { alignItems: 'center', marginTop: -20 },
  algaeAlertValue: { fontSize: 22, fontWeight: '900' },
  turbidityContainer: { marginTop: 10 },
  turbidityBar: { flexDirection: 'row', height: 45, justifyContent: 'space-between' },
  turbiditySegmentWrapper: { flex: 1, alignItems: 'center' },
  turbiditySegment: { width: '85%', height: 25, borderRadius: 4, borderWidth: 1, borderColor: '#EEE' },
  activeSegment: { borderWidth: 3, borderColor: '#3D5A80', height: 32, marginTop: -3.5 },
  turbidityLabel: { fontSize: 10, color: '#999', marginTop: 5 },
  activeLabelText: { fontWeight: '800', color: '#3D5A80' },
  turbidityInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF8F3', padding: 12, borderRadius: 12, marginTop: 15, gap: 10 },
  turbidityStatusText: { fontSize: 12, color: '#5D4037', flex: 1, fontWeight: '600' },
  actionContainer: { marginTop: 5, paddingBottom: 20 },
  actionRowContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  primaryActionBtn: { flex: 1, borderRadius: 15, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 15, alignItems: 'center', marginTop: 15 },
  secondaryText: { color: '#AAA', fontWeight: '700', fontSize: 15 }
});