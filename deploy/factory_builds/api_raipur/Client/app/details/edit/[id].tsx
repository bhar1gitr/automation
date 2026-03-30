import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import API from '../../../services/api';

export default function EditVoter() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        voter_name_eng: '',
        age: '',
        gender: '',
        epic_id: '',
        fatherName: '',
        yadi_bhag: ''
    });

    useEffect(() => {
        fetchVoterData();
    }, [id]);

    const fetchVoterData = async () => {
        try {
            const response = await API.get(`/voters/${id}`);
            setForm(response.data);
        } catch (error) {
            Alert.alert("Error", "माहिती मिळवता आली नाही");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!form.name || !form.epic_id) {
            return Alert.alert("Required", "नाव आणि EPIC ID भरणे अनिवार्य आहे");
        }

        setSaving(true);
        try {
            await API.put(`/voters/${id}`, form);
            Alert.alert("Success", "माहिती यशस्वीरित्या अपडेट झाली", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert("Error", "अपडेट अयशस्वी");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6600" /></View>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>माहिती सुधारा (Edit)</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.formContent}>
                <InputGroup label="मतदाराचे नाव (Marathi)" value={form.name} onChange={(val) => setForm({...form, name: val})} />
                <InputGroup label="Voter Name (English)" value={form.voter_name_eng} onChange={(val) => setForm({...form, voter_name_eng: val})} />
                <InputGroup label="EPIC ID" value={form.epic_id} onChange={(val) => setForm({...form, epic_id: val})} />
                
                <View style={styles.row}>
                    <InputGroup label="वय" value={String(form.age)} onChange={(val) => setForm({...form, age: val})} keyboardType="numeric" flex={1} />
                    <InputGroup label="लिंग" value={form.gender} onChange={(val) => setForm({...form, gender: val})} flex={1} />
                </View>

                <InputGroup label="वडिलांचे / पतीचे नाव" value={form.fatherName} onChange={(val) => setForm({...form, fatherName: val})} />
                <InputGroup label="पत्ता / सोसायटी (Yadi Bhag)" value={form.yadi_bhag} onChange={(val) => setForm({...form, yadi_bhag: val})} multiline />

                <TouchableOpacity 
                    style={[styles.saveButton, saving && { opacity: 0.7 }]} 
                    onPress={handleUpdate}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>जतन करा (Save Changes)</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const InputGroup = ({ label, value, onChange, keyboardType = 'default', multiline = false, flex = null }) => (
    <View style={[styles.inputGroup, flex ? { flex } : {}]}>
        <Text style={styles.label}>{label}</Text>
        <TextInput 
            style={[styles.input, multiline && styles.textArea]} 
            value={value} 
            onChangeText={onChange} 
            keyboardType={keyboardType}
            multiline={multiline}
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    formContent: { padding: 20 },
    inputGroup: { marginBottom: 15, marginHorizontal: 5 },
    label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#E9ECEF', color: '#333' },
    textArea: { height: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', marginHorizontal: -5 },
    saveButton: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, elevation: 2 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});