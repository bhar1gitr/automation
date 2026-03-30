import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ReportsHome() {
  const router = useRouter();
  const { t } = useTranslation();

  const getCurrentDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const REPORTS = [
    { 
      id: '1', 
      title: t('report_surname'), 
      icon: 'clipboard-text-outline', 
      route: '/home/reports/full-name-report',
    },
    { 
      id: '3', 
      title: t('report_color'), 
      icon: 'format-list-checks', 
      route: '/reports',
    },
    { 
      id: '4', 
      title: t('report_booth'), 
      icon: 'briefcase-outline', 
      route: '/home/reports/booth-wise-report',
    },
    { 
      id: '6', 
      title: t('report_community'), 
      icon: 'map-marker-outline', 
      route: '/home/reports/community-wise-report',
    },
    { 
      id: '7', 
      title: t('report_age'), 
      icon: 'account-group-outline', 
      route: '/home/reports/age-group-report',
    },
    { 
      id: '8', 
      title: t('report_mobile'), 
      icon: 'cellphone', 
      route: '/home/reports/mobile-number-wise-report',
    },
    { 
      id: '9', 
      title: t('report_dob'), 
      icon: 'cake-variant-outline', 
      route: '/home/reports/dob-report',
    },
    { 
      id: '10', 
      title: t('report_gender'), 
      icon: 'gender-male-female', 
      route: '/home/reports/gender-report',
    },
    { 
      id: '11', 
      title: t('report_scheme'), 
      icon: 'file-document-outline', 
      route: '/home/reports/beneficiary-scheme-report',
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={require('../../../../assets/images/banner.jpg')}
          style={styles.banner}
        />

        <View style={styles.orangeHeader}>
          <Text style={styles.orangeHeaderText}>{t('reports_header')}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            {t('version')} : <Text style={styles.highlight}>3.9</Text>
          </Text>
          <Text style={styles.infoText}>
            {t('release_date')} : <Text style={styles.highlight}>{getCurrentDate()}</Text>
          </Text>
        </View>

        <View style={styles.listContainer}>
          {REPORTS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              onPress={() => router.push(item.route as any)}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={22}
                color="#FF6600"
                style={styles.icon}
              />
              <Text style={styles.listText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  banner: {
    width: '100%',
    height: 170,
    resizeMode: 'cover',
  },
  orangeHeader: {
    backgroundColor: '#FF6600',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  orangeHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  highlight: {
    color: '#FF6600',
    fontWeight: 'bold',
  },
  listContainer: {
    backgroundColor: '#F2F2F2',
    paddingBottom: 150, 
    paddingTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF', 
  },
  icon: {
    marginRight: 16,
  },
  listText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});