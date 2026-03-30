import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    FlatList, ActivityIndicator, RefreshControl, Modal, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import API from '../../services/api';
import { searchVotersOffline, getOfflineVoterCount, setupDatabase } from '../../db/sqliteService';

export default function VoterSearch() {
    const { t } = useTranslation();
    const router = useRouter();

    // --- CORE DATA STATES ---
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [voters, setVoters] = useState([]);
    const [filters, setFilters] = useState({ surname: '', area: '', house: '' });
    
    // --- UI & MODE STATES ---
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // --- SCANNER STATES ---
    const [permission, requestPermission] = useCameraPermissions();
    const [isScannerVisible, setIsScannerVisible] = useState(false);
    const [scanned, setScanned] = useState(false);

    // 1. INITIALIZATION: Detect if 50,000 records were synced to SQLite
    useEffect(() => {
        const initMode = async () => {
            await setupDatabase();
            const count = await getOfflineVoterCount();
            if (count > 0) {
                setIsOfflineMode(true);
            }
        };
        initMode();
    }, []);

    // 2. DEBOUNCE: Wait 500ms after user stops typing to search
    useEffect(() => {
        const timer = setTimeout(() => { 
            setDebouncedQuery(searchQuery); 
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 3. HYBRID DATA FETCHING: The heart of the offline/online logic
    const fetchVoters = async (query = '') => {
        try {
            setLoading(true);
            
            if (isOfflineMode) {
                // --- OFFLINE MODE: Query Local SQLite ---
                console.log("Searching Offline SQLite...");
                const data = await searchVotersOffline(query, filters);
                setVoters(data as any);
            } else {
                // --- ONLINE MODE: Query Node.js API ---
                console.log("Searching Live Server...");
                const { surname, area, house } = filters;
                
                // Construct dynamic URL based on filters
                let url = `/voters?search=${query}`;
                if (surname) url += `&surname=${surname}`;
                if (area) url += `&area=${area}`;
                if (house) url += `&house=${house}`;

                const response = await API.get(url);
                setVoters(response.data);
            }
        } catch (error) {
            console.error("Search Error:", error);
            // Auto-fallback to offline if server is down but local data exists
            const count = await getOfflineVoterCount();
            if (count > 0 && !isOfflineMode) {
                setIsOfflineMode(true);
                Alert.alert("Offline Mode", "Server unreachable. Using local database.");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // 4. TRIGGER FETCH: Runs whenever Query or Filters change
    useEffect(() => {
        fetchVoters(debouncedQuery);
    }, [debouncedQuery, filters, isOfflineMode]);

    // --- HANDLERS ---
    const handleOpenScanner = async () => {
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) return Alert.alert(t('error'), t('camera_denied'));
        }
        setScanned(false);
        setIsScannerVisible(true);
    };

    const handleClearFilters = () => {
        setFilters({ surname: '', area: '', house: '' });
        setIsFilterVisible(false);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchVoters(debouncedQuery);
    }, [debouncedQuery, filters]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container} edges={['top']}>
                
                {/* HEADER SECTION */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>{t('search_voter')}</Text>
                        <View style={styles.modeIndicator}>
                            <View style={[styles.modeDot, { backgroundColor: isOfflineMode ? '#4CAF50' : '#FF9800' }]} />
                            <Text style={[styles.modeLabel, { color: isOfflineMode ? '#4CAF50' : '#FF9800' }]}>
                                {isOfflineMode ? "Offline (Local)" : "Live (Server)"}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.filterTrigger}
                        onPress={() => setIsFilterVisible(true)}
                    >
                        <MaterialCommunityIcons 
                            name={filters.surname || filters.area || filters.house ? "filter-check" : "filter-variant"} 
                            size={28} 
                            color="#FF6600" 
                        />
                    </TouchableOpacity>
                </View>

                {/* SEARCH INPUT AREA */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <MaterialCommunityIcons name="magnify" size={24} color="#666" />
                        <TextInput
                            style={styles.input}
                            placeholder={t('search_placeholder')}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner}>
                            <MaterialCommunityIcons name="qrcode-scan" size={22} color="#FF6600" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* VOTER FLATLIST */}
                <FlatList
                    data={voters}
                    keyExtractor={(item: any) => (item.id || item._id).toString()}
                    contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6600']} />
                    }
                    ListEmptyComponent={() => (
                        !loading && (
                            <View style={styles.emptyView}>
                                <MaterialCommunityIcons name="account-search-outline" size={60} color="#ccc" />
                                <Text style={styles.noResults}>{t('no_results')}</Text>
                            </View>
                        )
                    )}
                    renderItem={({ item }) => (
                        <View style={styles.voterCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.voterName}>{item.name}</Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Sr: {item.srNo || '0'}</Text>
                                </View>
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={styles.details}>{t('father_name')}: {item.fatherName || 'N/A'}</Text>
                                <Text style={styles.details}>{item.gender} | {t('age')}: {item.age}</Text>
                                <Text style={styles.epic}>EPIC: {item.epic_id}</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.viewBtn} 
                                onPress={() => router.push({ 
                                    pathname: "/details/[id]", 
                                    params: { id: item.id || item._id } 
                                })}
                            >
                                <MaterialCommunityIcons name="eye-outline" size={18} color="#FF6600" />
                                <Text style={styles.viewBtnText}>{t('view_profile')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />

                {/* FILTER MODAL */}
                <Modal visible={isFilterVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.filterCard}>
                            <View style={styles.filterHeader}>
                                <Text style={styles.filterTitle}>{t('filter_title')}</Text>
                                <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={26} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>{t('surname_label')}</Text>
                            <TextInput 
                                style={styles.filterInput} 
                                placeholder="Enter Surname (e.g. Sharma)"
                                value={filters.surname} 
                                onChangeText={(v) => setFilters({...filters, surname: v})} 
                            />

                            <Text style={styles.label}>{t('area_label')}</Text>
                            <TextInput 
                                style={styles.filterInput} 
                                placeholder="Enter Area (e.g. Purna Village)"
                                value={filters.area} 
                                onChangeText={(v) => setFilters({...filters, area: v})} 
                            />

                            <Text style={styles.label}>{t('house_no_label')}</Text>
                            <TextInput 
                                style={styles.filterInput} 
                                placeholder="Enter House No (e.g. 101)"
                                value={filters.house} 
                                onChangeText={(v) => setFilters({...filters, house: v})} 
                            />

                            <View style={styles.filterActions}>
                                <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilters}>
                                    <Text style={styles.clearText}>{t('clear_all')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.applyBtn} onPress={() => setIsFilterVisible(false)}>
                                    <Text style={styles.applyText}>{t('apply_filters')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* QR/BARCODE SCANNER MODAL */}
                <Modal visible={isScannerVisible} animationType="fade">
                    <CameraView 
                        style={StyleSheet.absoluteFillObject} 
                        onBarcodeScanned={scanned ? undefined : ({data}) => {
                            setScanned(true);
                            setIsScannerVisible(false);
                            setSearchQuery(data);
                        }}
                    />
                    <TouchableOpacity style={styles.closeScan} onPress={() => setIsScannerVisible(false)}>
                        <MaterialCommunityIcons name="close-circle" size={60} color="white" />
                    </TouchableOpacity>
                </Modal>

                {/* LOADING OVERLAY */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#FF6600" />
                    </View>
                )}

            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 20, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee',
        alignItems: 'center'
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
    modeIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    modeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    modeLabel: { fontSize: 11, fontWeight: 'bold' },
    filterTrigger: { padding: 5 },
    
    searchContainer: { padding: 15 },
    searchBox: { 
        flexDirection: 'row', 
        backgroundColor: '#fff', 
        borderRadius: 15, 
        paddingHorizontal: 15, 
        height: 55, 
        alignItems: 'center', 
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
    scanButton: { paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#eee' },
    
    voterCard: { 
        backgroundColor: '#fff', 
        borderRadius: 18, 
        marginBottom: 15, 
        padding: 18, 
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    voterName: { fontSize: 18, fontWeight: 'bold', flex: 1, color: '#2C3E50' },
    badge: { backgroundColor: '#FF660012', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#FF6600', fontSize: 12, fontWeight: 'bold' },
    cardBody: { marginBottom: 12 },
    details: { color: '#7F8C8D', fontSize: 14, marginBottom: 3 },
    epic: { color: '#95A5A6', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
    viewBtn: { 
        borderTopWidth: 1, 
        borderTopColor: '#f5f5f5', 
        paddingTop: 12, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    viewBtnText: { color: '#FF6600', fontWeight: 'bold', marginLeft: 8, fontSize: 15 },
    
    emptyView: { alignItems: 'center', marginTop: 50 },
    noResults: { textAlign: 'center', marginTop: 15, color: '#BDC3C7', fontSize: 16 },
    
    // MODAL STYLES
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    filterCard: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
    filterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, alignItems: 'center' },
    filterTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
    label: { fontSize: 14, color: '#34495E', marginTop: 15, fontWeight: '600' },
    filterInput: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginTop: 8, fontSize: 16, borderWidth: 1, borderColor: '#EDF2F7' },
    filterActions: { flexDirection: 'row', marginTop: 35, gap: 15 },
    clearBtn: { flex: 1, padding: 18, alignItems: 'center', borderRadius: 15, backgroundColor: '#F1F5F9' },
    clearText: { color: '#64748B', fontWeight: 'bold' },
    applyBtn: { flex: 2, backgroundColor: '#FF6600', padding: 18, borderRadius: 15, alignItems: 'center' },
    applyText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    
    closeScan: { position: 'absolute', bottom: 50, alignSelf: 'center' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }
});