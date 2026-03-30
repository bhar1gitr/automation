import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  StatusBar, ActivityIndicator, Alert, TextInput, ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next"; 
import API from "../../../../services/api";
import { getAgeRangeReportOffline } from "../../../../db/sqliteService";

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type VoterRecord = {
  _id: string;
  name: string;
  voter_name_eng?: string;
  age: number;
  epic_id: string;
  srNo?: number;
  part?: string;
};

const BOOTH_NUMBERS = ['All', '285', '286', '287', '288', '289', '290', '291', '292'];

export default function AgeRangeReport() {
  const router = useRouter();
  const { t } = useTranslation(); 

  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [reportData, setReportData] = useState<VoterRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [selectedBooth, setSelectedBooth] = useState('All');

  const fetchRangeData = async () => {
    if (!minAge || !maxAge) {
      Alert.alert(t('input_required'), t('age_input_error'));
      return;
    }

    setLoading(true);
    try {
      // 1. Try Online First
      const response = await API.get(`/reports/age-range`, {
        params: { min: minAge, max: maxAge, booth: selectedBooth },
      });
      setReportData(response.data.data); 
      setTotalCount(response.data.totalCount);
      setIsOffline(false);
    } catch (error) {
      console.log("Server error, fetching age range offline...");
      // 2. Fallback to SQLite
      const result = await getAgeRangeReportOffline(minAge, maxAge, selectedBooth);
      if (result.success) {
        setReportData(result.data as any);
        setTotalCount(result.totalCount);
        setIsOffline(true);
      } else {
        Alert.alert(t('error'), t('error_load_data'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger search automatically when booth changes if ages are present
  useFocusEffect(
    useCallback(() => {
      if (minAge && maxAge) fetchRangeData();
    }, [selectedBooth])
  );

  const handlePrint = async () => {
    if (reportData.length === 0) return;
    try {
      setPrinting(true);
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; }
              h1 { text-align: center; color: #FF6600; margin-bottom: 5px; }
              h3 { text-align: center; color: #666; margin-top: 0; }
              .info { text-align: center; margin-bottom: 20px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 12px; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>${t('pdf_age_report_title')}</h1>
            <h3>${t('age_group_label', { min: minAge, max: maxAge })}</h3>
            <div class="info">${t('booth_label')}: ${selectedBooth === 'All' ? t('all') : selectedBooth} | ${t('total_voters_label', { count: totalCount })}</div>
            <table>
              <thead>
                <tr>
                  <th>${t('sr_no')}</th>
                  <th>${t('pdf_voter_name')}</th>
                  <th>${t('pdf_epic_id')}</th>
                  <th>${t('pdf_age')}</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.map((item, index) => `
                  <tr>
                    <td>${item.srNo || index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.epic_id}</td>
                    <td>${item.age}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert(t('error'), t('error_pdf_gen'));
    } finally {
      setPrinting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#FF6600" />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>{t('age_search_title')}</Text>
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
                {booth === 'All' ? t('all') : `${t('booth_label')} ${booth}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('min_age_label')}</Text>
            <TextInput
              style={styles.input}
              placeholder="18"
              keyboardType="numeric"
              value={minAge}
              onChangeText={setMinAge}
            />
          </View>
          <View style={styles.inputSeparator}>
            <Text style={{ color: "#999", marginTop: 25 }}>{t('te') || 'to'}</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('max_age_label')}</Text>
            <TextInput
              style={styles.input}
              placeholder="99"
              keyboardType="numeric"
              value={maxAge}
              onChangeText={setMaxAge}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={fetchRangeData}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color="#fff" />
          <Text style={styles.searchButtonText}>{t('generate_list')}</Text>
        </TouchableOpacity>
      </View>

      {reportData.length > 0 && !loading && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{t('total_voters_label', { count: totalCount })}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6600" />
        </View>
      ) : (
        <FlatList
          data={reportData}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {minAge && maxAge ? t('no_voters_in_range') : t('enter_age_to_view')}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
                style={styles.row}
                onPress={() => router.push({
                    pathname: "/details/[id]",
                    params: { id: item._id }
                })}
            >
              <View style={styles.voterInfo}>
                <Text style={styles.voterName}>{item.name}</Text>
                <Text style={styles.voterSub}>EPIC: {item.epic_id}</Text>
              </View>
              <View style={styles.ageBadge}>
                <Text style={styles.ageText}>{item.age} {t('years_old')}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
            </TouchableOpacity>
          )}
        />
      )}

      {reportData.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handlePrint}
          disabled={printing}
        >
          {printing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="printer" size={28} color="#fff" />
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 10, color: "#333" },
  modeText: { fontSize: 10, marginLeft: 10, fontWeight: "bold" },
  boothSelectorContainer: { marginTop: 10, height: 45, backgroundColor: "#fff", paddingVertical: 5 },
  boothScroll: { paddingHorizontal: 15 },
  boothChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F0F2F5', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#E4E6EB', justifyContent: 'center' },
  activeBoothChip: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
  boothText: { fontSize: 13, color: '#4B4F56', fontWeight: '500' },
  activeBoothText: { color: '#fff' },
  filterSection: { backgroundColor: "#fff", padding: 20, margin: 15, borderRadius: 12, elevation: 3 },
  inputRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  inputContainer: { width: "42%" },
  inputSeparator: { width: "10%", alignItems: "center", justifyContent: "center" },
  inputLabel: { fontSize: 12, color: "#666", marginBottom: 5, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: "#FAFAFA" },
  searchButton: { backgroundColor: "#FF6600", flexDirection: "row", padding: 14, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  searchButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16, marginLeft: 8 },
  countContainer: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'flex-end' },
  countText: { fontSize: 14, fontWeight: 'bold', color: '#FF6600' },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#eee", backgroundColor: "#fff" },
  voterInfo: { flex: 1 },
  voterName: { fontSize: 16, fontWeight: "600", color: "#333" },
  voterSub: { fontSize: 13, color: "#888", marginTop: 2 },
  ageBadge: { backgroundColor: "#FFF0E6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#FFDAB9", marginRight: 10 },
  ageText: { color: "#FF6600", fontWeight: "bold", fontSize: 14 },
  emptyText: { textAlign: "center", marginTop: 50, color: "#999", paddingHorizontal: 40 },
  fab: { position: "absolute", right: 25, bottom: 35, width: 60, height: 60, borderRadius: 30, backgroundColor: "#FF6600", justifyContent: "center", alignItems: "center", elevation: 8 }
});