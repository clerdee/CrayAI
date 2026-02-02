import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  StatusBar,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

export default function ResultsScreen({ route, navigation }) {
  const { imageUri, type = 'image' } = route.params; 
  const video = useRef(null);
  const [status, setStatus] = useState({});

  // Mock Data
  const aiResults = {
    gender: "Female (Berried)", // "Berried" means carrying eggs
    scientificName: "Cherax quadricarinatus",
    size: "14.2 cm",
    maturity: "Adult / Reproductively Active",
    confidence: 98.4,
    scanDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  // Helper to determine color based on gender
  const getGenderColor = (g) => {
    if (g.includes("Female")) return '#E76F51'; // Coral for female
    if (g.includes("Male")) return '#3D5A80';   // Blue for male
    return '#2A9D8F';
  };

  const mainColor = getGenderColor(aiResults.gender);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* --- 1. IMMERSIVE HEADER (MEDIA) --- */}
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
            onPlaybackStatusUpdate={status => setStatus(() => status)}
          />
        ) : (
          <Image source={{ uri: imageUri }} style={styles.media} />
        )}
        
        {/* Gradient Overlay for text readability at top */}
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient} />

        {/* Navigation Header */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.glassBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.glassBtn}>
            <Ionicons name="share-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- 2. BOTTOM SHEET CONTENT --- */}
      <View style={styles.bottomSheetContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          
          {/* DRAG HANDLE VISUAL */}
          <View style={styles.dragHandle} />

          {/* MAIN VERDICT CARD */}
          <View style={[styles.verdictCard, styles.shadow]}>
             <View style={styles.verdictHeader}>
               <Text style={styles.verdictLabel}>IDENTIFICATION RESULT</Text>
               <Ionicons name="checkmark-circle" size={20} color={mainColor} />
             </View>
             
             <Text style={[styles.primaryResult, { color: mainColor }]}>{aiResults.gender}</Text>
             <Text style={styles.scientificName}>{aiResults.scientificName}</Text>

             {/* Visual Confidence Meter */}
             <View style={styles.meterContainer}>
               <View style={styles.meterLabels}>
                 <Text style={styles.meterLabel}>AI Confidence</Text>
                 <Text style={styles.meterValue}>{aiResults.confidence}%</Text>
               </View>
               <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${aiResults.confidence}%`, backgroundColor: mainColor }]} />
               </View>
             </View>
          </View>

          {/* DETAILS LIST */}
          <Text style={styles.sectionTitle}>Specimen Details</Text>
          
          <View style={styles.detailsList}>
            <DetailRow 
              icon="ruler" 
              label="Estimated Size" 
              value={aiResults.size} 
              color="#3D5A80" 
            />
            <View style={styles.divider} />
            <DetailRow 
              icon="chart-timeline-variant" 
              label="Maturity Stage" 
              value={aiResults.maturity} 
              color="#2A9D8F" 
            />
            <View style={styles.divider} />
            <DetailRow 
              icon="calendar-clock" 
              label="Scan Date" 
              value={aiResults.scanDate} 
              color="#546E7A" 
            />
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={[styles.saveBtn, styles.shadow]}>
              <LinearGradient 
                colors={['#293241', '#3D5A80']} 
                start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                style={styles.saveGradient}
              >
                <Feather name="save" size={20} color="#FFF" />
                <Text style={styles.saveText}>Save Record</Text>
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

// Helper Component for List Rows
const DetailRow = ({ icon, label, value, color }) => (
  <View style={styles.detailRow}>
    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <View style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // --- MEDIA HEADER ---
  mediaHeader: { height: '45%', width: '100%', position: 'relative' },
  media: { width: '100%', height: '100%', backgroundColor: '#222' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  navBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' },

  // --- BOTTOM SHEET ---
  bottomSheetContainer: { 
    flex: 1, 
    marginTop: -40, // Negative margin to overlap media
    backgroundColor: '#F8F9FA', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    overflow: 'hidden'
  },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40, paddingTop: 15 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 2.5, alignSelf: 'center', marginBottom: 20 },

  // --- MAIN VERDICT CARD ---
  verdictCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 30 },
  verdictHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  verdictLabel: { fontSize: 12, color: '#999', fontWeight: '700', letterSpacing: 1 },
  primaryResult: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  scientificName: { fontSize: 14, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 20 },
  
  meterContainer: { gap: 8 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { fontSize: 13, color: '#555', fontWeight: '600' },
  meterValue: { fontSize: 13, color: '#293241', fontWeight: '800' },
  progressBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // --- DETAILS ---
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#293241', marginBottom: 15 },
  detailsList: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 30, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }) },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  detailValue: { fontSize: 15, color: '#293241', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8, marginLeft: 60 },

  // --- ACTIONS ---
  actionContainer: { gap: 12 },
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 10 },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 15, alignItems: 'center' },
  secondaryText: { color: '#999', fontSize: 15, fontWeight: '600' },

  shadow: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20 },
      android: { elevation: 5 },
    }),
  }
});