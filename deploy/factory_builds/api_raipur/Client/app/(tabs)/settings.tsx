import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Switch,
    Modal,
    FlatList,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LANGUAGES } from '../../constants/language';
import API from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import { 
    getModifiedVoters, 
    markAsSynced, 
    setupDatabase, 
    deleteDatabase 
} from '../../db/sqliteService';

export default function SettingsScreen() {
    const { userName, role, signOut, userId } = useAuth();
    const { t, i18n } = useTranslation();
    const router = useRouter();

    // --- STATES ---
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

    // --- INITIAL LOAD ---
    useEffect(() => {
        const init = async () => {
            await setupDatabase();
            checkPendingChanges();
        };
        init();
    }, []);

    const checkPendingChanges = async () => {
        try {
            const modified = await getModifiedVoters();
            setPendingCount(modified.length);
        } catch (e) {
            console.error("Sync Check Error:", e);
        }
    };

    // --- ACTION HANDLERS ---
    const handleUpload = async () => {
        if (pendingCount === 0) return Alert.alert(t('up_to_date'), "No local changes to upload.");
        
        setIsSyncing(true);
        try {
            const modifiedData = await getModifiedVoters();
            await API.post('/sync/upload-voters', { voters: modifiedData, userId });
            
            const ids = modifiedData.map((v: any) => v.id);
            await markAsSynced(ids);
            
            setPendingCount(0);
            Alert.alert("Success", "All local data synced with server!");
        } catch (e) {
            Alert.alert("Error", "Server unreachable. Check your internet connection.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleWipeData = () => {
        Alert.alert(
            "Wipe Database?",
            "This will delete all 50,000 voter records from your phone. You will need to re-sync while online.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Wipe Everything", 
                    style: "destructive", 
                    onPress: async () => {
                        await deleteDatabase();
                        setPendingCount(0);
                        Alert.alert("Cleared", "Local storage is now empty.");
                    } 
                }
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(t('logout'), t('logout_confirm_msg'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('logout'), style: 'destructive', onPress: async () => {
                await AsyncStorage.clear();
                if (signOut) signOut();
                router.replace('/sign-in');
            }}
        ]);
    };

    const changeLanguage = async (code: string) => {
        i18n.changeLanguage(code);
        await AsyncStorage.setItem('user-language', code);
        setModalVisible(false);
    };

    // --- REUSABLE COMPONENT ---
    const SettingItem = ({ icon, title, subtitle, onPress, color = "#FF6600", isDestructive = false, rightElement, showSwitch = false }: any) => (
        <TouchableOpacity style={styles.item} onPress={onPress} disabled={showSwitch || !onPress}>
            <View style={[styles.iconContainer, { backgroundColor: isDestructive ? '#FFE5E5' : color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={22} color={isDestructive ? '#FF3B30' : color} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.itemTitle, isDestructive && { color: '#FF3B30' }]}>{title}</Text>
                {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
            </View>
            {showSwitch ? (
                <Switch 
                    value={isNotificationEnabled} 
                    onValueChange={setIsNotificationEnabled}
                    trackColor={{ false: "#ddd", true: "#FF660050" }}
                    thumbColor={isNotificationEnabled ? "#FF6600" : "#f4f3f4"}
                />
            ) : (
                rightElement || <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('settings')}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                
                {/* Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{userName?.charAt(0).toUpperCase() || 'U'}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{userName || "User"}</Text>
                        <Text style={styles.userRole}>{role?.toUpperCase() || "ADMIN"}</Text>
                    </View>
                </View>

                {/* Cloud Sync Section */}
                <Text style={styles.sectionTitle}>Data Management</Text>
                <View style={styles.group}>
                    <SettingItem 
                        icon="cloud-upload" 
                        title="Upload to Server" 
                        subtitle={pendingCount > 0 ? `${pendingCount} offline changes pending` : 'All data synced'}
                        color="#4CAF50"
                        onPress={handleUpload}
                        rightElement={isSyncing ? <ActivityIndicator size="small" color="#4CAF50" /> : null}
                    />
                    <SettingItem 
                        icon="database-sync" 
                        title="Force Download Re-Sync" 
                        subtitle="Refresh entire database"
                        onPress={() => router.push('/sync')}
                    />
                </View>

                {/* Preferences */}
                <Text style={styles.sectionTitle}>{t('preferences')}</Text>
                <View style={styles.group}>
                    <SettingItem 
                        icon="translate" 
                        title={t('language')} 
                        subtitle={LANGUAGES.find(l => l.value === i18n.language)?.label || 'English'} 
                        onPress={() => setModalVisible(true)} 
                    />
                    <SettingItem 
                        icon="bell-outline" 
                        title={t('notifications')} 
                        showSwitch={true} 
                    />
                </View>

                {/* System Section */}
                <Text style={styles.sectionTitle}>System</Text>
                <View style={styles.group}>
                    <SettingItem 
                        icon="trash-can-outline" 
                        title="Wipe Local Data" 
                        subtitle="Deletes 50,000 records"
                        color="#FF3B30"
                        onPress={handleWipeData}
                        isDestructive
                    />
                    <SettingItem icon="information-outline" title="About App" subtitle="Purna Voter Management v1.2.0" color="#2196F3" />
                </View>

                {/* Session */}
                <Text style={styles.sectionTitle}>Session</Text>
                <View style={styles.group}>
                    <SettingItem icon="logout" title={t('logout')} isDestructive onPress={handleLogout} />
                </View>

                <Text style={styles.footerVersion}>Built for Purna Village | ID: {userId?.slice(-6)}</Text>
            </ScrollView>

            {/* Language Selection Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('select_language')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={LANGUAGES}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.langOption} onPress={() => changeLanguage(item.value)}>
                                    <Text style={[styles.langText, i18n.language === item.value && styles.selectedLangText]}>{item.label}</Text>
                                    {i18n.language === item.value && <MaterialCommunityIcons name="check-circle" size={20} color="#FF6600" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
    profileCard: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', marginVertical: 10, alignItems: 'center' },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    profileInfo: { marginLeft: 15 },
    userName: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
    userRole: { fontSize: 12, color: '#7F8C8D', marginTop: 2, fontWeight: '600' },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#95A5A6', marginLeft: 20, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    group: { backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    iconContainer: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1, marginLeft: 15 },
    itemTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
    itemSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
    footerVersion: { textAlign: 'center', marginVertical: 30, color: '#BDC3C7', fontSize: 11 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    langOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    langText: { fontSize: 16 },
    selectedLangText: { color: '#FF6600', fontWeight: 'bold' }
});