import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router'; // 1. Import useRouter

import API from '../../services/api';
import { useAuth } from '../../services/AuthContext';

type UploadItem = {
  _id: string;
  fileName: string;
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export default function VoterHome() {
  const router = useRouter(); // 2. Initialize Router
  const { userId, userName } = useAuth();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUploads = async () => {
    if (!userId) return;
    try {
      const response = await API.get(`/uploads/${userId}`);
      setUploads(response.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUploads();
    }, [userId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUploads();
  };

  // 3. Navigation Handler
  const handleSubmitNew = () => {
    // Navigate to the 'uploads' tab
    router.push('/(tabs)/uploads');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#4CAF50';
      case 'Rejected': return '#F44336';
      default: return '#FF9800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const renderUploadItem = (item: UploadItem) => (
    <View key={item._id} style={styles.logCard}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="file-pdf-box" size={28} color="#FF6600" />
      </View>
      <View style={styles.logInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
        <Text style={styles.fileDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
         <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
           {item.status}
         </Text>
         {item.status === 'Approved' && (
            <MaterialCommunityIcons name="check" size={14} color="#4CAF50" style={{ marginLeft: 4 }} />
         )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back,</Text>
          <Text style={styles.userName}>{userName || "Voter Partner"}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <MaterialCommunityIcons name="account-circle-outline" size={32} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6600']} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Files</Text>
          <Text style={styles.subtitle}>History of your uploaded lists</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.logsContainer}>
            {uploads.length > 0 ? (
              uploads.map((item) => renderUploadItem(item))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="folder-open-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No files uploaded yet.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 4. NEW FLOATING ACTION BUTTON (FAB) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleSubmitNew}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        <Text style={styles.fabText}>Submit New List</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: { fontSize: 14, color: '#666' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  profileButton: { padding: 5 },
  sectionHeader: { marginBottom: 20, marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  logsContainer: { gap: 12 },
  
  /* Card */
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: { flex: 1, justifyContent: 'center' },
  fileName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  fileDate: { fontSize: 12, color: '#999' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { fontWeight: '600', fontSize: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },

  /* 5. FAB STYLES */
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    backgroundColor: '#FF6600',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});