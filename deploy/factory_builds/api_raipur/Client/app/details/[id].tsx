import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Share, Alert, Modal, TextInput, Dimensions, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import API from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import { getVoterByIdOffline, updateVoterOffline } from '../../db/sqliteService';

const { width } = Dimensions.get('window');

// --- SUB-COMPONENTS ---
const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '-'}</Text>
  </View>
);

const SurveyItem = ({ label, value, icon = "pencil-outline", type = "input", onToggle, onEdit, isColor }: any) => (
  <View style={styles.surveyRow}>
    <Text style={styles.surveyLabel}>{label}</Text>
    <View style={styles.surveyAction}>
      {type === "input" ? (
        <View style={styles.inputWrapper}>
          {isColor ? (
            <View style={[styles.colorIndicator, { backgroundColor: value || '#ddd' }]} />
          ) : (
            <Text style={styles.surveyValueDisplay} numberOfLines={1}>{value || '...'}</Text>
          )}
          <TouchableOpacity onPress={onEdit}>
            <MaterialCommunityIcons name={icon} size={20} color="#FF6600" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.radioGroup}>
          <TouchableOpacity style={styles.radio} onPress={() => onToggle(false)}>
            <View style={styles.radioOuter}>{(!value || value === 0) && <View style={styles.radioInnerActive} />}</View>
            <Text style={styles.radioText}>नाही</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radio} onPress={() => onToggle(true)}>
            <View style={styles.radioOuter}>{(value === true || value === 1) && <View style={styles.radioInnerActive} />}</View>
            <Text style={styles.radioText}>होय</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
);

