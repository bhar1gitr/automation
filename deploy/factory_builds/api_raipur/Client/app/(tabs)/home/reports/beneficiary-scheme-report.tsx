import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import API from '../../../../services/api';

// IMPORTS FOR EXCEL
import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';
import { cacheDirectory, documentDirectory } from 'expo-file-system';
import { writeAsStringAsync } from 'expo-file-system/legacy';

type SchemeItem = {
  id: string;
  name: string;
  count: number;
};

export default function BeneficiarySchemeReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [fullData, setFullData] = useState<SchemeItem[]>([]);
  const [filteredData, setFilteredData] = useState<SchemeItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = fullData.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(fullData);
    }
  }, [search, fullData]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await API.get('/reports/schemes');
      setFullData(response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      if (filteredData.length === 0) {
        Alert.alert("Info", "No data to export");
        return;
      }

      const excelData = filteredData.map((item) => ({
        "Scheme Name": item.name,
        "Beneficiaries Count": item.count
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Schemes_Report");
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      const fileName = `Scheme_Report_${Date.now()}.xlsx`;
      const fileDir = cacheDirectory || documentDirectory;
      
      if (!fileDir) throw new Error("Storage not available");
      
      const uri = fileDir + fileName;

      await writeAsStringAsync(uri, wbout, { encoding: "base64" });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Download Scheme Report',
        UTI: 'com.microsoft.excel.xlsx'
      });
    } catch (error: any) {
      Alert.alert("Error", "Export failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#EFEFEF" barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#FF6600" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beneficiary (Scheme) Report</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search Scheme..."
          placeholderTextColor="#999"
          style={styles.input}
          value={search}
          onChangeText={setSearch}
        />
        <MaterialCommunityIcons name="magnify" size={22} color="#FF6600" />
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortText}>A–Z</Text>
        <MaterialCommunityIcons name="swap-vertical" size={18} color="#FF6600" />
      </View>

      {loading ? (
        <View style={styles.center}>
           <ActivityIndicator size="large" color="#FF6600" />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No beneficiary data available</Text>
              <Text style={styles.subEmptyText}>Add schemes to voters to see them here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="hand-heart" size={24} color="#FF6600" />
              </View>
              <View style={styles.info}>
                <Text style={styles.schemeName}>{item.name}</Text>
              </View>
              <View style={styles.countBadge}>
                 <Text style={styles.countText}>{item.count}</Text>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.fabContainer}>
        {filteredData.length > 0 && (
          <TouchableOpacity 
             style={[styles.fab, { backgroundColor: '#2E7D32' }]}
             onPress={handleDownload}
             disabled={downloading}
          >
             {downloading ? (
                <ActivityIndicator color="#fff" size="small" />
             ) : (
                <Text style={styles.fabText}>XLS</Text>
             )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFEFEF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 15, marginTop: 10, paddingHorizontal: 15,
    borderRadius: 25, height: 45, elevation: 1
  },
  input: { flex: 1, fontSize: 14 },

  sortRow: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 10, marginBottom: 5
  },
  sortText: { color: '#FF6600', fontWeight: '600', marginRight: 5 },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 12,
    elevation: 2
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF3E0',
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  info: { flex: 1 },
  schemeName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  countBadge: {
    backgroundColor: '#FF6600', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12
  },
  countText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  emptyBox: {
    alignItems: 'center', marginTop: 100, padding: 20
  },
  emptyText: { color: '#666', fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  subEmptyText: { color: '#999', fontSize: 13, marginTop: 5 },

  fabContainer: {
    position: 'absolute', right: 20, bottom: 90, alignItems: 'center', gap: 12,
  },
  fab: {
    width: 55, height: 55, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});