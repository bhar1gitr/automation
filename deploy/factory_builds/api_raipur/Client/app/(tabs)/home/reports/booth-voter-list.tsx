import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import API from '../../../../services/api';
import { getBoothPartsOffline } from '../../../../db/sqliteService';

export default function BoothPartList() {
    const { t } = useTranslation();
    const router = useRouter();
    const { boothNumber } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [parts, setParts] = useState([]);
    const [isOffline, setIsOffline] = useState(false);

    useFocusEffect(
        useCallback(() => { fetchParts(); }, [boothNumber])
    );

    const fetchParts = async () => {
        try {
            const res = await API.get(`/reports/booth-parts/${boothNumber}`);
            setParts(res.data.data);
            setIsOffline(false);
        } catch {
            const local = await getBoothPartsOffline(boothNumber);
            setParts(local.data);
            setIsOffline(true);
        } finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={26} color="#FF6600" /></TouchableOpacity>
                <View style={{marginLeft: 10}}>
                    <Text style={styles.headerTitle}>{t('yadi_section_title')}</Text>
                    <Text style={{color: isOffline ? '#4CAF50' : '#2196F3', fontSize: 10}}>{isOffline ? "Offline" : "Live"}</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#FF6600" /></View>
            ) : (
                <FlatList
                    data={parts}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.card}
                            onPress={() => router.push({ pathname: '/home/reports/final-voter-list', params: { yadiString: item._id } })}
                        >
                            <View style={styles.middleSection}>
                                <Text style={styles.mainTitle}>{item._id}</Text>
                            </View>
                            <View style={styles.badge}><Text style={styles.countText}>{item.count}</Text></View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, margin: 10, elevation: 2, alignItems: 'center' },
    middleSection: { flex: 1 },
    mainTitle: { fontSize: 14, fontWeight: 'bold' },
    badge: { backgroundColor: '#FFF3E0', padding: 6, borderRadius: 6, marginRight: 10 },
    countText: { color: '#E65100', fontWeight: 'bold' }
});