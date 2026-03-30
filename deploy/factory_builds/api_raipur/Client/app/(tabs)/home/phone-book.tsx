import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    FlatList, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import API from '../../../services/api'; 
import { useAuth } from '../../../services/AuthContext'; 
import { getPhonebookOffline, saveVotersLocally } from '../../../db/sqliteService';

export default function PhoneBook() {
    const { t } = useTranslation();
    const router = useRouter();
    const { userId } = useAuth(); 
    
    const [search, setSearch] = useState('');
    const [contacts, setContacts] = useState<any[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);

    // 1. Load Local Data Immediately (Fast UI)
    const loadLocalData = async () => {
        const localData = await getPhonebookOffline();
        setContacts(localData);
        setFilteredContacts(localData);
        setLoading(false);
    };

    // 2. Fetch from Server and Update Local Database
    const syncWithServer = async () => {
        if (!userId) return;
        try {
            const response = await API.get(`/users/phonebook/${userId}`);
            const serverData = response.data;

            if (serverData && serverData.length > 0) {
                // Update SQLite with fresh data from server
                await saveVotersLocally(serverData);
                
                // Refresh UI with latest data
                setContacts(serverData);
                setFilteredContacts(serverData);
                setIsOffline(false);
            }
        } catch (error) {
            console.log("Sync failed, staying in offline mode.");
            setIsOffline(true);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                setLoading(true);
                await loadLocalData(); // Show local data first
                await syncWithServer(); // Then try to sync in background
                setLoading(false);
            };
            init();
        }, [userId])
    );

    // Search Logic (Remains the same)
    useEffect(() => {
        const lowerSearch = search.toLowerCase().trim();
        if (lowerSearch === '') {
            setFilteredContacts(contacts);
        } else {
            const filtered = contacts.filter(item => 
                item.name?.toLowerCase().includes(lowerSearch) ||
                item.mobile?.includes(lowerSearch) ||
                item.epic_id?.toLowerCase().includes(lowerSearch)
            );
            setFilteredContacts(filtered);
        }
    }, [search, contacts]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push({
                pathname: "/details/[id]",
                params: { id: item.id || item._id }
            })}
        >
            <View style={styles.rowBetween}>
                <Text style={styles.name}>
                    {item.name} {item.age ? `(${item.age})` : ''}
                </Text>
                <View style={[styles.statusDot, { backgroundColor: item.colorCode || '#ccc' }]} />
            </View>

            <View style={styles.rowBetween}>
                <Text style={styles.orangeText}>{t('sr_label')} {item.srNo}</Text>
                <Text style={styles.orangeText}>{t('part_label')} {item.part}</Text>
            </View>

            <Text style={styles.detail}>EPIC: {item.epic_id}</Text>
            <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={14} color="#666" style={{marginRight: 5}} />
                <Text style={styles.detail}>
                    {item.mobile || "N/A"} / {item.gender === 'M' || item.gender === 'Male' ? t('male_label') : t('female_label')}
                </Text>
            </View>

            <View style={styles.expand}>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#666" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6600" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{t('phonebook_title')}</Text>
                    <Text style={[styles.modeText, { color: isOffline ? '#4CAF50' : '#2196F3' }]}>
                        {isOffline ? "● Offline Mode" : "● Connected"}
                    </Text>
                </View>
            </View>

            <View style={styles.topRow}>
                <View style={styles.searchBox}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#999" style={{marginRight: 8}} />
                    <TextInput
                        placeholder={t('search_contact_placeholder')}
                        placeholderTextColor="#999"
                        value={search}
                        onChangeText={setSearch}
                        style={styles.input}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.reloadBtn, { backgroundColor: isOffline ? '#666' : '#FF6600' }]} 
                    onPress={syncWithServer}
                >
                    <MaterialCommunityIcons name="sync" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <Text style={styles.countText}>{t('total')} : {filteredContacts.length}</Text>

            {loading && contacts.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FF6600" />
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => (item.id || item._id).toString()}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={renderItem}
                    initialNumToRender={10}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <MaterialCommunityIcons name="book-open-blank-variant" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>{t('no_contacts')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    modeText: { fontSize: 10, marginLeft: 10, fontWeight: 'bold' },
    topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 15 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, height: 50, elevation: 3 },
    input: { flex: 1, fontSize: 15, color: '#333' },
    reloadBtn: { alignItems: 'center', justifyContent: 'center', marginLeft: 10, width: 50, height: 50, borderRadius: 12, elevation: 3 },
    countText: { marginLeft: 20, marginTop: 15, marginBottom: 5, color: '#666', fontWeight: '600' },
    card: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 12, padding: 15, borderRadius: 15, elevation: 2 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    row: { flexDirection: 'row', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    orangeText: { color: '#FF6600', fontWeight: 'bold', marginTop: 5, fontSize: 12 },
    detail: { color: '#666', fontSize: 13, marginTop: 3 },
    expand: { alignItems: 'flex-end', marginTop: -15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { textAlign: 'center', marginTop: 10, color: '#999', fontSize: 14 }
});