import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, 
  Platform, StatusBar, Dimensions, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import Svg, { Path, G, Polygon, Line, Rect } from 'react-native-svg';
import client from '../api/client'; 

const { width } = Dimensions.get('window');

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
  // EXTRACT REAL LOG DETAILS PASSED FROM CAMERA
  const { 
    imageUri, 
    type = 'image', 
    measurements, 
    algae_level, 
    algae_desc, 
    turbidity_level = 2,
    processing_time = "N/A", 
    model_version = "Unknown Model",
    scan_id = "N/A"
  } = route.params || {}; 
  
  const video = useRef(null);
  const [activeTab, setActiveTab] = useState('specimen'); 
  const [isSaving, setIsSaving] = useState(false);
  const [userLocation, setUserLocation] = useState('Unknown Location');
  const [scanTimestamp] = useState(new Date()); 

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
  const fullTimestamp = `${formattedDate} • ${formattedTime}`;

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

  const results = {
    sizeCm: scanData ? `${cmW}cm W x ${cmH}cm H` : "Measurement Failed",
    sizeIn: scanData ? `${inW}in W x ${inH}in H` : "",
    age: scanData ? estimateAge(scanData.width_cm) : "Unknown",
    gender: "Not Defined",
    turbidity: `Turbidity Level ${turbidity_level}`,
    scanDate: fullTimestamp, 
    confidence: 0 
  };

  const mainColor = '#3D5A80'; 

  const handleDiscard = () => navigation.navigate('Camera', { resetScan: Date.now() });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'scan_result.jpg' });
      const captionText = `CrayAI Scan: ${results.sizeCm}\nAge: ${results.age}\nAlgae: ${currentAlgae.label}\nTurbidity: ${turbidity_level}`;
      formData.append('caption', captionText);
      formData.append('location', userLocation); 
      await client.post('/posts/create', formData);
      Alert.alert("Saved", "Record added!", [{ text: "OK", onPress: () => navigation.navigate('Home') }]);
    } catch (error) {
      Alert.alert("Error", "Could not save.");
    } finally { setIsSaving(false); }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.mediaHeader}>
        <Image source={{ uri: imageUri }} style={styles.media} />
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient} />
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.glassBtn} onPress={handleDiscard}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSheetContainer}>
        <View style={styles.dragHandle} />
        
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
                        <FontAwesome5 name="genderless" size={18} color={mainColor} />
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
                        <Text style={styles.cardTitle}>ALGAE MONITORING</Text>
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
                    <DetailRow icon="camera" label="Capture Method" value="Biometric Anchor" subValue="Fixed Focal Distance (15cm)" color="#8E44AD" />
                </View>

                <Text style={styles.sectionTitle}>System Logs</Text>
                <View style={styles.detailsList}>
                    {/* IMPLEMENTED REAL DATA HERE */}
                    <DetailRow icon="fingerprint" label="Session ID" value={scan_id} color="#2A9D8F" />
                    <View style={styles.divider} />
                    <DetailRow icon="microchip" label="AI Model Used" value={model_version} color="#3D5A80" />
                    <View style={styles.divider} />
                    <DetailRow icon="stopwatch" label="Processing Time" value={processing_time} subValue="Network + Neural Net Latency" color="#F4A261" />
                </View>
            </>
          )}

          <View style={styles.actionContainer}>
            <TouchableOpacity style={[styles.saveBtn, styles.shadow]} onPress={handleSave} disabled={isSaving}>
              <LinearGradient colors={['#293241', '#3D5A80']} style={styles.saveGradient}>
                {isSaving ? <ActivityIndicator color="#FFF"/> : <><Feather name="save" size={20} color="#FFF" /><Text style={styles.saveText}>Save Record</Text></>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDiscard}>
                <Text style={styles.secondaryText}>Discard Result</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
  mediaHeader: { height: '35%', width: '100%' },
  media: { width: '100%', height: '100%' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  navBar: { position: 'absolute', top: 50, left: 20 },
  glassBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  
  bottomSheetContainer: { flex: 1, marginTop: -30, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 2.5, alignSelf: 'center', marginTop: 15 },
  
  tabContainer: { flexDirection: 'row', marginTop: 10, paddingHorizontal: 15 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 15 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#AAA' },
  activeTabText: { color: '#293241', fontWeight: '800' },
  activeIndicator: { position: 'absolute', bottom: 0, width: 35, height: 4, borderRadius: 2 },
  
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  shadow: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
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
  saveBtn: { borderRadius: 15, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 10 },
  saveText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  secondaryText: { color: '#AAA', fontWeight: '700', fontSize: 15 }
});