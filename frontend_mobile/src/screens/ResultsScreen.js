import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av'; // ADDED: Video Player

export default function ResultsScreen({ route, navigation }) {
  // 1. EXTRACTED 'type' to know if it's a photo or video
  const { imageUri, type = 'image' } = route.params; 

  const aiResults = {
    gender: "Berried Female",
    size: "14.2 cm (Large)",
    maturity: "Adult",
    confidence: "98.4%",
    scanDate: new Date().toLocaleDateString()
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#293241" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- DYNAMIC MEDIA PREVIEW --- */}
        <View style={[styles.imageContainer, styles.shadow]}>
          
          {type === 'video' ? (
            <Video
              source={{ uri: imageUri }}
              style={styles.scannedMedia}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              isLooping
              shouldPlay // Auto-plays the scan
            />
          ) : (
            <Image source={{ uri: imageUri }} style={styles.scannedMedia} />
          )}

          <View style={styles.confidenceBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#FFF" />
            <Text style={styles.confidenceText}>{aiResults.confidence} Match</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Classification Details</Text>

        <View style={styles.resultsGrid}>
          <View style={[styles.resultCard, styles.shadow]}>
            <View style={[styles.iconBox, { backgroundColor: '#FFDDD2' }]}>
              <Ionicons name="egg" size={26} color="#E76F51" />
            </View>
            <Text style={styles.resultLabel}>Gender Status</Text>
            <Text style={[styles.resultValue, { color: '#E76F51' }]}>{aiResults.gender}</Text>
          </View>

          <View style={[styles.resultCard, styles.shadow]}>
            <View style={[styles.iconBox, { backgroundColor: '#E0FBFC' }]}>
              <MaterialCommunityIcons name="ruler" size={26} color="#3D5A80" />
            </View>
            <Text style={styles.resultLabel}>Estimated Size</Text>
            <Text style={styles.resultValue}>{aiResults.size}</Text>
          </View>

          <View style={[styles.resultCard, styles.shadow]}>
            <View style={[styles.iconBox, { backgroundColor: '#D8F3DC' }]}>
              <FontAwesome5 name="chart-line" size={22} color="#2A9D8F" />
            </View>
            <Text style={styles.resultLabel}>Maturity</Text>
            <Text style={styles.resultValue}>{aiResults.maturity}</Text>
          </View>

          <View style={[styles.resultCard, styles.shadow]}>
            <View style={[styles.iconBox, { backgroundColor: '#F0F3F4' }]}>
              <Ionicons name="calendar" size={24} color="#546E7A" />
            </View>
            <Text style={styles.resultLabel}>Scan Date</Text>
            <Text style={styles.resultValue}>{aiResults.scanDate}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, styles.shadow]}>
          <LinearGradient colors={['#3D5A80', '#293241']} style={styles.btnGradient}>
            <Ionicons name="cloud-upload-outline" size={22} color="#FFF" />
            <Text style={styles.btnText}>SAVE TO RECORDS</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.rescanBtn} onPress={() => navigation.navigate('Camera')}>
          <Text style={styles.rescanText}>Scan Another Crayfish</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, backgroundColor: '#FFF' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#293241' },
  imageContainer: { width: '100%', height: 320, backgroundColor: '#000', borderRadius: 25, overflow: 'hidden', marginBottom: 25, position: 'relative' },
  scannedMedia: { width: '100%', height: '100%', resizeMode: 'cover' }, // Renamed from scannedImage
  confidenceBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: '#2A9D8F', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
  confidenceText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#293241', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15, marginBottom: 35 },
  resultCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 20, padding: 18, alignItems: 'center' },
  iconBox: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  resultLabel: { fontSize: 13, color: '#7F8C8D', fontWeight: '500', marginBottom: 6 },
  resultValue: { fontSize: 16, fontWeight: '800', color: '#2C3E50', textAlign: 'center' },
  saveBtn: { borderRadius: 15, overflow: 'hidden', marginBottom: 15 },
  btnGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 10 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1.2 },
  rescanBtn: { paddingVertical: 15, alignItems: 'center' },
  rescanText: { color: '#3D5A80', fontSize: 15, fontWeight: '700' },
  shadow: {
    ...Platform.select({
      ios: { shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  }
});