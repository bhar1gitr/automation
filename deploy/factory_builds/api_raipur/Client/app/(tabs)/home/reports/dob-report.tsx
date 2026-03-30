import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList,
    ActivityIndicator, Alert, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import API from '../../../../services/api';
import { getBirthdayReportOffline } from '../../../../db/sqliteService';
import moment from 'moment';
import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const BOOTH_NUMBERS = ['All', '285', '286', '287', '288', '289', '290', '291', '292'];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Voter = {
    _id: string;
    name: string;
    epic_id: string;
    dob: string;
    mobile: string;
    part: string;
};

export default function BirthdayReport() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [voters, setVoters] = useState<Voter[]>([]);
    const [mode, setMode] = useState<'today' | 'month'>('today');
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    
    // Booth States
    const [selectedBooth, setSelectedBooth] = useState("All");
    const [showBoothPicker, setShowBoothPicker] = useState(false);

    /**
     * useFocusEffect ensures the list refreshes when navigating back 
     * from a voter's detail page after editing.
     */
    useFocusEffect(
        useCallback(() => {
            fetchBirthdays();
        }, [mode, selectedMonthIndex, selectedBooth])
    );

    const fetchBirthdays = async () => {
        setLoading(true);
        try {
            const monthParam = selectedMonthIndex + 1;
            // 1. Try Online Mode
            const response = await API.get(`/reports/birthday`, {
                params: { mode, month: monthParam, booth: selectedBooth }
            });
            setVoters(response.data);
            setIsOffline(false);
        } catch (error) {
            console.log("Server error or offline, switching to SQLite...");
            // 2. Fallback to Offline Mode
            const localData = await getBirthdayReportOffline(mode, selectedMonthIndex + 1, selectedBooth);
            setVoters(localData as any);
            setIsOffline(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);
            if (voters.length === 0) {
                Alert.alert("Info", "No data to export");
                return;
            }
            const excelData = voters.map((v, index) => ({
                "Sr No": index + 1,
                "Name": v.name,
                "Booth Info": v.part,
                "Mobile": v.mobile || "N/A",
                "Birthday": v.dob ? moment(v.dob, "DD/MM/YYYY").format('DD-MMM-YYYY') : "Unknown"
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Birthdays");
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            
            const uri = FileSystem.documentDirectory + `Birthdays_Booth_${selectedBooth}.xlsx`;
            await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert("Error", "Export failed");
        } finally {
            setDownloading(false);
        }
    };

    const renderItem = ({ item }: { item: Voter }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push({ pathname: "/details/[id]", params: { id: item._id } })}
        >
            <View style={styles.iconBox}>
                <MaterialCommunityIcons name="cake-variant" size={24} color="#FF6600" />
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subText}>{item.part} | {item.mobile || "No Mobile"}</Text>
            </View>
            <View style={styles.dateBadge}>
                <Text style={styles.dateText}>
                    {item.dob ? moment(item.dob, "DD/MM/YYYY").format('D MMM') : 'N/A'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={26} color="#FF6600" />
                </TouchableOpacity>
                <View style={{ marginLeft: 10 }}>
                    <Text style={styles.headerTitle}>Birthday Report</Text>
                    <Text style={[styles.modeText, { color: isOffline ? '#4CAF50' : '#2196F3' }]}>
                        {isOffline ? "● Offline Mode" : "● Live Mode"}
                    </Text>
                </View>
            </View>

            {/* Selectors */}
            <View style={styles.selectorContainer}>
                <TouchableOpacity style={styles.selectorItem} onPress={() => setShowBoothPicker(true)}>
                    <Text style={styles.selectorLabel}>Booth Filter</Text>
                    <View style={styles.selectorValueRow}>
                        <Text style={styles.selectorValue}>{selectedBooth === 'All' ? 'All Booths' : `Booth ${selectedBooth}`}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.selectorItem, mode === 'today' && { opacity: 0.5 }]} 
                    onPress={() => mode !== 'today' && setShowMonthPicker(true)}
                >
                    <Text style={styles.selectorLabel}>Month</Text>
                    <View style={styles.selectorValueRow}>
                        <Text style={styles.selectorValue}>
                            {mode === 'today' ? moment().format('MMMM') : MONTHS[selectedMonthIndex]}
                        </Text>
                        {mode !== 'today' && <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Toggles */}
            <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, mode === 'today' && styles.activeToggle]} onPress={() => setMode('today')}>
                    <Text style={[styles.toggleText, mode === 'today' && styles.activeToggleText]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, mode === 'month' && styles.activeToggle]} onPress={() => setMode('month')}>
                    <Text style={[styles.toggleText, mode === 'month' && styles.activeToggleText]}>This Month</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={voters}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="cake-off" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>No birthdays found</Text>
                        </View>
                    }
                />
            )}

            {/* Export FAB */}
            <View style={styles.fabBox}>
                <TouchableOpacity style={styles.fab} onPress={handleDownload} disabled={downloading}>
                    {downloading ? <ActivityIndicator color="#fff" /> : <MaterialCommunityIcons name="file-excel-box" size={28} color="#fff" />}
                </TouchableOpacity>
            </View>

            {/* Modals for Booth/Month */}
            <Modal visible={showBoothPicker} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowBoothPicker(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Booth</Text>
                        <FlatList
                            data={BOOTH_NUMBERS}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem} 
                                    onPress={() => { setSelectedBooth(item); setShowBoothPicker(false); }}
                                >
                                    <Text style={[styles.modalItemText, selectedBooth === item && { color: '#FF6600', fontWeight: 'bold' }]}>
                                        {item === 'All' ? 'All Booths' : `Booth ${item}`}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showMonthPicker} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMonthPicker(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Month</Text>
                        <FlatList
                            data={MONTHS}
                            keyExtractor={item => item}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem} 
                                    onPress={() => { setSelectedMonthIndex(index); setShowMonthPicker(false); }}
                                >
                                    <Text style={[styles.modalItemText, selectedMonthIndex === index && { color: '#FF6600', fontWeight: 'bold' }]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    modeText: { fontSize: 10, fontWeight: 'bold' },
    selectorContainer: { flexDirection: 'row', padding: 12, gap: 10 },
    selectorItem: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 12, elevation: 2 },
    selectorLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 },
    selectorValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectorValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    toggleRow: { flexDirection: 'row', paddingHorizontal: 15, marginVertical: 5 },
    toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#E0E0E0', borderRadius: 12, marginHorizontal: 4 },
    activeToggle: { backgroundColor: '#FF6600' },
    toggleText: { fontWeight: 'bold', color: '#666' },
    activeToggleText: { color: '#fff' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 15, elevation: 2 },
    iconBox: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    subText: { fontSize: 12, color: '#777', marginTop: 2 },
    dateBadge: { backgroundColor: '#FF660015', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    dateText: { color: '#FF6600', fontWeight: 'bold', fontSize: 12 },
    emptyBox: { marginTop: 100, alignItems: 'center', opacity: 0.5 },
    emptyText: { marginTop: 10, fontSize: 16, color: '#666', fontWeight: '500' },
    fabBox: { position: 'absolute', right: 20, bottom: 30 },
    fab: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalItemText: { fontSize: 16, color: '#333' }
});