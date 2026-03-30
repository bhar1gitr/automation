import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, Alert, TextInput, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import API from '../../../../services/api';
import { getBoothReportOffline } from '../../../../db/sqliteService';
import * as Print from 'expo-print';

export default function BoothReport() {
    const { t } = useTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOffline, setIsOffline] = useState(false);

    useFocusEffect(
        useCallback(() => { fetchData(); }, [])
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await API.get('/reports/booth');
            setData(response.data);
            setFilteredData(response.data);
            setIsOffline(false);
        } catch (error) {
            const localData = await getBoothReportOffline();
            setData(localData);
            setFilteredData(localData);
            setIsOffline(true);
        } finally { setLoading(false); }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        const query = text.toLowerCase().trim();
        const filtered = data.filter(item => 
            (item._id || "").toLowerCase().includes(query) || 
            (item.areaName || "").toLowerCase().includes(query)
        );
        setFilteredData(filtered);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={26} color="#FF6600" />
                </TouchableOpacity>
                <View style={{ marginLeft: 10 }}>
                    <Text style={styles.headerTitle}>{t('booth_report_title')}</Text>
                    <Text style={[styles.modeText, { color: isOffline ? '#4CAF50' : '#2196F3' }]}>
                        {isOffline ? "● Offline Mode" : "● Live Mode"}
                    </Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search_booth_placeholder')}
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#FF6600" /></View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.card}
                            onPress={() => router.push({ pathname: '/home/reports/booth-voter-list', params: { boothNumber: item._id } })}
                        >
                            <View style={styles.boothIconBox}><Text style={styles.boothNumberText}>{item._id}</Text></View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.boothTitle}>{t('booth_label')} {item._id}</Text>
                                <Text style={styles.areaSubtitle} numberOfLines={1}>{item.areaName}</Text>
                            </View>
                            <View style={styles.badge}><Text style={styles.total}>{item.count}</Text></View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    modeText: { fontSize: 10, fontWeight: 'bold' },
    searchContainer: { padding: 12, backgroundColor: '#fff' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', paddingHorizontal: 12, borderRadius: 10, height: 45 },
    searchInput: { flex: 1, marginLeft: 8 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', padding: 15, marginHorizontal: 15, marginVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    boothIconBox: { backgroundColor: '#FF6600', width: 45, height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    boothNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    boothTitle: { fontSize: 16, fontWeight: 'bold' },
    areaSubtitle: { fontSize: 12, color: '#666' },
    badge: { backgroundColor: '#FFF0E6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    total: { color: '#FF6600', fontWeight: 'bold' }
});