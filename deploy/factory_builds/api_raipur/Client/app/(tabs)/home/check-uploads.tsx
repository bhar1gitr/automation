import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next'; // 1. Import hook
import API, { BASE_URL } from '../../../services/api'; 

export default function CheckUploads() {
    const { t } = useTranslation(); // 2. Initialize hook
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAllUploads = async () => {
        try {
            setLoading(true);
            const response = await API.get('/uploads/admin/all');
            setUploads(response.data);
        } catch (error) {
            Alert.alert(t('error'), t('error_fetch_uploads'));
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchAllUploads(); }, []));

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await API.patch(`/uploads/${id}/status`, { status: newStatus });
            // Using t() with variables for the success message
            Alert.alert(t('success'), t('status_marked', { status: t(newStatus.toLowerCase()) }));
            fetchAllUploads(); 
        } catch (error) {
            Alert.alert(t('error'), t('error_update_status'));
        }
    };

    const openDocument = async (filePath: string) => {
        if (!filePath) return;
        const cleanPath = filePath.replace(/\\/g, '/'); 
        const fullUrl = `${BASE_URL}/${cleanPath}`; 

        try {
            await WebBrowser.openBrowserAsync(fullUrl);
        } catch (error) {
            Alert.alert(t('error'), "Could not open document.");
        }
    };

    const renderItem = ({ item }) => {
        // Map backend status to translated strings
        const displayStatus = t(item.status.toLowerCase());

        return (
            <View style={styles.card}>
                <View style={styles.row}>
                    <MaterialCommunityIcons name="file-pdf-box" size={40} color="#E53935" />
                    <View style={styles.info}>
                        <Text style={styles.fileName}>{item.fileName}</Text>
                        <Text style={styles.subText}>{t('user_id')}: {item.userId}</Text>
                        
                        <View style={[styles.statusBadge, 
                            { backgroundColor: item.status === 'Approved' ? '#E8F5E9' : item.status === 'Rejected' ? '#FFEBEE' : '#FFF3E0' }
                        ]}>
                            <Text style={[styles.statusText, 
                                { color: item.status === 'Approved' ? '#4CAF50' : item.status === 'Rejected' ? '#F44336' : '#FF9800' }
                            ]}>
                                {displayStatus}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.viewDocButton} 
                    onPress={() => openDocument(item.filePath)}
                >
                    <MaterialCommunityIcons name="eye-outline" size={20} color="#333" />
                    <Text style={styles.viewDocText}>{t('view_document')}</Text>
                </TouchableOpacity>

                {item.status === 'Pending' && (
                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => handleStatusUpdate(item._id, 'Approved')}>
                            <Text style={styles.btnText}>{t('approve')}</Text>
                            <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleStatusUpdate(item._id, 'Rejected')}>
                            <Text style={styles.btnText}>{t('reject')}</Text>
                            <MaterialCommunityIcons name="close" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('review_uploads')}</Text>
            </View>
            {loading ? <ActivityIndicator size="large" color="#FF6600" style={{marginTop: 50}} /> : 
                <FlatList 
                    data={uploads} 
                    renderItem={renderItem} 
                    keyExtractor={item => item._id} 
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={<Text style={{textAlign:'center', marginTop: 20, color:'#888'}}>{t('no_uploads')}</Text>}
                />
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 3 },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    info: { marginLeft: 15, flex: 1 },
    fileName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    subText: { fontSize: 12, color: '#888', marginBottom: 6 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    viewDocButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', paddingVertical: 10, borderRadius: 8, marginTop: 15, borderWidth: 1, borderColor: '#E0E0E0' },
    viewDocText: { marginLeft: 8, fontWeight: '600', color: '#333' },
    actions: { flexDirection: 'row', marginTop: 15, gap: 10 },
    btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
    btnApprove: { backgroundColor: '#4CAF50' },
    btnReject: { backgroundColor: '#F44336' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});