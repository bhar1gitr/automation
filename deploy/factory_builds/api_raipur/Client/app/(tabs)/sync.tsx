import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, 
    ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BASE_URL } from '@/services/api';
import { 
    setupDatabase, 
    saveVotersLocally, 
    getTop5Voters, 
    getOfflineVoterCount 
} from '../../db/sqliteService';

export default function SyncScreen() {
    const { t } = useTranslation();
    const [syncing, setSyncing] = useState(false);
    const [voterCount, setVoterCount] = useState(0);
    const [testData, setTestData] = useState([]);

    // 🚀 LOAD PERSISTENT DATA ON MOUNT
    useEffect(() => {
        const init = async () => {
            await setupDatabase();
            const count = await getOfflineVoterCount();
            setVoterCount(count);
        };
        init();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await setupDatabase();
            let skip = 0;
            const limit = 5000;
            let hasMore = true;
            let totalSynced = 0;

            while (hasMore) {
                const response = await axios.get(`${BASE_URL}/sync/download-voters`, {
                    params: { skip, limit }
                });

                const { voters, hasMore: serverHasMore } = response.data;

                if (voters && voters.length > 0) {
                    await saveVotersLocally(voters);
                    
                    // Update count from actual DB status
                    const currentCount = await getOfflineVoterCount();
                    setVoterCount(currentCount); 

                    skip += limit;
                    hasMore = serverHasMore;

                    // Small pause to keep UI responsive
                    await new Promise(resolve => setTimeout(resolve, 100));
                } else {
                    hasMore = false;
                }
            }
            Alert.alert("Success", `Sync Complete!`);
        } catch (error) {
            console.error("Sync Error:", error);
            Alert.alert("Sync Failed", "Check server connection.");
        } finally {
            setSyncing(false);
        }
    };

    const handleVerify = async () => {
        const top5 = await getTop5Voters();
        setTestData(top5);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('sync_title')}</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.syncStatusCard}>
                        <MaterialCommunityIcons
                            name={syncing ? "sync" : "cloud-check"}
                            size={80}
                            color={syncing ? "#FF6600" : "#4CAF50"}
                        />
                        <Text style={styles.statusTitle}>
                            {syncing ? t('sync_loading') : t('sync_success')}
                        </Text>
                    </View>

                    <View style={styles.infoBox}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{t('offline_voters')}</Text>
                            <Text style={styles.infoValue}>{voterCount}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.syncButton, syncing && styles.disabledButton]}
                        onPress={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="cloud-download" size={24} color="#fff" />
                                <Text style={styles.syncButtonText}>{t('sync_now')}</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.verifySection}>
                        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
                            <Text style={styles.verifyBtnText}>Verify Data (Top 5)</Text>
                        </TouchableOpacity>

                        {testData.map((item: any, index) => (
                            <View key={index} style={styles.testCard}>
                                <Text style={styles.testName}>{item.name}</Text>
                                <Text style={styles.testId}>EPIC: {item.epic_id}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    content: { padding: 30 },
    syncStatusCard: { alignItems: 'center', marginBottom: 40 },
    statusTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, color: '#333' },
    infoBox: { backgroundColor: '#F8F9FA', borderRadius: 15, padding: 20, marginBottom: 40 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    infoLabel: { fontSize: 16, color: '#666' },
    infoValue: { fontSize: 16, fontWeight: 'bold', color: '#FF6600' },
    syncButton: {
        backgroundColor: '#FF6600',
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    disabledButton: { backgroundColor: '#FFCCBC' },
    syncButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    verifySection: { marginTop: 40, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 },
    verifyBtn: { backgroundColor: '#333', padding: 15, borderRadius: 10, marginBottom: 15 },
    verifyBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
    testCard: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#FF6600' },
    testName: { fontWeight: 'bold', fontSize: 15 },
    testId: { color: '#666', fontSize: 12 }
});