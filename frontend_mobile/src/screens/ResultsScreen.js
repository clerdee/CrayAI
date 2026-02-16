import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, 
  Platform, StatusBar, Dimensions, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// NEW: SVG components for the curved Gauge Graph
import Svg, { Path, G, Polygon, Line, Rect } from 'react-native-svg';

// Import Main Client (Port 5000)
import client from '../api/client'; 

const { width } = Dimensions.get('window');

// --- CUSTOM GAUGE CHART COMPONENT ---
const GaugeChart = ({ levelIndex }) => {
  // Rotations for the needle to point to the exact center of each color block
  const needleRotations = [-67.5, -22.5, 22.5, 67.5];
  const rotation = needleRotations[levelIndex] || -67.5;

  return (
    <View style={styles.gaugeWrapper}>
      <Svg width="100%" height="160" viewBox="0 0 200 120">
        
        {/* 1. GREEN SEGMENT (Low) */}
        <Path d="M 20 100 A 80 80 0 0 1 43.43 43.43" fill="none" stroke="#0FA958" strokeWidth="35" />
        
        {/* 2. YELLOW SEGMENT (Moderate) */}
        <Path d="M 43.43 43.43 A 80 80 0 0 1 100 20" fill="none" stroke="#FFE600" strokeWidth="35" />
        
        {/* 3. RED SEGMENT (High) */}
        <Path d="M 100 20 A 80 80 0 0 1 156.57 43.43" fill="none" stroke="#E11A22" strokeWidth="35" />
        
        {/* 4. DARK RED SEGMENT (Critical) */}
        <Path d="M 156.57 43.43 A 80 80 0 0 1 180 100" fill="none" stroke="#A61016" strokeWidth="35" />

        {/* WHITE SEPARATOR GAPS */}
        <Line x1="100" y1="100" x2="43.43" y2="43.43" stroke="#FFF" strokeWidth="8" />
        <Line x1="100" y1="100" x2="100" y2="20" stroke="#FFF" strokeWidth="8" />
        <Line x1="100" y1="100" x2="156.57" y2="43.43" stroke="#FFF" strokeWidth="8" />

        {/* FLAT BASELINE CUTOFF */}
        <Rect x="0" y="100" width="200" height="20" fill="#FFF" />

        {/* ROTATING NEEDLE */}
        <G transform={`rotate(${rotation}, 100, 100)`}>
          <Polygon points="90,100 110,100 100,25" fill="#111" />
        </G>
      </Svg>
    </View>
  );
};


