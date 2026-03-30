import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import API from '../../../../services/api';

import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';

import * as FileSystem from 'expo-file-system/legacy';

type Voter = {
  _id: string;
  name: string;
  epic_id: string;
  address: string;
};

export default function AlphabeticalReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVoters();
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/reports/list/alphabetical?search=${search}&limit=50`);
      setVoters(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const response = await API.get(`/reports/list/alphabetical?search=${search}&limit=10000`);
      const dataToExport = response.data;

      if (!dataToExport || dataToExport.length === 0) {
        Alert.alert("Info", "No data to export");
        return;
      }

      const excelData = dataToExport.map((v: Voter, index: number) => ({
        "Sr No": index + 1,
        "Name": v.name,
        "EPIC ID": v.epic_id,
        "Address": v.address
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Voters");
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      const fileName = `Alphabetical_Report_${Date.now()}.xlsx`;
      
      const fileDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;

      if (!fileDir) {
        throw new Error("Storage not available on this device.");
      }

      const uri = fileDir + fileName;

      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64 
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Download Voter Report',
        UTI: 'com.microsoft.excel.xlsx'
      });

    } catch (error: any) {
      console.error("Download Error:", error);
      Alert.alert("Error", "Failed to generate Excel file: " + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const renderItem = ({ item }: { item: Voter }) => (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.voterName}>{item.name}</Text>
        <Text style={styles.voterId}>{item.epic_id}</Text>
        <Text style={styles.voterAddress} numberOfLines={1}>{item.address}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6600" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>अल्फाबेटिकल रिपोर्ट</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="नावाने शोधा..."
            value={search}
            onChangeText={setSearch}
            style={styles.input}
          />
          <MaterialCommunityIcons name="magnify" size={22} color="#FF6600" />
        </View>
        <TouchableOpacity style={styles.sortBox}>
          <Text style={styles.sortText}>A-Z</Text>
          <MaterialCommunityIcons name="arrow-up-down" size={16} color="#FF6600" />
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={voters}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.centerArea}>
                <Text style={styles.emptyText}>डेटा उपलब्ध नाही</Text>
              </View>
            }
          />
        )}
      </View>

      <TouchableOpacity 
        style={[styles.xlsFab, downloading && { backgroundColor: '#1B5E20' }]} 
        onPress={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator size="small" color="#fff" style={{marginRight: 6}} />
        ) : (
          <MaterialCommunityIcons name="file-excel-box" size={24} color="#fff" />
        )}
        <Text style={styles.xlsText}>
          {downloading ? "Exporting..." : "XLS"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#F2F2F2' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: '#000' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 5, marginBottom: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, borderRadius: 10, height: 45, elevation: 2 },
  input: { flex: 1, fontSize: 14, color: '#333' },
  sortBox: { flexDirection: 'row', alignItems: 'center', marginLeft: 10, padding: 10 },
  sortText: { color: '#FF6600', fontWeight: '600', marginRight: 4 },
  listContainer: { flex: 1, paddingHorizontal: 15 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardIcon: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#FF6600' },
  cardContent: { flex: 1 },
  voterName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  voterId: { fontSize: 12, color: '#FF6600', fontWeight: '600', marginBottom: 2 },
  voterAddress: { fontSize: 12, color: '#666' },
  centerArea: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },
  xlsFab: { position: 'absolute', right: 20, bottom: 30, backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30, elevation: 6 },
  xlsText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 14 },
});