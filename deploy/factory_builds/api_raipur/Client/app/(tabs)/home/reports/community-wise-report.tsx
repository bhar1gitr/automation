import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import API from '../../../../services/api';
import { getCommunityReportOffline } from '../../../../db/sqliteService';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type CommunityItem = {
  id: string;
  name: string;
  count: number;
};

export default function CommunityReport() {
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [fullData, setFullData] = useState<CommunityItem[]>([]);
  const [filteredData, setFilteredData] = useState<CommunityItem[]>([]);
  const [search, setSearch] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [])
  );

  // Search Logic
  React.useEffect(() => {
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
      // 1. Try Online First
      const response = await API.get('/reports/community');
      setFullData(response.data);
      setFilteredData(response.data);
      setIsOffline(false);
    } catch (error) {
      console.log("Server error, trying offline classification...");
      // 2. Fallback to SQLite
      const localData = await getCommunityReportOffline();
      setFullData(localData as any);
      setFilteredData(localData as any);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const getHTMLContent = () => {
    const tableRows = filteredData.map((item, index) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.count}</td>
      </tr>`).join('');

    return `
      <html>
        <body style="font-family:sans-serif;padding:20px;">
          <h2 style="text-align:center;">${t('community_report_title')}</h2>
          <p style="text-align:center;">${isOffline ? 'Offline Data' : 'Live Data'}</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr style="background:#FF6600;color:white;">
              <th style="padding: 10px; border: 1px solid #ddd;">${t('sr_no')}</th>
              <th style="padding: 10px; border: 1px solid #ddd;">${t('community')}</th>
              <th style="padding: 10px; border: 1px solid #ddd;">${t('voters')}</th>
            </tr>
            ${tableRows}
          </table>
        </body>
      </html>`;
  };

  const handleExportPDF = async () => {
    try {
      if (filteredData.length === 0) return Alert.alert(t('info'), t('no_data_export'));
      const html = getHTMLContent();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (e) {
      Alert.alert(t('error'), "Failed to generate PDF");
    }
  };

  const handlePrint = async () => {
    try {
      if (filteredData.length === 0) return Alert.alert(t('info'), t('no_data_print'));
      const html = getHTMLContent();
      await Print.printAsync({ html });
    } catch (e) { Alert.alert(t('error'), "Print failed"); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#FF6600" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('community_report_title')}</Text>
          <Text style={[styles.modeText, { color: isOffline ? '#4CAF50' : '#2196F3' }]}>
            {isOffline ? "● Offline Mode" : "● Live Mode"}
          </Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          placeholder={t('search_community')}
          value={search}
          onChangeText={setSearch}
          style={styles.input}
          placeholderTextColor="#999"
        />
        <MaterialCommunityIcons name="magnify" size={22} color="#FF6600" />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6600" />
          <Text style={{ marginTop: 10, color: '#666' }}>Analyzing Surnames...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 160 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.right}>
                <Text style={styles.count}>{item.count}</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#FF6600" />
              </View>
            </View>
          )}
        />
      )}

      {!loading && (
        <View style={styles.fabGroup}>
          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: '#E91E63' }]} 
            onPress={handleExportPDF}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: '#0288D1', marginTop: 15 }]} 
            onPress={handlePrint}
          >
            <MaterialCommunityIcons name="printer" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  modeText: { fontSize: 10, marginLeft: 10, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 15, paddingHorizontal: 15, borderRadius: 25, height: 45, elevation: 2 },
  input: { flex: 1, fontSize: 14 },
  row: { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 15, color: '#333', fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center' },
  count: { color: '#FF6600', fontWeight: 'bold', marginRight: 6, fontSize: 16 },
  fabGroup: { position: 'absolute', bottom: 30, right: 20, alignItems: 'center' },
  fab: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 6 }
});