export default function ResultsScreen({ route, navigation }) {
  // 1. GET DATA FROM CAMERA - Now including dynamic algae data
  const { imageUri, type = 'image', measurements, algae_level, algae_desc } = route.params || {}; 
  
  const video = useRef(null);
  const [activeTab, setActiveTab] = useState('specimen'); 
  const [isSaving, setIsSaving] = useState(false);
  
  // --- STATE FOR DYNAMIC DATA ---
  const [userLocation, setUserLocation] = useState('Unknown Location');
  const [scanTimestamp] = useState(new Date()); 

  // --- FETCH USER LOCATION ---
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('userInfo');
        if (userDataStr) {
          const user = JSON.parse(userDataStr);
          const loc = user.street 
            ? `${user.street}, ${user.city}` 
            : (user.city || 'Unknown Location');
          setUserLocation(loc);
        }
      } catch (error) {
        console.error("Error loading user info:", error);
      }
    };
    loadUserLocation();
  }, []);

  // 2. PARSE REAL DATA
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
  const fullTimestamp = `${formattedDate} • ${formattedTime}`;

  const cmW = scanData ? scanData.width_cm.toFixed(2) : 0;
  const cmH = scanData ? scanData.height_cm.toFixed(2) : 0;
  const inW = scanData ? (scanData.width_cm / 2.54).toFixed(2) : 0;
  const inH = scanData ? (scanData.height_cm / 2.54).toFixed(2) : 0;

  // --- DYNAMIC ALGAE GAUGE CONFIGURATION ---
  const algaeLevels = [
    { id: 0, label: 'Low', color: '#0FA958' },       
    { id: 1, label: 'Moderate', color: '#FFE600' },  
    { id: 2, label: 'High', color: '#E11A22' },      
    { id: 3, label: 'Critical', color: '#A61016' }   
  ];
  
  // Use algae_level from Python response, default to 0 (Low)
  const currentAlgaeIndex = algae_level !== undefined ? algae_level : 0;
  const currentAlgae = algaeLevels[currentAlgaeIndex];

  const results = {
    sizeCm: scanData ? `${cmW}cm W x ${cmH}cm H` : "Measurement Failed",
    sizeIn: scanData ? `${inW}in W x ${inH}in H` : "",
    age: scanData ? estimateAge(scanData.width_cm) : "Unknown",
    gender: "Not Defined",
    turbidity: algae_desc || "Clear (Low Turbidity)", // Uses dynamic text from Python
    scanDate: fullTimestamp, 
    confidence: 0 
  };

  const mainColor = '#3D5A80'; 

  // --- ACTIONS ---
  const handleDiscard = () => {
    navigation.navigate('Camera', { resetScan: Date.now() });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'scan_result.jpg',
      });

      const captionSizeStr = scanData ? `${results.sizeCm}\n    📏 ${results.sizeIn}` : results.sizeCm;
      const captionText = `🦞 CrayAI Scan\n\n📏 Size: ${captionSizeStr}\n🎂 Age: ${results.age}\n💧 Water: ${results.turbidity}\n🌿 Algae: ${currentAlgae.label}\n📅 Time: ${formattedTime}`;
      formData.append('caption', captionText);
      formData.append('location', userLocation); 

      await client.post('/posts/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data,
      });

      Alert.alert("Saved", "Record added to your database!", [
        { text: "OK", onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error) {
      Alert.alert("Error", "Could not save result.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* --- MEDIA HEADER --- */}
      <View style={styles.mediaHeader}>
        {type === 'video' ? (
          <Video
            ref={video}
            source={{ uri: imageUri }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted={true}
          />
        ) : (
          <Image source={{ uri: imageUri }} style={styles.media} />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient} />
        
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.glassBtn} onPress={handleDiscard}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- BOTTOM SHEET --- */}
      <View style={styles.bottomSheetContainer}>
        <View style={styles.dragHandle} />

        {/* --- TABS --- */}
        <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tabItem, activeTab === 'specimen' && styles.activeTabItem]}
                onPress={() => setActiveTab('specimen')}
            >
                <Text style={[styles.tabText, activeTab === 'specimen' && styles.activeTabText]}>Specimen</Text>
                {activeTab === 'specimen' && <View style={[styles.activeIndicator, { backgroundColor: mainColor }]} />}
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.tabItem, activeTab === 'env' && styles.activeTabItem]}
                onPress={() => setActiveTab('env')}
            >
                <Text style={[styles.tabText, activeTab === 'env' && styles.activeTabText]}>Environment</Text>
                {activeTab === 'env' && <View style={[styles.activeIndicator, { backgroundColor: '#0FA958' }]} />}
            </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {activeTab === 'specimen' ? (
            // === TAB 1: SPECIMEN INFO ===
            <>
                <View style={[styles.card, styles.shadow]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>GENDER ID</Text>
                        <FontAwesome5 name="genderless" size={20} color={mainColor} />
                    </View>
                    <Text style={[styles.bigResult, { color: mainColor }]}>{results.gender}</Text>
                    <Text style={styles.subResult}>Model Pending Integration</Text>
                    
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
                    <DetailRow 
                      icon="ruler-horizontal" 
                      label="Size Estimation" 
                      value={results.sizeCm} 
                      subValue={results.sizeIn} 
                      color={mainColor} 
                    />
                    <View style={styles.divider} />
                    <DetailRow icon="hourglass-half" label="Age Class" value={results.age} color="#F4A261" />
                </View>
            </>
          ) : (
            // === TAB 2: ENVIRONMENT INFO ===
            <>
                {/* TURBIDITY CARD */}
                <View style={[styles.card, styles.shadow]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>TURBIDITY</Text>
                        <MaterialCommunityIcons name="water-opacity" size={20} color="#4CC9F0" />
                    </View>
                    <Text style={[styles.bigResult, { color: '#4CC9F0', fontSize: 20 }]}>{results.turbidity}</Text>
                    <Text style={styles.subResult}>Environmental Analysis</Text>
                </View>

                {/* SVG GAUGE CARD */}
                <View style={[styles.card, styles.shadow]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>BLUE-GREEN ALGAE</Text>
                        <MaterialCommunityIcons name="sprout" size={20} color={currentAlgae.color} />
                    </View>
                    
                    <GaugeChart levelIndex={currentAlgaeIndex} />
                    
                    <View style={styles.algaeTextContainer}>
                        <Text style={styles.algaeAlertLabel}>Current alert level:</Text>
                        <Text style={[styles.algaeAlertValue, { color: currentAlgae.color }]}>
                            {currentAlgae.label}
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Log Details</Text>
                <View style={styles.detailsList}>
                    <DetailRow icon="clock" label="Time Scanned" value={results.scanDate} color="#546E7A" />
                    <View style={styles.divider} />
                    <DetailRow icon="map-marker-alt" label="Location" value={userLocation} color="#E76F51" />
                </View>
            </>
          )}

          {/* SAVE BUTTONS */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={[styles.saveBtn, styles.shadow]} onPress={handleSave} disabled={isSaving}>
              <LinearGradient 
                colors={['#293241', '#3D5A80']} 
                start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                style={styles.saveGradient}
              >
                {isSaving ? <ActivityIndicator color="#FFF"/> : <><Feather name="save" size={20} color="#FFF" /><Text style={styles.saveText}>Save Record</Text></>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDiscard}>
              <Text style={styles.secondaryText}>Discard</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

// Reusable Row Component 
const DetailRow = ({ icon, label, value, subValue, color }) => (
  <View style={styles.detailRow}>
    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
      <FontAwesome5 name={icon} size={18} color={color} />
    </View>
    <View style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      {subValue ? <Text style={styles.detailSubValue}>{subValue}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // Header
  mediaHeader: { height: '40%', width: '100%', position: 'relative' },
  media: { width: '100%', height: '100%', backgroundColor: '#222' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  navBar: { position: 'absolute', top: 50, left: 20 },
  glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  // Bottom Sheet
  bottomSheetContainer: { flex: 1, marginTop: -30, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  dragHandle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 2.5, alignSelf: 'center', marginTop: 15, marginBottom: 15 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },

  // Tabs
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE', marginBottom: 20 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 15, fontWeight: '600', color: '#999' },
  activeTabText: { color: '#293241', fontWeight: '800' },
  activeIndicator: { position: 'absolute', bottom: -1, width: 40, height: 3, borderRadius: 3 },

  // Cards
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 25 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 12, color: '#999', fontWeight: '700', letterSpacing: 1 },
  bigResult: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  subResult: { fontSize: 14, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 15 },
  
  // Custom Gauge Graph Styles
  gaugeWrapper: { alignItems: 'center', marginTop: 10, marginBottom: -15 },
  algaeTextContainer: { alignItems: 'center', marginBottom: 10 },
  algaeAlertLabel: { fontSize: 16, color: '#444', fontWeight: '500' },
  algaeAlertValue: { fontSize: 28, fontWeight: '900', marginTop: 2, letterSpacing: 0.5 },

  // Meter
  meterContainer: { gap: 8 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { fontSize: 13, color: '#555' },
  meterValue: { fontSize: 13, fontWeight: '800', color: '#333' },
  progressBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // Lists
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#293241', marginBottom: 15 },
  detailsList: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 30, elevation: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  detailValue: { fontSize: 15, color: '#293241', fontWeight: '600' },
  detailSubValue: { fontSize: 13, color: '#7F8C8D', marginTop: 3 }, 
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8, marginLeft: 55 },

  // Actions
  actionContainer: { gap: 12, marginTop: 10 },
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 10 },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 15, alignItems: 'center' },
  secondaryText: { color: '#999', fontSize: 15, fontWeight: '600' },
  shadow: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10 }
});