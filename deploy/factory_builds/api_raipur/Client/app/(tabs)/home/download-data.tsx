import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next'; // 1. Import Hook

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import API, { BASE_URL } from '../../../services/api'; 

export default function DownloadData() {
    const { t } = useTranslation(); // 2. Initialize Hook
    const router = useRouter();
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        fetchApprovedUploads();
    }, []);

    const fetchApprovedUploads = async () => {
        try {
            setLoading(true);
            const response = await API.get('/uploads/admin/all');
            const approvedOnly = response.data.filter(item => item.status === 'Approved');
            setUploads(approvedOnly);
        } catch (error) {
            Alert.alert(t('error'), t('error_fetch_list'));
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async (item) => {
        setDownloadingId(item._id);
        const cleanPath = item.filePath.replace(/\\/g, '/');
        const fileUrl = `${BASE_URL}/${cleanPath}`;
        const fileName = item.fileName || `doc_${item._id}.pdf`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        try {
            const downloadResumable = FileSystem.createDownloadResumable(
                fileUrl,
                fileUri,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    console.log(`Download Progress: ${(progress * 100).toFixed(2)}%`);
                }
            );

            const result = await downloadResumable.downloadAsync();
            
            if (result && result.uri) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(result.uri);
                } else {
                    Alert.alert(t('success'), t('success_file_saved'));
                }
            }
        } catch (error) {
            Alert.alert(t('error'), t('error_download_failed'));
        } finally {
            setDownloadingId(null);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FF6600" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.fileName}</Text>
                    {/* Translated Status Label */}
                    <Text style={styles.cardSub}>{t('status_approved')}</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.downloadBtn, downloadingId === item._id && { opacity: 0.6 }]} 
                onPress={() => downloadFile(item)}
                disabled={downloadingId === item._id}
            >
                {downloadingId === item._id ? (
                    <ActivityIndicator size="small" color="#2E7DFF" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="share" size={16} color="#2E7DFF" />
                        <Text style={styles.downloadText}>{t('share')}</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="chevron-left" size={30} color="#FF6600" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('download_data_title')}</Text>
                <TouchableOpacity onPress={fetchApprovedUploads}>
                    <MaterialCommunityIcons name="refresh" size={24} color="#FF6600" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#FF6600" />
                </View>
            ) : (
                <FlatList
                    data={uploads}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('no_approved_files')}</Text>
                        </View>
                    }
                />
            )}

            <View style={styles.bottomArea}>
                <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/(tabs)')}>
                    <Text style={styles.backHomeText}>{t('return_to_home')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    listContent: { paddingBottom: 120, paddingTop: 10 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 12, padding: 16, backgroundColor: '#fff', borderRadius: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF0E6', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
    cardSub: { color: '#4CAF50', marginTop: 3, fontSize: 12, fontWeight: '600' },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F3FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 5 },
    downloadText: { color: '#2E7DFF', fontWeight: 'bold', fontSize: 13 },
    bottomArea: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    backHomeBtn: { backgroundColor: '#333', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    backHomeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { textAlign: 'center', color: '#999' }
});