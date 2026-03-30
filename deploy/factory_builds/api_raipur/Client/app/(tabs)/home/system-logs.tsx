import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import API from '../../../services/api'; 

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LogEntry = {
  _id: string;
  action: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'LOGIN' | 'OTHER';
  performedByName: string;
  targetName: string;
  details: string;
  createdAt: string;
};

export default function SystemLogs() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      const response = await API.get('/users/logs');
      const sortedLogs = response.data.data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (text) {
      const lowerText = text.toLowerCase();
      const filtered = logs.filter(log => 
        (log.performedByName && log.performedByName.toLowerCase().includes(lowerText)) ||
        (log.targetName && log.targetName.toLowerCase().includes(lowerText)) ||
        log.action.toLowerCase().includes(lowerText)
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'CREATE_USER':
        return { icon: 'account-plus', color: '#10B981', bg: '#ECFDF5', label: t('log_created') }; 
      case 'DELETE_USER':
        return { icon: 'delete', color: '#EF4444', bg: '#FEF2F2', label: t('log_deleted') }; 
      case 'UPDATE_USER':
        return { icon: 'pencil', color: '#3B82F6', bg: '#EFF6FF', label: t('log_updated') }; 
      case 'LOGIN':
        return { icon: 'login', color: '#FF6600', bg: '#FFF0E6', label: t('log_login') }; 
      default:
        return { icon: 'information', color: '#6B7280', bg: '#F3F4F6', label: t('log_system') }; 
    }
  };

  const renderItem = ({ item, index }: { item: LogEntry, index: number }) => {
    const style = getActionStyle(item.action);
    const dateObj = new Date(item.createdAt);
    
    const date = dateObj.toLocaleDateString(i18n.language === 'en' ? 'en-IN' : i18n.language, { day: 'numeric', month: 'short' });
    const time = dateObj.toLocaleTimeString(i18n.language === 'en' ? 'en-IN' : i18n.language, { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLineContainer}>
           <View style={[styles.timelineDot, { backgroundColor: '#FF6600' }]} />
           {index !== filteredLogs.length - 1 && <View style={styles.timelineVerticalLine} />}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: style.bg }]}>
              <MaterialCommunityIcons name={style.icon as any} size={14} color={style.color} style={{marginRight:4}} />
              <Text style={[styles.badgeText, { color: style.color }]}>{style.label}</Text>
            </View>
            <Text style={styles.dateText}>{date}, {time}</Text>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.mainText}>
              <Text style={styles.actorText}>{item.performedByName || t('unknown')}</Text>
              <Text style={styles.actionText}> {style.label.toLowerCase()} </Text>
              <Text style={styles.targetText}>{item.targetName || t('user')}</Text>
            </Text>
            {item.details ? (
               <View style={styles.detailsBox}>
                 <Text style={styles.subText} numberOfLines={2}>{item.details}</Text>
               </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
             <MaterialCommunityIcons name="arrow-left" size={26} color="#FF6600" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('audit_logs')}</Text>
          <View style={{ width: 26 }} /> 
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_logs')}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color="#FF6600" />
           <Text style={styles.loadingText}>{t('loading_history')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6600']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <MaterialCommunityIcons name="text-box-search-outline" size={40} color="#FF6600" />
              </View>
              <Text style={styles.emptyText}>{t('no_logs_found')}</Text>
              <Text style={styles.emptySubText}>{t('admin_actions_desc')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#FFF',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  searchContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F6F7',
    borderRadius: 12, 
    paddingHorizontal: 12, 
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  listContent: { padding: 20, paddingBottom: 50 },
  timelineItem: { flexDirection: 'row', marginBottom: 25 },
  
  timelineLineContainer: { width: 20, alignItems: 'center', marginRight: 15 },
  timelineDot: { 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    zIndex: 2, 
    borderWidth: 3, 
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  timelineVerticalLine: { 
    width: 2, 
    backgroundColor: '#f0f0f0', 
    position: 'absolute', 
    top: 14, 
    bottom: -25, 
    zIndex: 1 
  },

  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 
  },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  dateText: { fontSize: 12, color: '#999', fontWeight: '500' },
  
  mainText: { fontSize: 15, color: '#444', lineHeight: 22 },
  actorText: { fontWeight: 'bold', color: '#222' },
  actionText: { color: '#666' },
  targetText: { fontWeight: 'bold', color: '#222' },
  detailsBox: { 
    marginTop: 10, 
    backgroundColor: '#F9FAFB', 
    padding: 10, 
    borderRadius: 10, 
    borderLeftWidth: 4, 
    borderLeftColor: '#FF6600' 
  },
  subText: { fontSize: 13, color: '#777', fontStyle: 'italic' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#999', fontSize: 14 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF0E6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }
});