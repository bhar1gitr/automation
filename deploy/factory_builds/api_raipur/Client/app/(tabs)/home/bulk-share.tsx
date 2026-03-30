import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  TextInput, 
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import API from '../../../services/api';

const BulkShareScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [numbers, setNumbers] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [service, setService] = useState<'sms' | 'whatsapp'>('whatsapp');
  const [loading, setLoading] = useState<boolean>(false);

  const handleBulkSend = async () => {
    if (!numbers.trim() || !message.trim()) {
      Alert.alert(t('error'), t('error_empty_fields'));
      return;
    }

    const numberArray = numbers
      .split(/[\n,]+/)
      .map(num => num.trim())
      .filter(num => num.length >= 10);

    if (numberArray.length === 0) {
      Alert.alert(t('error'), t('error_invalid_numbers'));
      return;
    }

    setLoading(true);

    try {
      await API.post('/bulk/direct-send', {
        numbers: numberArray,
        message: message,
        service: service,
      });

      Alert.alert(
        t('success'), 
        t('success_started', { count: numberArray.length, service: service.toUpperCase() })
      );
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || t('failed_connect');
      Alert.alert(t('failed'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Header matching your app style */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FF6600" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('bulk_share_title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Service Selection Cards */}
        <Text style={styles.label}>{t('select_service')}</Text>
        <View style={styles.serviceRow}>
          <TouchableOpacity 
            style={[styles.serviceCard, service === 'whatsapp' && styles.activeServiceCard]} 
            onPress={() => setService('whatsapp')}
          >
            <MaterialCommunityIcons 
              name="whatsapp" 
              size={28} 
              color={service === 'whatsapp' ? '#fff' : '#25D366'} 
            />
            <Text style={[styles.serviceText, service === 'whatsapp' && styles.activeText]}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.serviceCard, service === 'sms' && styles.activeServiceCard]} 
            onPress={() => setService('sms')}
          >
            <MaterialCommunityIcons 
              name="message-text" 
              size={28} 
              color={service === 'sms' ? '#fff' : '#FF6600'} 
            />
            <Text style={[styles.serviceText, service === 'sms' && styles.activeText]}>SMS</Text>
          </TouchableOpacity>
        </View>

        {/* Numbers Input */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <MaterialCommunityIcons name="format-list-numbered" size={20} color="#FF6600" />
            <Text style={styles.inputLabel}>{t('enter_numbers')}</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="9555726438, 9372553036..."
            multiline
            value={numbers}
            onChangeText={setNumbers}
          />
        </View>

        {/* Message Input */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <MaterialCommunityIcons name="email-edit-outline" size={20} color="#FF6600" />
            <Text style={styles.inputLabel}>{t('your_message')}</Text>
          </View>
          <TextInput
            style={[styles.textArea, { height: 120 }]}
            placeholder={t('placeholder_msg')}
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.sendButton, loading && styles.disabledButton]} 
          onPress={handleBulkSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons 
                name={service === 'whatsapp' ? 'whatsapp' : 'send'} 
                size={22} 
                color="#fff" 
                style={{ marginRight: 10 }}
              />
              <Text style={styles.sendButtonText}>
                {t('send_via', { service: service.toUpperCase() })}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10, color: '#333' },
  scrollContent: { padding: 20 },
  
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#999', textTransform: 'uppercase' },
  serviceRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  serviceCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 15, 
    alignItems: 'center', 
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee'
  },
  activeServiceCard: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
  serviceText: { marginTop: 8, fontWeight: 'bold', color: '#555' },
  activeText: { color: '#fff' },

  inputCard: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 20, 
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee'
  },
  inputHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inputLabel: { marginLeft: 8, fontSize: 15, fontWeight: 'bold', color: '#333' },
  textArea: { 
    fontSize: 16, 
    color: '#333', 
    textAlignVertical: 'top', 
    minHeight: 60,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12
  },

  sendButton: { 
    backgroundColor: '#FF6600', 
    flexDirection: 'row',
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 4,
    marginTop: 10
  },
  disabledButton: { backgroundColor: '#FFCCBC' },
  sendButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default BulkShareScreen;