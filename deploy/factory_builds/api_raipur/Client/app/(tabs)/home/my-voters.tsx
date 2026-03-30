import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    StatusBar,
    FlatList,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next'; 
import API from '../../../services/api'; 
import { getMyVotersOffline, getOfflineVoterCount } from '../../../db/sqliteService';

const BOOTH_NUMBERS = ['All', '285', '286', '287', '288', '289', '290', '291', '292'];

export default function MyVoters() {
    const { t } = useTranslation();
    const router = useRouter();

    const [voters, setVoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isOffline, setIsOffline] = useState(false);

    const [activeTab, setActiveTab] = useState<'my' | 'nominated'>('my');
    const [selectedBooth, setSelectedBooth] = useState('All');
    const [searchText, setSearchText] = useState('');

    const fetchVoters = async (pageNum: number, shouldReset: boolean = false) => {
        if (loading && !shouldReset) return;
        setLoading(true);
        
        try {
            const offlineCount = await getOfflineVoterCount();
            
            if (offlineCount > 0) {
                // --- OFFLINE LOGIC ---
                // strictly filters by #1EB139 as per your backend requirement
                const localData = await getMyVotersOffline(activeTab, selectedBooth, searchText, pageNum);
                setVoters(prev => shouldReset ? localData : [...prev, ...localData]);
                setHasMore(localData.length === 20);
                setIsOffline(true);
            } else {
                // --- ONLINE LOGIC ---
                const queryParams: any = {
                    page: pageNum,
                    limit: 20,
                    tab: activeTab,
                };
                if (selectedBooth !== 'All') queryParams.booth = selectedBooth;
                if (searchText.trim()) queryParams.search = searchText;

                const response = await API.get('/voters', { params: queryParams });
                const data = response.data;

                if (Array.isArray(data)) {
                    setVoters(prev => shouldReset ? data : [...prev, ...data]);
                    setHasMore(data.length === 20);
                }
                setIsOffline(false);
            }
        } catch (error) {
            console.error(error);
            Alert.alert(t('error'), t('error_voter_fetch'));
        } finally {
            setLoading(false);
        }
    };

    // Effect triggers when tab, booth, or search changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        const timer = setTimeout(() => {
            fetchVoters(1, true);
        }, 400);
        return () => clearTimeout(timer);
    }, [activeTab, selectedBooth, searchText]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchVoters(nextPage, false);
        }
    };

    const getBoothFromPart = (partString: string) => {
        if (!partString) return '-';
        const parts = partString.split('/');
        return parts.length > 1 ? parts[1] : parts[0];
    };

    const renderVoterItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={[styles.colorStripe, { backgroundColor: item.colorCode || '#ddd' }]} />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.voterName} numberOfLines={1}>{item.name || item.voter_name}</Text>
                        <Text style={styles.voterNameEng} numberOfLines={1}>{item.voter_name_eng}</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                         <Text style={styles.boothBadge}>{t('booth_label')}: {getBoothFromPart(item.part)}</Text>
                    </View>
                </View>

                <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>{t('age_label')}: {item.age}</Text>
                    <Text style={styles.dot}> • </Text>
                    <Text style={styles.detailText}>
                        {item.gender === 'Male' || item.gender === 'M' ? t('male_label') : t('female_label')}
                    </Text>
                    <Text style={styles.dot}> • </Text>
                    <Text style={styles.epicText}>{item.epic_id}</Text>
                </View>

                <View style={styles.footerRow}>
                    <View style={styles.metaInfo}>
                        <Text style={styles.metaText}>{t('sr_no_label')}: {item.srNo}</Text>
                        {(item.isVoted === 1 || item.isVoted === true) && (
                            <View style={styles.votedBadge}>
                                <Text style={styles.votedText}>{t('voted_done')}</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.viewBtnBorder]}
                        onPress={() => router.push({ 
                            pathname: "/details/[id]", 
                            params: { id: item.id || item._id } 
                        })}
                    >
                        <Text style={styles.viewBtnText}>{t('view_info_btn')}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#FF6600" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6600" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{t('my_voters')}</Text>
                    <Text style={[styles.modeText, { color: isOffline ? '#4CAF50' : '#FF9800' }]}>
                        {isOffline ? "● Offline: Showing Synced My Voters" : "● Live: Fetching from Server"}
                    </Text>
                </View>
            </View>

            <View style={styles.toggleContainer}>
                <ToggleButton 
                    title={t('my_voters')} 
                    active={activeTab === 'my'} 
                    onPress={() => setActiveTab('my')} 
                />
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
                                {booth === 'All' ? t('all_booths') : t('booth_num', { num: booth })}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.searchBox}>
                <TextInput
                    placeholder={t('search_name_epic')}
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={searchText}
                    onChangeText={setSearchText} 
                />
                <MaterialCommunityIcons name="magnify" size={22} color="#FF6600" />
            </View>

            <FlatList
                data={voters}
                keyExtractor={(item, index) => (item.id || item._id || index).toString()}
                renderItem={renderVoterItem}
                contentContainerStyle={styles.listContent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5} 
                ListFooterComponent={loading && page > 1 ? <ActivityIndicator size="small" color="#FF6600" style={{ marginVertical: 10 }} /> : null}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="account-search" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>{t('voters_not_found')}</Text>
                        </View>
                    ) : (
                        <View style={{ marginTop: 50 }}>
                            <ActivityIndicator size="large" color="#FF6600" />
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}

