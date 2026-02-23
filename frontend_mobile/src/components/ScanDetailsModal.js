import React from 'react';
import { 
  Modal, View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, Dimensions, Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // <--- IMPORT THIS
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export default function ScanDetailsModal({ visible, onClose, scan }) {
  const navigation = useNavigation(); // <--- ENABLE NAVIGATION

  if (!scan) return null;

  const dateObj = new Date(scan.createdAt);
  const date = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Data Fallbacks
  const gender = scan.gender || 'Not Defined';
  const confidence = scan.gender_confidence || 0; 
  const age = scan.morphometrics?.estimated_age || 'Unknown';
  
  // Height Conversions
  const height_cm = scan.morphometrics?.height_cm || 0;
  const height_in = (height_cm / 2.54).toFixed(2);
  
  // Width Conversions
  const width_cm = scan.morphometrics?.width_cm || 0;
  const width_in = (width_cm / 2.54).toFixed(2);

  const turbidity = scan.environment?.turbidity_level || 1;
  const algae = scan.environment?.algae_label || 'Low';
  const location = scan.location || 'Unknown Location';
  const model = scan.model_version || 'CrayAI v1.0';
  const processingTime = scan.processing_time || 'N/A';

  // Dynamic Colors & Icons
  const turbidityColor = turbidity > 6 ? '#E76F51' : '#3D5A80';
  const algaeColor = (algae === 'High' || algae === 'Critical') ? '#E11A22' : '#0FA958';
  
  // Gender Logic
  const isFemale = gender === 'Female' || gender === 'Berried';
  const isMale = gender === 'Male';
  const genderColor = isFemale ? '#E76F51' : isMale ? '#3D5A80' : '#95A5A6';
  const genderIcon = isFemale ? 'venus' : isMale ? 'mars' : 'genderless';

  // --- NEW: HANDLE SHARE LOGIC ---
  const handlePostToFeed = () => {
    onClose(); // Close modal first
    
    // Auto-generate caption from saved data
    const genderText = gender !== "Not Defined" ? gender : "";
    const caption = `Shared from my history! 🕰️\n\nFound a ${genderText} Crayfish 🦞\n📏 Size: ${width_cm}cm W x ${height_cm}cm H\n🎂 Age: ${age}\n💧 Water Turbidity: Level ${turbidity}\n🌿 Algae: ${algae}`;

    // Navigate to Community Screen with pre-filled data
    navigation.navigate('Community', {
        prefillImage: scan.image?.url,
        prefillCaption: caption
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          
          {/* Header Image Section */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: scan.image?.url }} style={styles.image} resizeMode="cover" />
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient} />
            
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.idBadge}>
                <Text style={styles.idText}>ID: {scan.scanId}</Text>
            </View>
          </View>

          {/* Scrollable Details */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Primary Classification (Age, Gender, Confidence) */}
            <View style={styles.headerSection}>
                <Text style={styles.mainTitle}>{age}</Text>
                
                <View style={styles.metaBadgeRow}>
                    {/* Gender Badge */}
                    <View style={[styles.badge, { backgroundColor: genderColor + '15' }]}>
                        <FontAwesome5 name={genderIcon} size={14} color={genderColor} />
                        <Text style={[styles.badgeText, { color: genderColor }]}>{gender}</Text>
                    </View>

                    {/* Confidence Badge */}
                    {confidence > 0 && (
                      <View style={[styles.badge, { backgroundColor: '#F0F0F0' }]}>
                          <MaterialCommunityIcons name="bullseye-arrow" size={16} color="#7F8C8D" />
                          <Text style={[styles.badgeText, { color: '#7F8C8D' }]}>{confidence}% Conf.</Text>
                      </View>
                    )}
                </View>
            </View>

            {/* Main Stats Grid */}
            <View style={styles.gridContainer}>
                <View style={styles.gridBox}>
                    <MaterialCommunityIcons name="ruler-square" size={24} color="#3D5A80" />
                    <Text style={styles.gridLabel}>Height</Text>
                    <Text style={styles.gridValue}>{height_cm} cm</Text>
                    <Text style={styles.gridSubValue}>({height_in} in)</Text>
                </View>

                <View style={styles.gridBox}>
                    <MaterialCommunityIcons name="ruler" size={24} color="#3D5A80" />
                    <Text style={styles.gridLabel}>Width</Text>
                    <Text style={styles.gridValue}>{width_cm} cm</Text>
                    <Text style={styles.gridSubValue}>({width_in} in)</Text>
                </View>

                <View style={styles.gridBox}>
                    <MaterialCommunityIcons name="water-opacity" size={24} color={turbidityColor} />
                    <Text style={styles.gridLabel}>Turbidity</Text>
                    <Text style={[styles.gridValue, {color: turbidityColor}]}>Lvl {turbidity}</Text>
                    <Text style={styles.gridSubValue}>Water Clarity</Text>
                </View>

                <View style={styles.gridBox}>
                    <MaterialCommunityIcons name="sprout" size={24} color={algaeColor} />
                    <Text style={styles.gridLabel}>Algae</Text>
                    <Text style={[styles.gridValue, {color: algaeColor}]}>{algae}</Text>
                    <Text style={styles.gridSubValue}>Risk Level</Text>
                </View>
            </View>

            {/* Detailed Rows */}
            <Text style={styles.sectionTitle}>Scan Metadata</Text>
            <View style={styles.detailsList}>
                <DetailRow icon="calendar-alt" label="Date Scanned" value={date} subValue={time} color="#546E7A" />
                <View style={styles.divider} />
                <DetailRow icon="map-marker-alt" label="Location" value={location} color="#E76F51" />
            </View>

            <Text style={styles.sectionTitle}>System Logs</Text>
            <View style={styles.detailsList}>
                <DetailRow icon="microchip" label="AI Model" value={model} color="#3D5A80" />
                <View style={styles.divider} />
                <DetailRow icon="stopwatch" label="Processing Time" value={processingTime} color="#F4A261" />
            </View>

            {/* Padding for the fixed footer */}
            <View style={{height: 100}} />
          </ScrollView>

          {/* --- NEW: FIXED BOTTOM SHARE BUTTON --- */}
          <View style={styles.footerAction}>
            <TouchableOpacity style={styles.shareBtn} onPress={handlePostToFeed}>
                <LinearGradient 
                    colors={['#E76F51', '#D65A31']} 
                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                    style={styles.shareBtnGradient}
                >
                    <Ionicons name="share-social" size={20} color="#FFF" />
                    <Text style={styles.shareBtnText}>Post to Community Feed</Text>
                </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// Reusable Detail Row Component
const DetailRow = ({ icon, label, value, subValue, color }) => (
  <View style={styles.detailRow}>
    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <FontAwesome5 name={icon} size={16} color={color} />
    </View>
    <View style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      {subValue && <Text style={styles.detailSubValue}>{subValue}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { height: height * 0.9, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  
  imageContainer: { width: '100%', height: height * 0.35, backgroundColor: '#000' },
  image: { width: '100%', height: '100%' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  
  closeBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 40 : 20, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  idBadge: { position: 'absolute', bottom: 15, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  idText: { color: '#FFF', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  scrollContent: { padding: 25 },
  
  headerSection: { marginBottom: 20 },
  mainTitle: { fontSize: 26, fontWeight: '900', color: '#293241', marginBottom: 8 },
  
  metaBadgeRow: { flexDirection: 'row', gap: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  badgeText: { fontSize: 13, fontWeight: '700' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25, gap: 10 },
  gridBox: { width: '48%', backgroundColor: '#FFF', padding: 15, borderRadius: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width: 0, height: 2}, marginBottom: 5 },
  gridLabel: { fontSize: 11, color: '#95A5A6', fontWeight: '600', marginTop: 8, marginBottom: 2 },
  gridValue: { fontSize: 15, fontWeight: '800', color: '#2C3E50', textAlign: 'center' },
  gridSubValue: { fontSize: 10, color: '#95A5A6', fontWeight: '500', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: '#293241', marginTop: 5 },
  detailsList: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  iconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#95A5A6', textTransform: 'uppercase', fontWeight: '700', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#293241' },
  detailSubValue: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 53, marginVertical: 5 },

  // --- NEW FOOTER STYLES ---
  footerAction: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0', elevation: 20, shadowColor: '#000', shadowOffset: {width:0, height: -5}, shadowOpacity: 0.1, shadowRadius: 10 },
  shareBtn: { borderRadius: 16, overflow: 'hidden', elevation: 5 },
  shareBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  shareBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});