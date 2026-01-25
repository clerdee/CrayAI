import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Switch, SafeAreaView, Platform, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function EmailPreferencesScreen() {
  const navigation = useNavigation();

  const [preferences, setPreferences] = useState({
    securityAlerts: true,
    communityUpdates: true,
    weeklyDigest: false,
    promotions: false,
    newMessages: true,
  });

  const toggleSwitch = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    Alert.alert("Preferences Saved", "Your email preferences have been updated successfully.");
    navigation.goBack();
  };

  const PreferenceRow = ({ title, description, switchKey, disabled = false }) => (
    <View style={styles.row}>
      <View style={styles.textContainer}>
        <Text style={[styles.rowTitle, disabled && { color: '#95A5A6' }]}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: "#E0E0E0", true: "#3D5A80" }}
        thumbColor={Platform.OS === 'ios' ? "#FFF" : preferences[switchKey] ? "#FFF" : "#F4F3F4"}
        ios_backgroundColor="#E0E0E0"
        onValueChange={() => toggleSwitch(switchKey)}
        value={preferences[switchKey]}
        disabled={disabled}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#293241" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Preferences</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageDescription}>
          Control the types of emails you receive from CrayAI.
        </Text>

        {/* SECTION 1: Essential & Account */}
        <Text style={styles.sectionHeader}>Account & Security</Text>
        <View style={styles.card}>
          <PreferenceRow 
            title="Security Alerts" 
            description="Notifications about login attempts and password changes." 
            switchKey="securityAlerts" 
            disabled={true}
          />
          <View style={styles.divider} />
          <PreferenceRow 
            title="Direct Messages" 
            description="When another researcher sends you a direct message." 
            switchKey="newMessages" 
          />
        </View>

        {/* SECTION 2: Community & Content */}
        <Text style={styles.sectionHeader}>Community & Content</Text>
        <View style={styles.card}>
          <PreferenceRow 
            title="Community Updates" 
            description="Announcements, new features, and patch notes." 
            switchKey="communityUpdates" 
          />
          <View style={styles.divider} />
          <PreferenceRow 
            title="Weekly Digest" 
            description="A summary of trending research and discussions." 
            switchKey="weeklyDigest" 
          />
          <View style={styles.divider} />
          <PreferenceRow 
            title="Promotions & Offers" 
            description="Upgrades, premium features, and partner offers." 
            switchKey="promotions" 
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FIXED BOTTOM BUTTON */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7'
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#293241' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  pageDescription: { fontSize: 14, color: '#7F8C8D', marginBottom: 25, lineHeight: 20 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#3D5A80', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 5 },
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  textContainer: { flex: 1, paddingRight: 15 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#293241', marginBottom: 4 },
  rowDesc: { fontSize: 13, color: '#95A5A6', lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#F4F7F9', marginVertical: 5 },
  bottomContainer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EDF2F7' },
  saveButton: { backgroundColor: '#3D5A80', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});