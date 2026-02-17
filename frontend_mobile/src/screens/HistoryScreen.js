import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ActivityIndicator, StatusBar, SafeAreaView, RefreshControl, Platform, Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SwipeListView } from 'react-native-swipe-list-view';

import client from '../api/client';
// 1. Modal is imported
import ScanDetailsModal from '../components/ScanDetailsModal';

const ITEMS_PER_PAGE = 10;
const AGE_FILTERS = ['All', 'Crayling', 'Juvenile', 'Sub-Adult', 'Adult'];
const MAIN_FILTERS = ['All', 'Favorites', 'Deleted'];

export default function HistoryScreen({ navigation }) {
  const [allScans, setAllScans] = useState([]); 
  const [filteredScans, setFilteredScans] = useState([]); 
  const [displayedScans, setDisplayedScans] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal States
  const [selectedScan, setSelectedScan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [mainFilter, setMainFilter] = useState('All'); 
  const [ageFilter, setAgeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [page, setPage] = useState(1);

  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [notification, setNotification] = useState({ visible: false, message: '', type: 'info' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showNotification = (message, type = 'info') => {
    setNotification({ visible: true, message, type });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setNotification({ visible: false, message: '', type: 'info' });
      });
    }, 2500);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await client.get('/scans/me');
      if (res.data?.success) {
        const mappedData = res.data.records.map(r => ({
            ...r,
            isFavorite: r.isFavorite || false,
            isDeleted: r.isDeleted || false,
        }));
        setAllScans(mappedData);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const toggleFavorite = async (rowKey, rowMap) => {
    if (rowMap[rowKey]) rowMap[rowKey].closeRow();
    
    const item = allScans.find(s => s._id === rowKey);
    const newFavState = !item.isFavorite;

    setAllScans(prev => prev.map(item => item._id === rowKey ? { ...item, isFavorite: newFavState } : item));
    showNotification(newFavState ? "Added to Favorites 🌟" : "Removed from Favorites", "info");

    try {
        await client.patch(`/scans/${rowKey}/favorite`);
    } catch (error) {
        console.error("Failed to save favorite status:", error);
        showNotification("Error saving action.", "warning");
    }
  };

  const toggleDelete = async (rowKey, rowMap) => {
    if (rowMap[rowKey]) rowMap[rowKey].closeRow();
    
    setAllScans(prev => prev.map(item => item._id === rowKey ? { ...item, isDeleted: true } : item));
    showNotification("Moved to Deleted 🗑️", "warning");

    try {
        await client.patch(`/scans/${rowKey}/delete`);
    } catch (error) {
        console.error("Failed to delete record:", error);
        showNotification("Error deleting record.", "warning");
    }
  };

  const restoreItem = async (rowKey, rowMap) => {
    if (rowMap[rowKey]) rowMap[rowKey].closeRow();
    
    setAllScans(prev => prev.map(item => item._id === rowKey ? { ...item, isDeleted: false } : item));
    showNotification("Record Restored ♻️", "info");

    try {
        await client.patch(`/scans/${rowKey}/delete`);
    } catch (error) {
        console.error("Failed to restore record:", error);
        showNotification("Error restoring record.", "warning");
    }
  };

  useEffect(() => {
    let result = [...allScans];

    if (mainFilter === 'Deleted') {
        result = result.filter(s => s.isDeleted);
    } else {
        result = result.filter(s => !s.isDeleted); 
        if (mainFilter === 'Favorites') {
            result = result.filter(s => s.isFavorite);
        }
    }

    if (ageFilter !== 'All') {
      result = result.filter(s => s.morphometrics?.estimated_age?.includes(ageFilter));
    }

    if (selectedDate) {
      result = result.filter(s => {
          const itemDate = new Date(s.createdAt).toDateString();
          return itemDate === selectedDate.toDateString();
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredScans(result);
    setDisplayedScans(result.slice(0, ITEMS_PER_PAGE));
    setPage(1);
  }, [mainFilter, ageFilter, sortOrder, selectedDate, allScans]);

  const handleLoadMore = () => {
    if (displayedScans.length < filteredScans.length) {
      const nextPage = page + 1;
      const nextItems = filteredScans.slice(0, nextPage * ITEMS_PER_PAGE);
      setDisplayedScans(nextItems);
      setPage(nextPage);
    }
  };

  const handleDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (selected) {
        setSelectedDate(selected);
    }
  };

  const renderFooter = () => {
    if (loading || filteredScans.length === 0) return null;
    if (displayedScans.length < filteredScans.length) {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator size="small" color="#3D5A80" />
        </View>
      );
    } else {
      return (
        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
          <Text style={styles.endText}>— This is the end of the records —</Text>
        </View>
      );
    }
  };

  // --- 2. FIXED: RENDER ITEM WITH ONPRESS ACTION ---
  const renderItem = (data) => {
    const item = data.item;
    const dateObj = new Date(item.createdAt);
    const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const turbidityLevel = item.environment?.turbidity_level || 1;
    const algaeLabel = item.environment?.algae_label || 'Low';
    const height = item.morphometrics?.height_cm || 0;
    const width = item.morphometrics?.width_cm || 0;
    
    const gender = item.gender || 'Not Defined'; 
    const age = item.morphometrics?.estimated_age || 'Unknown';
    const shortAge = age.split(' ')[0]; 

    const turbidityColor = turbidityLevel > 6 ? '#E76F51' : '#3D5A80';
    const algaeColor = (algaeLabel === 'High' || algaeLabel === 'Critical') ? '#E11A22' : '#2A9D8F';
    const genderColor = gender === 'Male' ? '#8AB4F8' : gender === 'Female' ? '#E76F51' : gender === 'Berried' ? '#2A9D8F' : '#293241';

    return (
      <View style={styles.cardWrapper}>
        {/* ADDED TOUCHABLE OPACITY TO TRIGGER MODAL */}
        <TouchableOpacity 
            style={styles.cardInner}
            activeOpacity={0.8}
            onPress={() => {
                setSelectedScan(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.numberContainer}>
                <Text style={styles.numberText}>#{data.index + 1}</Text>
            </View>

            <Image source={{ uri: item.image?.url }} style={styles.thumbnail} />
            
            <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.scanId}>{item.scanId || 'Unknown ID'}</Text>
                        {item.isFavorite && <MaterialCommunityIcons name="star" size={14} color="#F1C40F" style={{marginTop: 2}} />}
                    </View>
                    <View style={styles.dateTimeContainer}>
                        <Text style={styles.dateText}>{date}</Text>
                        <Text style={styles.timeText}>{time}</Text>
                    </View>
                </View>
                
                <Text style={styles.classificationText}>
                    <Text style={{color: genderColor}}>{gender}</Text> 
                    <Text style={styles.dividerDot}> • </Text> 
                    {shortAge}
                </Text>

                <Text style={styles.sizeText}>H: {height}cm • W: {width}cm</Text>

                <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: `${turbidityColor}15` }]}>
                    <MaterialCommunityIcons name="water-opacity" size={14} color={turbidityColor} />
                    <Text style={[styles.badgeText, { color: turbidityColor }]}>Turbidity: {turbidityLevel}</Text>
                    </View>
                    
                    <View style={[styles.badge, { backgroundColor: `${algaeColor}15` }]}>
                    <MaterialCommunityIcons name="sprout" size={14} color={algaeColor} />
                    <Text style={[styles.badgeText, { color: algaeColor }]}>{algaeLabel}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHiddenItem = (data, rowMap) => {
    const item = data.item;

    if (mainFilter === 'Deleted') {
        return (
            <View style={styles.rowBack}>
                <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRestore]} onPress={() => restoreItem(item._id, rowMap)}>
                    <MaterialCommunityIcons name="restore" size={24} color="#FFF" />
                    <Text style={styles.backTextWhite}>Restore</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
      <View style={styles.rowBack}>
        <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={() => toggleFavorite(item._id, rowMap)}>
          <MaterialCommunityIcons name={item.isFavorite ? "star-off" : "star"} size={26} color="#FFF" />
          <Text style={styles.backTextWhite}>{item.isFavorite ? 'Unstar' : 'Favorite'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={() => toggleDelete(item._id, rowMap)}>
          <MaterialCommunityIcons name="delete" size={24} color="#FFF" />
          <Text style={styles.backTextWhite}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {notification.visible && (
        <Animated.View style={[
            styles.toastContainer, 
            { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }
        ]}>
          <View style={[styles.toastBar, notification.type === 'warning' ? styles.toastWarning : styles.toastInfo]}>
            <Ionicons name={notification.type === 'warning' ? "trash" : "checkmark-circle"} size={20} color="#FFF" />
            <Text style={styles.toastText}>{notification.message}</Text>
          </View>
        </Animated.View>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#293241" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Scan History</Text>
            <Text style={styles.headerSub}>
                {filteredScans.length} {filteredScans.length === 1 ? 'Record' : 'Records'}
            </Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.controlPanel}>
        <View style={styles.mainFilterRow}>
            {MAIN_FILTERS.map(mf => (
                <TouchableOpacity 
                    key={mf} 
                    style={[styles.mainFilterBtn, mainFilter === mf && styles.mainFilterBtnActive]}
                    onPress={() => setMainFilter(mf)}
                >
                    <Text style={[styles.mainFilterText, mainFilter === mf && styles.mainFilterTextActive]}>{mf}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.controlHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                    <Feather name="calendar" size={16} color={selectedDate ? "#FFF" : "#3D5A80"} />
                    <Text style={[styles.dateBtnText, selectedDate && {color: '#FFF'}]}>
                        {selectedDate ? selectedDate.toLocaleDateString('en-US', {month: 'short', day:'numeric'}) : 'Filter Date'}
                    </Text>
                </TouchableOpacity>
                {selectedDate && (
                    <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.clearDateBtn}>
                        <Ionicons name="close-circle" size={18} color="#E76F51" />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.sortBtn} onPress={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#3D5A80" />
                <Text style={styles.sortBtnText}>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</Text>
                <MaterialCommunityIcons name={sortOrder === 'newest' ? "arrow-down" : "arrow-up"} size={16} color="#3D5A80" />
            </TouchableOpacity>
        </View>
        
        <View style={styles.chipWrapper}>
            {AGE_FILTERS.map((age) => {
                const isActive = ageFilter === age;
                return (
                    <TouchableOpacity key={age} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setAgeFilter(age)}>
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{age}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {loading ? (
        <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3D5A80" />
            <Text style={{marginTop: 10, color:'#95A5A6'}}>Fetching database...</Text>
        </View>
      ) : (
        <SwipeListView
          data={displayedScans}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          
          leftOpenValue={85} 
          rightOpenValue={-85} 
          disableLeftSwipe={mainFilter === 'Deleted'} 

          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3D5A80']} />
          }

          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Ionicons name={mainFilter === 'Deleted' ? "trash-outline" : "folder-open-outline"} size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No records found.</Text>
              <Text style={styles.emptySub}>Try adjusting your filters or date.</Text>
            </View>
          }
        />
      )}

      {/* 3. FIXED: ADDED MODAL COMPONENT AT THE BOTTOM OF THE SCREEN */}
      <ScanDetailsModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        scan={selectedScan} 
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  
  toastContainer: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 999, alignItems: 'center' },
  toastBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  toastWarning: { backgroundColor: '#E76F51' }, 
  toastInfo: { backgroundColor: '#2A9D8F' },    
  toastText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 10 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, backgroundColor: '#FFF',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#293241' },
  headerSub: { fontSize: 12, color: '#7F8C8D', fontWeight: '600', marginTop: 2 },
  headerPlaceholder: { width: 40 },
  
  controlPanel: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EAECEE' },
  
  mainFilterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  mainFilterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  mainFilterBtnActive: { borderBottomColor: '#3D5A80' },
  mainFilterText: { fontSize: 13, fontWeight: '600', color: '#95A5A6' },
  mainFilterTextActive: { color: '#3D5A80', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 15 },

  controlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  dateBtnText: { fontSize: 12, fontWeight: '700', color: '#3D5A80' },
  clearDateBtn: { padding: 4 },
  
  sortBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  sortBtnText: { fontSize: 12, fontWeight: '700', color: '#3D5A80' },
  
  chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F4F6F7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EAECEE' },
  chipActive: { backgroundColor: '#3D5A80', borderColor: '#3D5A80' },
  chipText: { fontSize: 12, color: '#7F8C8D', fontWeight: '600' },
  chipTextActive: { color: '#FFF', fontWeight: '700' },

  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#2C3E50', fontWeight: '700' },
  emptySub: { marginTop: 5, fontSize: 13, color: '#95A5A6' },
  endText: { fontSize: 13, color: '#95A5A6', fontWeight: '500', fontStyle: 'italic' },
  
  listContainer: { padding: 20, paddingBottom: 20 },
  
  rowBack: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    height: '90%'
  },
  backRightBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 85,
  },
  backRightBtnLeft: { backgroundColor: '#F1C40F', right: 0 },   
  backRightBtnRight: { backgroundColor: '#E76F51', left: 0 },    
  backRightBtnRestore: { backgroundColor: '#2A9D8F', left: 0 },  
  backTextWhite: { color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 4 },

  cardWrapper: { marginBottom: 15 },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAECEE',
    shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  numberContainer: { width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 5 },
  numberText: { fontSize: 16, fontWeight: '800', color: '#95A5A6' },
  thumbnail: { width: 90, height: 100, borderRadius: 14, backgroundColor: '#F0F0F0' },
  cardInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  scanId: { fontSize: 12, fontWeight: '800', color: '#3D5A80', marginTop: 2 },
  dateTimeContainer: { alignItems: 'flex-end' },
  dateText: { fontSize: 11, color: '#293241', fontWeight: '700' },
  timeText: { fontSize: 10, color: '#95A5A6', fontWeight: '500', marginTop: 2 },
  
  classificationText: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  dividerDot: { color: '#CBD5E1', fontWeight: '400' },

  sizeText: { fontSize: 13, color: '#7F8C8D', fontWeight: '500', marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' }
});