export default function VoterDetails() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { userId } = useAuth();
  const router = useRouter();
  const viewShotRef = useRef<any>();

  const [activeTab, setActiveTab] = useState('Information');
  const [voter, setVoter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [currentEdit, setCurrentEdit] = useState({ key: '', label: '', value: '' });

  const COLOR_OPTIONS = [
    { id: '1', label: t('supporter'), color: '#00C8C8' },
    { id: '2', label: t('my_voter'), color: '#1EB139' },
    { id: '3', label: t('neutral'), color: '#FFD740' },
    { id: '4', label: t('opponent'), color: '#FF5252' },
  ];

  useEffect(() => {
    if (id) fetchVoterDetails();
  }, [id]);

  const fetchVoterDetails = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/voters/${id}`);
      setVoter(response.data);
    } catch (error) {
      console.log("Offline mode: Fetching from SQLite");
      const offlineVoter = await getVoterByIdOffline(id as string);
      if (offlineVoter) setVoter(offlineVoter);
      else Alert.alert(t('error'), t('data_not_found'));
    } finally {
      setLoading(false);
    }
  };

  // --- HYBRID UPDATE LOGIC ---
  const updateVoterField = async (fieldName: string, value: any) => {
    setIsSaving(true);
    const updatePayload = { [fieldName]: value };
    
    try {
      // 1. Try to sync with Server
      const response = await API.put(`/voters/${id}`, { ...updatePayload, userId });
      setVoter(response.data);
      // 2. Also update local SQLite so search results stay consistent
      await updateVoterOffline(id as string, updatePayload);
      
      setEditModalVisible(false);
      setColorModalVisible(false);
    } catch (error) {
      // 3. Fallback: Save to SQLite only (mark for later sync)
      console.log("Server unreachable. Saving change locally...");
      const success = await updateVoterOffline(id as string, updatePayload);
      if (success) {
        setVoter((prev: any) => ({ ...prev, ...updatePayload }));
        Alert.alert("Offline", "Saved locally. Will sync when online.");
      }
      setEditModalVisible(false);
      setColorModalVisible(false);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (key: string, label: string, value: any) => {
    setCurrentEdit({ key, label, value: value ? String(value) : '' });
    setEditModalVisible(true);
  };

  const shareTicketImage = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri);
    } catch (error) { Alert.alert(t('error'), "Could not share."); }
  };

  if (loading) return <ActivityIndicator size="large" color="#FF6600" style={styles.loader} />;
  if (!voter) return <View style={styles.loader}><Text>{t('data_not_found')}</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.orangeHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FF6600" style={styles.backIconBg} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{voter.name}</Text>
      </View>

      <View style={styles.tabBar}>
        {['Information', 'Survey'].map((key) => (
          <TouchableOpacity 
            key={key} 
            style={[styles.tabItem, activeTab === key && styles.activeTabBorder]} 
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>
              {key === 'Information' ? t('Information') : t('Survey')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'Information' && (
          <View style={styles.card}>
            <View style={styles.voterHeader}>
              <Text style={styles.voterMainName}>{voter.name}</Text>
              <View style={[styles.statusDot, { backgroundColor: voter.colorCode || '#ddd' }]} />
            </View>
            <View style={styles.gridContainer}>
              <View style={styles.gridItem}><Text style={styles.gridLabel}>{t('ward')}</Text><Text style={styles.gridValue}>{voter.part || voter.parbhag || '-'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.gridLabel}>{t('sr_no')}</Text><Text style={styles.gridValue}>{voter.srNo || '-'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.gridLabel}>{t('age')}</Text><Text style={styles.gridValue}>{voter.age || '-'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.gridLabel}>{t('gender')}</Text><Text style={styles.gridValue}>{voter.gender || '-'}</Text></View>
            </View>
            
            <InfoRow label={t('father_name')} value={voter.fatherName} />
            <InfoRow label={t('dob')} value={voter.dob} />
            <InfoRow label={t('village')} value={voter.mahanagarpalika} />
            <InfoRow label={t('epic_id')} value={voter.epic_id} />
            
            <View style={styles.addressBox}>
              <Text style={styles.infoLabel}>{t('address')}</Text>
              <Text style={styles.addressText}>{voter.yadi_bhag}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.ticketBtn} onPress={() => setTicketModalVisible(true)}>
                <MaterialCommunityIcons name="ticket-confirmation" size={20} color="#fff" />
                <Text style={styles.ticketBtnText}>{t('digital_ticket')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.shareBtnInfo} 
                onPress={() => Share.share({ message: `नाव: ${voter.name}\nEPIC: ${voter.epic_id}\nWard: ${voter.part}` })}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'Survey' && (
          <View style={styles.card}>
            {/* Survey Fields - All editable offline */}
            <SurveyItem label={t('mobile')} value={voter.mobile} onEdit={() => openEditModal('mobile', t('mobile'), voter.mobile)} />
            <SurveyItem label={t('mobile2')} value={voter.mobile2} onEdit={() => openEditModal('mobile2', t('mobile2'), voter.mobile2)} />
            <SurveyItem label={t('dob')} value={voter.dob} onEdit={() => openEditModal('dob', t('dob'), voter.dob)} />
            <SurveyItem label={t('voter_category')} value={voter.colorCode} isColor onEdit={() => setColorModalVisible(true)} />
            <SurveyItem label={t('caste')} value={voter.caste} onEdit={() => openEditModal('caste', t('caste'), voter.caste)} />
            <SurveyItem label={t('designation')} value={voter.designation} onEdit={() => openEditModal('designation', t('designation'), voter.designation)} />
            <SurveyItem label={t('society')} value={voter.society} onEdit={() => openEditModal('society', t('society'), voter.society)} />
            <SurveyItem label={t('flat_no')} value={voter.flatNo} onEdit={() => openEditModal('flatNo', t('flat_no'), voter.flatNo)} />
            <SurveyItem label={t('demands')} value={voter.demands} onEdit={() => openEditModal('demands', t('demands'), voter.demands)} />
            
            <View style={styles.divider} />
            
            <SurveyItem label={t('voted')} type="radio" value={voter.isVoted} onToggle={(val: boolean) => updateVoterField('isVoted', val)} />
            <SurveyItem label={t('star_voter')} type="radio" value={voter.isStar} onToggle={(val: boolean) => updateVoterField('isStar', val)} />
            <SurveyItem label={t('is_dead')} type="radio" value={voter.isDead} onToggle={(val: boolean) => updateVoterField('isDead', val)} />
            
            {isSaving && (
              <View style={styles.savingLoader}>
                <ActivityIndicator color="#FF6600" />
                <Text style={styles.savingText}>Updating...</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* --- ALL MODALS --- */}
      
      {/* Category/Color Modal */}
      <Modal visible={colorModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editCard}>
            <Text style={styles.modalTitle}>{t('voter_category')}</Text>
            {COLOR_OPTIONS.map((opt) => (
              <TouchableOpacity 
                key={opt.id} 
                style={[styles.colorOption, { backgroundColor: opt.color }]} 
                onPress={() => updateVoterField('colorCode', opt.color)}
              >
                <Text style={styles.colorLabel}>{opt.label}</Text>
                {voter?.colorCode === opt.color && <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setColorModalVisible(false)}>
              <Text style={styles.closeModalText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Field Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.editCard}>
            <Text style={styles.modalTitle}>{t('update')} {currentEdit.label}</Text>
            <TextInput 
              style={styles.modalInput} 
              value={currentEdit.value} 
              onChangeText={(txt) => setCurrentEdit({ ...currentEdit, value: txt })} 
              autoFocus 
            />
            <View style={styles.modalActionsRow}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => updateVoterField(currentEdit.key, currentEdit.value)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Ticket Modal */}
      <Modal visible={ticketModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
            <View style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.ticketHeaderTitle}>{voter.name}</Text>
                  <Text style={styles.ticketSubHeader}>{t('voter_slip')}</Text>
                </View>
              </View>
              <View style={styles.ticketBody}>
                <Text style={styles.tLabel}>EPIC NO</Text>
                <Text style={styles.tValue}>{voter.epic_id || '-'}</Text>
                <View style={styles.ticketDivider} />
                <View style={styles.ticketRow}>
                  <View>
                    <Text style={styles.tLabel}>Sr No</Text>
                    <Text style={styles.tValue}>{voter.srNo || '-'}</Text>
                  </View>
                  <View>
                    <Text style={styles.tLabel}>Ward</Text>
                    <Text style={styles.tValue}>{voter.part || '-'}</Text>
                  </View>
                </View>
                <View style={styles.ticketDivider} />
                <Text style={styles.tLabel}>{t('address')}</Text>
                <Text style={styles.tValueSmall}>{voter.yadi_bhag}</Text>
              </View>
              <View style={styles.ticketFooter}>
                <Text style={styles.footerText}>मतदान करा, आपला हक्क बजावा!</Text>
              </View>
            </View>
          </ViewShot>
          <TouchableOpacity style={styles.shareBtnLarge} onPress={shareTicketImage}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
            <Text style={styles.btnText}>{t('share_on_whatsapp')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTicketModalVisible(false)} style={{marginTop: 20}}>
            <Text style={{color: '#fff', fontSize: 16}}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orangeHeader: { height: 100, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  backBtn: { position: 'absolute', left: 20, top: 35 },
  backIconBg: { backgroundColor: '#f0f0f0', borderRadius: 20, padding: 2 },
  headerTitle: { color: '#333', fontSize: 18, fontWeight: 'bold', width: '60%', textAlign: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', marginTop: -15, marginHorizontal: 25, borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  tabItem: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTabBorder: { borderBottomWidth: 3, borderBottomColor: '#FF6600' },
  tabText: { color: '#888', fontWeight: 'bold' },
  activeTabText: { color: '#FF6600' },
  scrollContent: { padding: 15, paddingTop: 25 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 3, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  voterHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  voterMainName: { fontSize: 20, fontWeight: 'bold', marginRight: 12, color: '#2C3E50' },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 20, marginBottom: 20 },
  gridItem: { alignItems: 'center' },
  gridLabel: { fontSize: 11, color: '#95A5A6', textTransform: 'uppercase', marginBottom: 4 },
  gridValue: { fontSize: 16, fontWeight: 'bold', color: '#34495E' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  infoLabel: { color: '#7F8C8D', fontSize: 13 },
  infoValue: { fontWeight: 'bold', fontSize: 14, color: '#2C3E50', textAlign: 'right', flex: 1, marginLeft: 10 },
  addressBox: { marginTop: 15, backgroundColor: '#FDF2E9', padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF6600' },
  addressText: { color: '#5D6D7E', fontSize: 13, lineHeight: 20 },
  actionRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
  ticketBtn: { flex: 1, backgroundColor: '#FF6600', flexDirection: 'row', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  ticketBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  shareBtnInfo: { backgroundColor: '#3498db', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  surveyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  surveyLabel: { fontSize: 14, color: '#34495E', flex: 1, fontWeight: '500' },
  surveyAction: { flex: 1.2, alignItems: 'flex-end' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  surveyValueDisplay: { color: '#7F8C8D', fontSize: 13, maxWidth: 100 },
  colorIndicator: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#eee' },
  radioGroup: { flexDirection: 'row', gap: 15 },
  radio: { flexDirection: 'row', alignItems: 'center' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#FF6600', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  radioInnerActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6600' },
  radioText: { fontSize: 14, color: '#2C3E50' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  savingLoader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 8 },
  savingText: { color: '#FF6600', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  editCard: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', elevation: 10 },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 20, color: '#2C3E50' },
  modalInput: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#D5DBDB', borderRadius: 12, padding: 15, marginBottom: 25, fontSize: 16 },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 25, alignItems: 'center' },
  cancelText: { color: '#95A5A6', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#FF6600', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 10 },
  colorOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  colorLabel: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeModalBtn: { alignItems: 'center', marginTop: 15, padding: 10 },
  closeModalText: { color: '#FF6600', fontWeight: 'bold' },
  ticketCard: { width: width * 0.85, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  ticketHeader: { backgroundColor: '#FF6600', padding: 25 },
  ticketHeaderTitle: { color: '#fff', fontWeight: 'bold', fontSize: 20, marginBottom: 5 },
  ticketSubHeader: { color: '#ffd4b3', fontSize: 13, fontWeight: '600' },
  ticketBody: { padding: 25 },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 15 },
  tLabel: { color: '#BDC3C7', fontSize: 11, textTransform: 'uppercase', marginBottom: 5 },
  tValue: { color: '#2C3E50', fontWeight: 'bold', fontSize: 17 },
  tValueSmall: { color: '#34495E', fontSize: 14, lineHeight: 22 },
  ticketFooter: { backgroundColor: '#F8F9FA', padding: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  footerText: { color: '#FF6600', fontWeight: 'bold', fontSize: 13 },
  shareBtnLarge: { backgroundColor: '#25D366', flexDirection: 'row', paddingHorizontal: 35, paddingVertical: 18, borderRadius: 35, marginTop: 25, alignItems: 'center', gap: 12, elevation: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});