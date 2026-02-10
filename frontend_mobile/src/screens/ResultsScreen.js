import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, 
  Platform, StatusBar, Dimensions, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// Import Main Client (Port 5000)
import client from '../api/client'; 

const { width } = Dimensions.get('window');

export default function ResultsScreen({ route, navigation }) {
  // 1. GET DATA FROM CAMERA
  const { imageUri, type = 'image', measurements } = route.params || {}; 
  
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

  // 2. PARSE REAL DATA (Size) & CALCULATE AGE
  const scanData = measurements && measurements.length > 0 ? measurements[0] : null;

  // --- UPDATED AGE ESTIMATION LOGIC (4 CLASSES) ---
  const estimateAge = (sizeCm) => {
      if (!sizeCm) return "Unknown";
      if (sizeCm < 1) return "Crayling (< 1 month)";
      if (sizeCm >= 1 && sizeCm < 3) return "Juvenile (1-3 months)";
      if (sizeCm >= 3 && sizeCm < 6) return "Sub-Adult (3-6 months)";
      return "Breeder (> 6 months)";
  };

  // --- FORMAT DATE & TIME ---
  const formattedDate = scanTimestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = scanTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fullTimestamp = `${formattedDate} • ${formattedTime}`;

  const results = {
    // REAL DATA
    size: scanData ? `${scanData.width_cm}cm (W) x ${scanData.height_cm}cm (H)` : "Measurement Failed",
    
    // CALCULATED DATA
    age: scanData ? estimateAge(scanData.width_cm) : "Unknown",

    // MOCK DATA 
    gender: "Male",
    turbidity: "Clear (Low Turbidity)",
    algae: "Moderate Green Algae",
    scanDate: fullTimestamp, 
    confidence: 94.5
  };

  const mainColor = results.gender === "Female" ? '#E76F51' : '#3D5A80';

  // --- SAVE TO DATABASE ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'scan_result.jpg',
      });

      const captionText = `🦞 CrayAI Scan\n\n📏 Size: ${results.size}\n🎂 Age: ${results.age}\n💧 Water: ${results.turbidity}\n📅 Time: ${formattedTime}`;
      formData.append('caption', captionText);
      
      // SAVE LOCATION
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
          <TouchableOpacity style={styles.glassBtn} onPress={() => navigation.goBack()}>
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
                {activeTab === 'env' && <View style={[styles.activeIndicator, { backgroundColor: '#2A9D8F' }]} />}
            </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {activeTab === 'specimen' ? (
            // === TAB 1: SPECIMEN INFO ===
            <>
                {/* GENDER CARD */}
                <View style={[styles.card, styles.shadow]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>GENDER ID</Text>
                        <FontAwesome5 name={results.gender === "Female" ? "venus" : "mars"} size={20} color={mainColor} />
                    </View>
                    <Text style={[styles.bigResult, { color: mainColor }]}>{results.gender}</Text>
                    <Text style={styles.subResult}>Cherax quadricarinatus</Text>
                    
                    {/* Confidence */}
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

                {/* MORPHOMETRICS LIST */}
                <Text style={styles.sectionTitle}>Morphometrics</Text>
                <View style={styles.detailsList}>
                    <DetailRow icon="ruler-horizontal" label="Size Estimation" value={results.size} color={mainColor} />
                    <View style={styles.divider} />
                    <DetailRow icon="hourglass-half" label="Age Class" value={results.age} color="#F4A261" />
                </View>
            </>
          ) : (
            // === TAB 2: ENVIRONMENT INFO ===
            <>
                {/* WATER QUALITY CARD */}
                <View style={[styles.card, styles.shadow]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>WATER ANALYSIS</Text>
                        <Ionicons name="water" size={20} color="#4CC9F0" />
                    </View>
                    <View style={styles.envRow}>
                        <View style={styles.envItem}>
                            <MaterialCommunityIcons name="water-opacity" size={32} color="#4CC9F0" />
                            <Text style={styles.envLabel}>Turbidity</Text>
                            <Text style={styles.envValue}>{results.turbidity}</Text>
                        </View>
                        <View style={styles.verticalLine} />
                        <View style={styles.envItem}>
                            <MaterialCommunityIcons name="sprout" size={32} color="#2A9D8F" />
                            <Text style={styles.envLabel}>Algae</Text>
                            <Text style={styles.envValue}>{results.algae}</Text>
                        </View>
                    </View>
                </View>

                {/* LOG INFO */}
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

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Camera')}>
              <Text style={styles.secondaryText}>Discard</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

// Reusable Row Component
const DetailRow = ({ icon, label, value, color }) => (
  <View style={styles.detailRow}>
    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
      <FontAwesome5 name={icon} size={18} color={color} />
    </View>
    <View style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  activeTabItem: {},
  tabText: { fontSize: 15, fontWeight: '600', color: '#999' },
  activeTabText: { color: '#293241', fontWeight: '800' },
  activeIndicator: { position: 'absolute', bottom: -1, width: 40, height: 3, borderRadius: 3 },

  // Cards
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 25 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 12, color: '#999', fontWeight: '700', letterSpacing: 1 },
  bigResult: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  subResult: { fontSize: 14, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 15 },
  
  // Meter
  meterContainer: { gap: 8 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { fontSize: 13, color: '#555' },
  meterValue: { fontSize: 13, fontWeight: '800', color: '#333' },
  progressBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // Env Card specific
  envRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  envItem: { alignItems: 'center', gap: 5 },
  envLabel: { fontSize: 13, color: '#777', marginTop: 5 },
  envValue: { fontSize: 15, fontWeight: '700', color: '#333' },
  verticalLine: { width: 1, backgroundColor: '#EEE', height: '80%' },

  // Lists
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#293241', marginBottom: 15 },
  detailsList: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 30, elevation: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  detailValue: { fontSize: 15, color: '#293241', fontWeight: '600' },
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