import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet,
    Image,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import '../../i18n';

export default function HomeScreen() {
    const router = useRouter();
    const { t } = useTranslation();

    const DATA = [
        { id: '1', title: t('menu_search'), icon: 'account-search-outline', route: '/search' },
        { id: '2', title: t('menu_my_voters'), icon: 'account-group-outline', route: '/home/my-voters' },
        { id: '3', title: t('menu_phone_book'), icon: 'phone-outline', route: '/home/phone-book' },
        // { id: '4', title: 'प्रभाग रिपोर्ट', icon: 'file-document-outline', route: '/home/division-report' },
        { id: '5', title: t('menu_download'), icon: 'download-outline', route: '/home/download-data' },
        { id: '6', title: t('menu_analysis'), icon: 'chart-line', route: '/home/analysis' },
        { id: '7', title: t('menu_reports'), icon: 'file-chart-outline', route: '/home/reports' },
        // { id: '8', title: 'व्होटिंग', icon: 'ballot-outline', route: '/voting' },
        { id: '9', title: t('menu_uploads'), icon: 'file-check-outline', route: '/home/check-uploads' },
        { id: '10', title: t('menu_logs'), icon: 'history', route: '/home/system-logs' },
        { id: '11', title: t('menu_bulk_share'), icon: 'share-variant-outline', route: '/home/bulk-share' },
    ];

    const getCurrentDate = () => {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Top Banner */}
            <Image
                source={require('../../../assets/images/banner.jpg')}
                style={styles.banner}
            />

            {/* Main Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>{t('village_name')}</Text>
            </View>

            {/* Info Bar */}
            <View style={styles.infoBar}>
                <Text style={styles.infoLabel}>{t('version')} : <Text style={styles.infoValue}>3.9</Text></Text>
                <Text style={styles.infoLabel}>{t('release_date')} : <Text style={styles.infoValue}>{getCurrentDate()}</Text></Text>
            </View>

            {/* Grid Menu */}
            <FlatList
                data={DATA}
                numColumns={2}
                keyExtractor={(item) => item.id}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push(item.route as any)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name={item.icon as any} size={45} color="#FF6600" />
                        <Text style={styles.cardText}>{item.title}</Text>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    banner: {
        width: '100%',
        height: 180,
        resizeMode: 'cover'
    },
    header: {
        backgroundColor: '#FF6600',
        paddingVertical: 15,
        paddingHorizontal: 10
    },
    headerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    infoBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 5
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600'
    },
    infoValue: {
        color: '#D35400',
        fontWeight: 'bold'
    },
    listContent: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 40
    },
    row: {
        justifyContent: 'space-between', // Ensures equal spacing between the 2 columns
        paddingHorizontal: 5
    },
    card: {
        backgroundColor: '#fff',
        width: '47%', // Slightly less than 50% to account for row spacing
        aspectRatio: 1.1, // Keeps cards roughly square
        marginVertical: 10,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FF6A00',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        // Elevation for Android
        elevation: 4,
    },
    cardText: {
        marginTop: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        fontSize: 14,
        paddingHorizontal: 5
    }
});