// import React, { useEffect, useState } from 'react';
// import { 
//     View, Text, StyleSheet, TouchableOpacity, ScrollView, 
//     ActivityIndicator, Alert, Dimensions 
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { useTranslation } from 'react-i18next';
// import API from '../../services/api';
// import { getColorReportOffline, getOfflineVoterCount } from '../../db/sqliteService';

// const { width } = Dimensions.get('window');

// export default function ColorReport() {
//     const { t } = useTranslation();
//     const router = useRouter();
    
//     const [loading, setLoading] = useState(true);
//     const [isOfflineMode, setIsOfflineMode] = useState(false);
    
//     const [stats, setStats] = useState({
//         supporter: 0,
//         my_voter: 0,
//         neutral: 0,
//         opponent: 0,
//         blank: 0
//     });

//     useEffect(() => {
//         initReport();
//     }, []);

//     const initReport = async () => {
//         // Check if we have offline data
//         const count = await getOfflineVoterCount();
//         if (count > 0) {
//             fetchOfflineReport();
//         } else {
//             fetchColorReport(); // Fetch from Server
//         }
//     };

//     const fetchColorReport = async () => {
//         setLoading(true);
//         try {
//             const response = await API.get('/reports/color');
//             setStats(response.data);
//             setIsOfflineMode(false);
//         } catch (error) {
//             console.log("Server error, trying offline calculation...");
//             fetchOfflineReport();
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchOfflineReport = async () => {
//         setLoading(true);
//         try {
//             const localStats = await getColorReportOffline();
//             setStats(localStats);
//             setIsOfflineMode(true);
//         } catch (error) {
//             Alert.alert(t('error_title'), t('error_load_report'));
//         } finally {
//             setLoading(false);
//         }
//     };

//     const totalVoters = stats.supporter + stats.my_voter + stats.neutral + stats.opponent + stats.blank;

//     const reportData = [
//         { id: '1', label: t('supporter'), count: stats.supporter, color: '#00C8C8', icon: 'thumb-up' },
//         { id: '2', label: t('my_voter'), count: stats.my_voter, color: '#1EB139', icon: 'account-check' },
//         { id: '3', label: t('neutral'), count: stats.neutral, color: '#FFD740', icon: 'scale-balance' },
//         { id: '4', label: t('opponent'), count: stats.opponent, color: '#FF5252', icon: 'close-circle' },
//     ];

//     return (
//         <SafeAreaView style={styles.container}>
//             <View style={styles.header}>
//                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//                     <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
//                 </TouchableOpacity>
//                 <View>
//                     <Text style={styles.headerTitle}>{t('color_report_title')}</Text>
//                     <Text style={[styles.modeText, { color: isOfflineMode ? '#4CAF50' : '#FF9800' }]}>
//                         {isOfflineMode ? "● Offline Data" : "● Live Data"}
//                     </Text>
//                 </View>
//             </View>

//             {loading ? (
//                 <View style={styles.centerLoader}>
//                     <ActivityIndicator size="large" color="#FF6600" />
//                     <Text style={styles.loaderText}>Generating Report...</Text>
//                 </View>
//             ) : (
//                 <ScrollView contentContainerStyle={styles.content}>
                    
//                     {/* Summary Card */}
//                     <View style={styles.summaryCard}>
//                         <Text style={styles.summaryLabel}>{t('total_voters')}</Text>
//                         <Text style={styles.summaryCount}>{totalVoters}</Text>
//                     </View>

//                     {/* Report Cards */}
//                     {reportData.map((item) => (
//                         <View key={item.id} style={[styles.reportRow, { borderLeftColor: item.color }]}>
//                             <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}> 
//                                 <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
//                             </View>
//                             <View style={styles.rowText}>
//                                 <Text style={styles.label}>{item.label}</Text>
//                                 <Text style={styles.count}>{item.count}</Text>
//                             </View>
//                             {/* Progress Bar Background */}
//                             <View style={[styles.progressBar, { 
//                                 width: `${(item.count / totalVoters * 100) || 0}%`, 
//                                 backgroundColor: item.color + '25' 
//                             }]} />
//                         </View>
//                     ))}

//                     {/* Blank Stat */}
//                     <View style={[styles.reportRow, { borderLeftColor: '#999' }]}>
//                         <View style={[styles.iconBox, { backgroundColor: '#eee' }]}>
//                             <MaterialCommunityIcons name="account-question" size={24} color="#666" />
//                         </View>
//                         <View style={styles.rowText}>
//                             <Text style={styles.label}>{t('blank_voter')}</Text>
//                             <Text style={styles.count}>{stats.blank}</Text>
//                         </View>
//                     </View>

//                     <TouchableOpacity style={styles.refreshBtn} onPress={initReport}>
//                         <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
//                         <Text style={styles.refreshBtnText}>Refresh Stats</Text>
//                     </TouchableOpacity>

//                 </ScrollView>
//             )}
//         </SafeAreaView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#F5F7FA' },
//     header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2 },
//     backButton: { marginRight: 15 },
//     headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
//     modeText: { fontSize: 10, fontWeight: 'bold' },
//     centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     loaderText: { marginTop: 10, color: '#666' },
//     content: { padding: 20 },
//     summaryCard: {
//         backgroundColor: '#fff',
//         borderRadius: 15,
//         padding: 20,
//         alignItems: 'center',
//         marginBottom: 20,
//         elevation: 3
//     },
//     summaryLabel: { fontSize: 16, color: '#666', marginBottom: 5 },
//     summaryCount: { fontSize: 32, fontWeight: 'bold', color: '#FF6600' },
//     reportRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#fff',
//         padding: 15,
//         borderRadius: 12,
//         marginBottom: 12,
//         borderLeftWidth: 5,
//         overflow: 'hidden',
//         position: 'relative',
//         elevation: 2
//     },
//     iconBox: {
//         width: 45, height: 45, borderRadius: 25,
//         justifyContent: 'center', alignItems: 'center',
//         marginRight: 15,
//         zIndex: 2
//     },
//     rowText: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
//     label: { fontSize: 16, fontWeight: '600', color: '#333' },
//     count: { fontSize: 18, fontWeight: 'bold', color: '#333' },
//     progressBar: {
//         position: 'absolute',
//         top: 0, bottom: 0, left: 0,
//         zIndex: 1
//     },
//     refreshBtn: { 
//         flexDirection: 'row', 
//         backgroundColor: '#333', 
//         padding: 15, 
//         borderRadius: 10, 
//         justifyContent: 'center', 
//         alignItems: 'center',
//         marginTop: 10,
//         marginBottom: 30
//     },
//     refreshBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 }
// });


import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, 
    ActivityIndicator, Alert, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router'; // Added useFocusEffect
import { useTranslation } from 'react-i18next';
import API from '../../services/api';
import { getColorReportOffline } from '../../db/sqliteService';

const { width } = Dimensions.get('window');

export default function ColorReport() {
    const { t } = useTranslation();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    
    const [stats, setStats] = useState({
        supporter: 0,
        my_voter: 0,
        neutral: 0,
        opponent: 0,
        blank: 0
    });

    /**
     * useFocusEffect runs every time this screen becomes active.
     * This fixes the issue of data not updating when returning from the Detail page.
     */
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Try fetching from Server first
            const response = await API.get('/reports/color');
            setStats(response.data);
            setIsOfflineMode(false);
        } catch (error) {
            // 2. Fallback to SQLite if server is unreachable
            console.log("Server unreachable, fetching from local database...");
            await fetchOfflineReport();
        } finally {
            setLoading(false);
        }
    };

    const fetchOfflineReport = async () => {
        try {
            const localStats = await getColorReportOffline();
            setStats(localStats);
            setIsOfflineMode(true);
        } catch (error) {
            Alert.alert(t('error_title'), t('error_load_report'));
        }
    };

    const totalVoters = stats.supporter + stats.my_voter + stats.neutral + stats.opponent + stats.blank;

    const reportData = [
        { id: '1', label: t('supporter'), count: stats.supporter, color: '#00C8C8', icon: 'thumb-up' },
        { id: '2', label: t('my_voter'), count: stats.my_voter, color: '#1EB139', icon: 'account-check' },
        { id: '3', label: t('neutral'), count: stats.neutral, color: '#FFD740', icon: 'scale-balance' },
        { id: '4', label: t('opponent'), count: stats.opponent, color: '#FF5252', icon: 'close-circle' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{t('color_report_title')}</Text>
                    <Text style={[styles.modeText, { color: isOfflineMode ? '#4CAF50' : '#2196F3' }]}>
                        {isOfflineMode ? "● Offline Mode" : "● Live Mode"}
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#FF6600" />
                    <Text style={styles.loaderText}>Calculating Stats...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{t('total_voters')}</Text>
                        <Text style={styles.summaryCount}>{totalVoters}</Text>
                    </View>

                    {reportData.map((item) => (
                        <View key={item.id} style={[styles.reportRow, { borderLeftColor: item.color }]}>
                            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}> 
                                <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                            </View>
                            <View style={styles.rowText}>
                                <Text style={styles.label}>{item.label}</Text>
                                <Text style={styles.count}>{item.count}</Text>
                            </View>
                            {/* Visual Progress Bar */}
                            <View style={[styles.progressBar, { 
                                width: `${(item.count / totalVoters * 100) || 0}%`, 
                                backgroundColor: item.color + '15' 
                            }]} />
                        </View>
                    ))}

                    <View style={[styles.reportRow, { borderLeftColor: '#999' }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#eee' }]}>
                            <MaterialCommunityIcons name="account-question" size={24} color="#666" />
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.label}>{t('blank_voter')}</Text>
                            <Text style={styles.count}>{stats.blank}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
                        <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                        <Text style={styles.refreshBtnText}>Refresh Data</Text>
                    </TouchableOpacity>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    modeText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 10, color: '#666' },
    content: { padding: 20 },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    summaryLabel: { fontSize: 16, color: '#666', marginBottom: 5 },
    summaryCount: { fontSize: 36, fontWeight: 'bold', color: '#FF6600' },
    reportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 6,
        overflow: 'hidden',
        position: 'relative',
        elevation: 2
    },
    iconBox: {
        width: 46, height: 46, borderRadius: 23,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15, zIndex: 2
    },
    rowText: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
    label: { fontSize: 16, fontWeight: '600', color: '#333' },
    count: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    progressBar: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0,
        zIndex: 1
    },
    refreshBtn: { 
        flexDirection: 'row', 
        backgroundColor: '#333', 
        padding: 16, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40
    },
    refreshBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 }
});