import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import API from '../../../../services/api';
import { getVotersByYadiOffline } from '../../../../db/sqliteService';

export default function FinalVoterList() {
    const { t } = useTranslation();
    const router = useRouter();
    const { yadiString } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [voters, setVoters] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [isOffline, setIsOffline] = useState(false);

    useFocusEffect(
        useCallback(() => { fetchVoters(); }, [yadiString])
    );

    const fetchVoters = async () => {
        try {
            const response = await API.get(`/reports/voters-by-yadi?yadiString=${encodeURIComponent(yadiString)}`);
            setVoters(response.data.data);
            setFiltered(response.data.data);
            setIsOffline(false);
        } catch {
            const local = await getVotersByYadiOffline(yadiString);
            setVoters(local.data);
            setFiltered(local.data);
            setIsOffline(true);
        } finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={26} color="#FF6600" /></TouchableOpacity>
                <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{t('voter_list_title')}</Text>
                    <Text style={{fontSize:10, color: isOffline ? '#4CAF50' : '#2196F3'}}>{isOffline ? "Offline" : "Live"}</Text>
                </View>
            </View>

            <View style={styles.searchBar}>
                <TextInput placeholder={t('search_voter_placeholder')} value={search} onChangeText={(t) => {
                    setSearch(t);
                    setFiltered(voters.filter(v => v.name.includes(t) || v.epic_id.includes(t)));
                }} style={{flex:1}} />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#FF6600" /></View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/details/[id]", params: { id: item._id } })}>
                            <View style={styles.serialBox}><Text style={{fontWeight:'bold'}}>{item.srNo}</Text></View>
                            <View style={{flex:1, marginLeft:10}}>
                                <Text style={{fontWeight:'bold'}}>{item.name}</Text>
                                <Text style={{color:'#666'}}>{item.epic_id}</Text>
                            </View>
                            <Text style={{color:'#FF6600', fontWeight:'bold'}}>{item.age} Yr</Text>
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
    headerTitle: { fontSize: 16, fontWeight: 'bold' },
    searchBar: { backgroundColor: '#fff', padding: 10, margin: 10, borderRadius: 10, borderWeight: 1, borderColor: '#eee' },
    card: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', marginHorizontal: 10, marginBottom: 8, borderRadius: 10, alignItems: 'center', elevation: 1 },
    serialBox: { backgroundColor: '#E3F2FD', padding: 8, borderRadius: 5 }
});