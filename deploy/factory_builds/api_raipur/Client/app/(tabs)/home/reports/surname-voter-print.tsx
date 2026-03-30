import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import API from '../../../../services/api';
import { getSurnameDetailsOffline } from '../../../../db/sqliteService';

export default function SurnameVoterPrint() {
    const { surname, booth } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useTranslation();

    const [voters, setVoters] = useState<any[]>([]);
    const [filteredVoters, setFilteredVoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOffline, setIsOffline] = useState(false);

    useFocusEffect(
        useCallback(() => { fetchVoters(); }, [surname, booth])
    );

    const fetchVoters = async () => {
        setLoading(true);
        try {
            const res = await API.get('/reports/surname-details', { params: { surname, booth } });
            setVoters(res.data);
            setFilteredVoters(res.data);
            setIsOffline(false);
        } catch (error) {
            const localData = await getSurnameDetailsOffline(surname as string, booth as string);
            setVoters(localData);
            setFilteredVoters(localData);
            setIsOffline(true);
        } finally { setLoading(false); }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        const query = text.toLowerCase().trim();
        if (!query) { setFilteredVoters(voters); return; }
        const filtered = voters.filter((v) => 
            v.name?.toLowerCase().includes(query) || 
            v.voter_name_eng?.toLowerCase().includes(query) || 
            v.epic_id?.toLowerCase().includes(query)
        );
        setFilteredVoters(filtered);
    };

    const handlePrint = async () => {
        const html = `<html><body style="font-family:sans-serif;padding:20px;">
            <h2 style="text-align:center;color:#FF6600;">${t('report_surname')}: ${surname}</h2>
            <p style="text-align:center;">${t('booth_label')}: ${booth} | Total: ${filteredVoters.length}</p>
            <table style="width:100%;border-collapse:collapse;">
                <tr style="background:#f2f2f2;"><th>Sr</th><th>Name</th><th>EPIC</th><th>Age</th></tr>
                ${filteredVoters.map((v, i) => `<tr><td>${v.srNo || i+1}</td><td>${v.name}</td><td>${v.epic_id}</td><td>${v.age}</td></tr>`).join('')}
            </table></body></html>`;
        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch { Alert.alert(t('error'), t('error_pdf_gen')); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={26} color="#FF6600" /></TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{surname}</Text>
                    <Text style={[styles.modeText, { color: isOffline ? '#4CAF50' : '#2196F3' }]}>{isOffline ? "● Offline" : "● Live"}</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#666" />
                    <TextInput style={styles.searchInput} placeholder={t('search_name_epic_placeholder')} value={searchQuery} onChangeText={handleSearch} />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredVoters}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.voterCard} onPress={() => router.push({ pathname: "/details/[id]", params: { id: item._id } })}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.voterName}>{item.name}</Text>
                                <Text style={styles.voterSub}>EPIC: {item.epic_id}</Text>
                            </View>
                            <Text style={styles.voterAge}>{item.age} Yr</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
            <TouchableOpacity style={styles.fab} onPress={handlePrint}><MaterialCommunityIcons name="printer" size={28} color="#fff" /></TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    modeText: { fontSize: 10, marginLeft: 10, fontWeight: 'bold' },
    searchContainer: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 10, paddingHorizontal: 10, height: 45 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#333' },
    voterCard: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
    voterName: { fontSize: 16, fontWeight: '600', color: '#333' },
    voterSub: { fontSize: 13, color: '#666', marginTop: 2 },
    voterAge: { fontSize: 14, fontWeight: 'bold', color: '#FF6600' },
    fab: { position: 'absolute', right: 25, bottom: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center', elevation: 5 }
});