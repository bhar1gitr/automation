import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import API from '../../../../../services/api';

export default function VoterDetail() {
  const { epic_id } = useLocalSearchParams();
  const router = useRouter();
  const [voter, setVoter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVoterDetails = async () => {
      try {
        const response = await API.get(`/reports/voters/${epic_id}`);
        setVoter(response.data);
      } catch (error) {
        console.error("Error fetching details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVoterDetails();
  }, [epic_id]);

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#FF6600" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voter Details</Text>
      </View>

      <ScrollView>
        <View style={styles.card}>
          <MaterialCommunityIcons name="account-details" size={60} color="#FF6600" style={{alignSelf: 'center'}} />
          <Text style={styles.title}>{voter?.full_name}</Text>
          <View style={styles.divider} />
          
          {/* Detailed Information Rows */}
          <DetailRow label="NAME" value={voter?.full_name || voter?.name} icon="account-outline" />
          <DetailRow label="EPIC ID" value={voter?.epic_id} icon="card-account-details-outline" />
          <DetailRow label="AGE" value={voter?.age} icon="calendar-clock" />
          <DetailRow label="GENDER" value={voter?.gender} icon="gender-male-female" />
          <DetailRow label="BOOTH" value={voter?.booth} icon="map-marker" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DetailRow = ({ label, value, icon }: any) => (
  <View style={styles.detailRow}>
    <MaterialCommunityIcons name={icon} size={20} color="#666" />
    <View style={{marginLeft: 15}}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 10,
    backgroundColor: '#fff' 
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
    color: '#333'
  },
  card: { 
    backgroundColor: '#fff', 
    margin: 20, 
    padding: 20, 
    borderRadius: 15, 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 10, color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 12, color: '#999', fontWeight: 'bold' },
  value: { fontSize: 16, color: '#333', marginTop: 2 }
});