import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import API from '../../../../services/api';
import { getSurnameReportOffline } from '../../../../db/sqliteService';

const BOOTH_NUMBERS = ['All', '285', '286', '287', '288', '289', '290', '291', '292'];

export default function SurnameReport() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBooth, setSelectedBooth] = useState('All');
  const [isOffline, setIsOffline] = useState(false);

  useFocusEffect(
    useCallback(() => { fetchData(); }, [selectedBooth])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Try Online
      const res = await API.get('/reports/surname', { params: { booth: selectedBooth } });
      setData(res.data);
      setFilteredData(res.data);
      setIsOffline(false);
    } catch {
      // 2. Fallback Offline
      const localData = await getSurnameReportOffline(selectedBooth);
      setData(localData);
      setFilteredData(localData);
      setIsOffline(true);
    } finally { setLoading(false); }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const query = text.toLowerCase().trim();
    if (!query) { setFilteredData(data); return; }
    const filtered = data.filter((item) => (item._id || '').toLowerCase().includes(query));
    setFilteredData(filtered);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6600" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('surname_report_title')}</Text>
          <Text style={[styles.modeText, { color: isOffline ? '#4CAF50' : '#2196F3' }]}>
            {isOffline ? "● Offline Mode" : "● Live Mode"}
          </Text>
        </View>
      </View>

      <View style={styles.boothSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boothScroll}>
          {BOOTH_NUMBERS.map((booth) => (
            <TouchableOpacity
              key={booth}
              style={[styles.boothChip, selectedBooth === booth && styles.activeBoothChip]}
              onPress={() => setSelectedBooth(booth)}
            >
              <Text style={[styles.boothText, selectedBooth === booth && styles.activeBoothText]}>
                {booth === 'All' ? t('all_booths') : t('booth_chip', { num: booth })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput style={styles.searchInput} placeholder={t('search_surname_placeholder')} value={search} onChangeText={handleSearch} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, i) => i.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push({ pathname: "/home/reports/surname-voter-print", params: { surname: item._id, booth: selectedBooth } })}>
              <Text style={styles.cellSr}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cellSurname}>{item._id || 'Unknown'}</Text>
                <Text style={styles.subText}>{t('click_to_view_list')}</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.cellCount}>{item.count}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#FF6600" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', padding: 15, alignItems: 'center', backgroundColor: '#fff' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    modeText: { fontSize: 10, marginLeft: 10, fontWeight: 'bold' },
    boothSelectorContainer: { height: 50, backgroundColor: '#fff', paddingVertical: 8 },
    boothScroll: { paddingHorizontal: 15 },
    boothChip: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#F0F0F0', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#E0E0E0' },
    activeBoothChip: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
    boothText: { fontSize: 13, color: '#555' },
    activeBoothText: { color: '#fff' },
    searchContainer: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 10, paddingHorizontal: 12, height: 45 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#333' },
    row: { flexDirection: 'row', padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
    cellSr: { width: 40, color: '#999' },
    cellSurname: { fontSize: 16, fontWeight: '600', color: '#333' },
    subText: { fontSize: 11, color: '#999' },
    countBadge: { flexDirection: 'row', alignItems: 'center' },
    cellCount: { fontSize: 16, color: '#FF6600', fontWeight: 'bold', marginRight: 5 }
});