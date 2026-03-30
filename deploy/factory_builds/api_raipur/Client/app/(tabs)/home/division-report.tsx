import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SUMMARY = {
    serial: 7,
    name: 'प्रभाग क्र. ७',
    total: 53242,
};

const VOTERS = [
    // {
    //     id: '1',
    //     name: 'सदानंद रघु प्रकाश शर्मा',
    //     age: 55,
    //     anukram: 'अनुक्रम-2',
    //     prabhag: 'प्रभाग-7',
    //     epic: 'XCE0563668',
    //     desk: 'डेस्क-146/301/1015',
    //     gender: 'स्त्री',
    // },
    // {
    //     id: '2',
    //     name: 'चौहान रीना',
    //     age: 0,
    //     anukram: 'अनुक्रम-3',
    //     prabhag: 'प्रभाग-7',
    //     epic: 'XCE5591706',
    //     desk: 'डेस्क-146/307/1401',
    //     gender: 'स्त्री',
    // },
    // {
    //     id: '3',
    //     name: 'प्रियंका प्रशांत मेहता',
    //     age: 27,
    //     anukram: 'अनुक्रम-4',
    //     prabhag: 'प्रभाग-7',
    //     epic: 'XCE4879722',
    //     desk: 'डेस्क-146/309/210',
    //     gender: 'स्त्री',
    // },
];

export default function DivisionReport() {
    const router = useRouter();
    const [loading] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6600" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>प्रभाग रिपोर्ट</Text>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
                <TextInput placeholder="शोधा" placeholderTextColor="#999" style={styles.input} />
                <MaterialCommunityIcons name="magnify" size={22} color="#FF6600" />
            </View>

            {/* Summary */}
            {/* <View style={styles.summaryCard}>
                <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>क्र.</Text>
                    <Text style={styles.summaryValue}>{SUMMARY.serial}</Text>
                </View>
                <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>नाव</Text>
                    <Text style={styles.summaryValue}>{SUMMARY.name}</Text>
                </View>
                <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>एकूण संख्या</Text>
                    <Text style={styles.summaryValue}>{SUMMARY.total}</Text>
                </View>
            </View> */}

            {/* Sort */}
            {/* <View style={styles.sortRow}>
                <Text style={styles.sortText}>अनुक्रमांक</Text>
                <MaterialCommunityIcons name="swap-vertical" size={18} color="#FF6600" />
            </View> */}

            {loading && <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 20 }} />}

            {/* List */}
            <FlatList
                data={VOTERS}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 80 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.name}>{item.name} ({item.age})</Text>
                            <MaterialCommunityIcons name="dots-vertical" size={20} color="#999" />
                        </View>

                        <View style={styles.rowBetween}>
                            <Text style={styles.orangeText}>{item.anukram}</Text>
                            <Text style={styles.orangeText}>{item.prabhag}</Text>
                        </View>

                        <Text style={styles.detail}>आय डी : {item.epic}</Text>
                        <Text style={styles.detail}>{item.gender}</Text>
                        <Text style={styles.detail}>{item.desk}</Text>

                        <View style={styles.expand}>
                            <MaterialCommunityIcons name="chevron-down" size={22} color="#666" />
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F3F3F3', margin: 15, paddingHorizontal: 15,
        borderRadius: 25, height: 45,
    },
    input: { flex: 1, fontSize: 14 },
    summaryCard: {
        flexDirection: 'row', justifyContent: 'space-between',
        marginHorizontal: 15, marginBottom: 10, padding: 15,
        borderWidth: 1.5, borderColor: '#FF6600', borderRadius: 12,
    },
    summaryCol: { alignItems: 'center' },
    summaryLabel: { color: '#666', fontSize: 12 },
    summaryValue: { fontWeight: 'bold', marginTop: 4 },
    sortRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 20 },
    sortText: { color: '#FF6600', fontWeight: '600', marginRight: 5 },
    card: { paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
    name: { fontSize: 15, fontWeight: 'bold' },
    orangeText: { color: '#FF6600', fontWeight: '600', marginTop: 4 },
    detail: { color: '#666', fontSize: 13, marginTop: 2 },
    expand: { alignItems: 'center', marginTop: 5 },
});