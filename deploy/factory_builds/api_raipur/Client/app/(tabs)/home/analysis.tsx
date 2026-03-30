import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next'; // 1. Import hook
import API from '../../../services/api';
import { useAuth } from '../../../services/AuthContext';

export default function Analysis() {
    const { t } = useTranslation(); // 2. Initialize hook
    const router = useRouter();
    const { userId } = useAuth();
    const [activeTab, setActiveTab] = useState<'work' | 'analysis'>('work');
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        user: { name: '...', mobile: '...', score: 0 },
        stats: { my_voters: 0, search_count: 0, calls_made: 0, messages_sent: 0 },
        analysis: { supporter: 0, my_voter: 0, neutral: 0, opponent: 0 }
    });

    useEffect(() => { if (userId) fetchAnalytics(); }, [userId]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/users/analytics?userId=${userId}`);
            setData(response.data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    // 3. Define tiles using t('key')
    const WORK_TILES = [
        { id: 1, title: t('menu_search'), value: data.stats.search_count, icon: 'account-search-outline' },
        { id: 2, title: t('menu_my_voters'), value: data.stats.my_voters, icon: 'account-group-outline' },
        { id: 3, title: t('voter_slip'), value: 0, icon: 'file-document-outline' },
        { id: 4, title: t('voter_info'), value: 0, icon: 'account-details-outline' },
        { id: 5, title: t('nominee'), value: 0, icon: 'account-tie-outline' },
        { id: 6, title: t('voter_edit'), value: 0, icon: 'account-edit-outline' },
        { id: 7, title: t('messages_sent'), value: data.stats.messages_sent, icon: 'message-text-outline' },
        { id: 8, title: t('calls_connected'), value: data.stats.calls_made, icon: 'phone-outline' },
        { id: 9, title: t('mobile_edit'), value: 0, icon: 'cellphone' },
        { id: 10, title: t('video_sent'), value: 0, icon: 'video-outline' },
        { id: 11, title: t('audio_sent'), value: 0, icon: 'microphone-outline' },
        { id: 12, title: t('photo_sent'), value: 0, icon: 'image-outline' },
        { id: 13, title: t('print_slip'), value: 0, icon: 'printer-outline' },
    ];

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6600" /></View>;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6600" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('user_analysis')}</Text>
            </View>

            <View style={styles.toggleRow}>
                <ToggleBtn title={t('my_work')} active={activeTab === 'work'} onPress={() => setActiveTab('work')} />
                <ToggleBtn title={t('analysis')} active={activeTab === 'analysis'} onPress={() => setActiveTab('analysis')} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {activeTab === 'work' ? (
                    <>
                        <View style={styles.userCard}>
                            <MaterialCommunityIcons name="account-circle" size={50} color="#FF6600" />
                            <Text style={styles.userName}>{data.user.name}</Text>
                            <Text style={styles.userMobile}>{data.user.mobile}</Text>
                            <Text style={styles.scoreText}>{t('total_score')} : {data.user.score}</Text>
                        </View>

                        <View style={styles.grid}>
                            {WORK_TILES.map(tile => (
                                <StatCard key={tile.id} title={tile.title} value={tile.value} icon={tile.icon} />
                            ))}
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.trendCard}>
                            <Text style={styles.trendTitle}>{t('voter_trends')}</Text>
                            <View style={styles.chartArea}>
                                {(() => {
                                    const maxVal = Math.max(...Object.values(data.analysis)) || 1;
                                    return (
                                        <>
                                            <TrendBar label={t('supporter')} count={data.analysis.supporter} color="#00C8C8" max={maxVal} />
                                            <TrendBar label={t('my_voter')} count={data.analysis.my_voter} color="#1EB139" max={maxVal} />
                                            <TrendBar label={t('neutral')} count={data.analysis.neutral} color="#FFD740" max={maxVal} />
                                            <TrendBar label={t('opponent')} count={data.analysis.opponent} color="#FF5252" max={maxVal} />
                                        </>
                                    );
                                })()}
                            </View>
                        </View>

                        <View style={styles.legendCard}>
                            <LegendItem icon="thumb-up" color="#00C8C8" label={t('supporter')} count={data.analysis.supporter} />
                            <LegendItem icon="account-check" color="#1EB139" label={t('my_voter')} count={data.analysis.my_voter} />
                            <LegendItem icon="scale-balance" color="#FFD740" label={t('neutral')} count={data.analysis.neutral} />
                            <LegendItem icon="close-circle" color="#FF5252" label={t('opponent')} count={data.analysis.opponent} />
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

/* SUB-COMPONENTS - Updated to handle dynamic props */

function TrendBar({ label, count, color, max }: any) {
    return (
        <View style={styles.barWrapper}>
            <Text style={styles.barCount} adjustsFontSizeToFit numberOfLines={1}>{count}</Text>
            <View style={styles.barConstraint}>
                <View style={[styles.barBody, { height: `${(count / max) * 100}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.barLabel}>{label}</Text>
        </View>
    );
}

function StatCard({ title, value, icon }: any) {
    return (
        <View style={styles.statCard}>
            <MaterialCommunityIcons name={icon as any} size={22} color="#FF6600" />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    );
}

function ToggleBtn({ title, active, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.toggleBtn, active && styles.toggleActive]}>
            <Text style={[styles.toggleText, active && styles.toggleActiveText]}>{title}</Text>
        </TouchableOpacity>
    );
}

function LegendItem({ icon, color, label, count }: any) {
    return (
        <View style={styles.legendRow}>
            <MaterialCommunityIcons name={icon as any} size={22} color={color} />
            <Text style={styles.legendLabel}>{label}</Text>
            <Text style={[styles.legendValue, { color }]}>{count}</Text>
        </View>
    );
}

// Styles remain exactly the same
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', padding: 15, alignItems: 'center', backgroundColor: '#fff' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    toggleRow: { flexDirection: 'row', justifyContent: 'center', padding: 15, backgroundColor: '#fff' },
    toggleBtn: { paddingVertical: 8, paddingHorizontal: 25, borderRadius: 20, backgroundColor: '#eee', marginHorizontal: 5 },
    toggleActive: { backgroundColor: '#FF6600' },
    toggleText: { fontWeight: 'bold', color: '#666' },
    toggleActiveText: { color: '#fff' },
    userCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 15, alignItems: 'center', elevation: 2 },
    userName: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
    userMobile: { color: '#888' },
    scoreText: { marginTop: 10, color: '#FF6600', fontWeight: 'bold' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5, justifyContent: 'center' },
    statCard: { width: '30%', backgroundColor: '#fff', margin: '1.5%', padding: 10, borderRadius: 12, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#eee' },
    statValue: { fontSize: 14, fontWeight: 'bold', marginTop: 5 },
    statTitle: { fontSize: 9, color: '#666', textAlign: 'center', marginTop: 2 },
    trendCard: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 15, elevation: 2 },
    trendTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    chartArea: { height: 200, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
    barWrapper: { alignItems: 'center', width: '23%', height: '100%', justifyContent: 'flex-end' },
    barConstraint: { height: 140, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
    barCount: { fontSize: 11, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
    barBody: { width: 30, borderRadius: 5, minHeight: 2 },
    barLabel: { fontSize: 9, marginTop: 10, color: '#666', height: 30, textAlign: 'center', fontWeight: 'bold' },
    legendCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 15, elevation: 2 },
    legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    legendLabel: { flex: 1, marginLeft: 10, fontSize: 14 },
    legendValue: { fontWeight: 'bold', fontSize: 16 }
});