function ToggleButton({ title, active, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.toggleBtn, active && styles.activeToggle]}>
            <Text style={[styles.toggleText, active && styles.activeToggleText]}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: '#000' },
    modeText: { fontSize: 10, marginLeft: 10, fontWeight: 'bold' },
    toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 15 },
    toggleBtn: { flex: 1, marginHorizontal: 5, paddingVertical: 10, borderRadius: 25, backgroundColor: '#E9ECEF', alignItems: 'center' },
    activeToggle: { backgroundColor: '#FF6600' },
    toggleText: { color: '#6C757D', fontWeight: '600' },
    activeToggleText: { color: '#fff' },
    boothSelectorContainer: { marginTop: 15, height: 40 },
    boothScroll: { paddingHorizontal: 15 },
    boothChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#DEE2E6' },
    activeBoothChip: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
    boothText: { fontSize: 13, color: '#495057', fontWeight: '500' },
    activeBoothText: { color: '#fff' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, paddingHorizontal: 15, borderRadius: 25, height: 45, elevation: 3 },
    input: { flex: 1, fontSize: 14, color: '#000' },
    listContent: { paddingBottom: 100, paddingHorizontal: 15, marginTop: 10 },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginTop: 12, overflow: 'hidden', elevation: 2 },
    colorStripe: { width: 5, height: '100%' },
    cardContent: { flex: 1, padding: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    voterName: { fontSize: 16, fontWeight: 'bold', color: '#212529' },
    voterNameEng: { fontSize: 12, color: '#6C757D', marginTop: 1 },
    detailsRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
    detailText: { fontSize: 13, color: '#495057' },
    dot: { fontSize: 13, color: '#ADB5BD', marginHorizontal: 4 },
    epicText: { fontSize: 13, color: '#FF6600', fontWeight: '700' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F3F5', paddingTop: 10 },
    metaInfo: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 12, color: '#868E96', marginRight: 8 },
    badgeContainer: { flexDirection: 'row', alignItems: 'center'},
    boothBadge: { fontSize: 10, backgroundColor: '#F8F9FA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, color: '#495057', borderWidth: 1, borderColor: '#E9ECEF' },
    votedBadge: { backgroundColor: '#D1F7EC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    votedText: { color: '#0CA678', fontSize: 10, fontWeight: 'bold' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
    viewBtnBorder: { borderWidth: 1, borderColor: '#FF6600' },
    viewBtnText: { color: '#FF6600', fontSize: 12, fontWeight: '700', marginRight: 2 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#ADB5BD', fontSize: 15, marginTop: 10 },
});