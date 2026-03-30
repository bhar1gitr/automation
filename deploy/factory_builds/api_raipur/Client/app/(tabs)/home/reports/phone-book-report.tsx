import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const DATA = [
  // {
  //   id: '1',
  //   name: 'रतनलाल सोमा पवार',
  //   age: 62,
  //   anukram: '21174',
  //   prabhag: 'प्रभाग-7',
  //   booth: '146/445/32',
  //   epic: 'XCE4179230',
  //   mobile: '98XXXXXX55',
  //   gender: 'पुरुष',
  // },
  // {
  //   id: '2',
  //   name: 'सुभाष इंदर बाविस्कर',
  //   age: 52,
  //   anukram: '32634',
  //   prabhag: 'प्रभाग-7',
  //   booth: '146/457/615',
  //   epic: 'XCE2768794',
  //   mobile: '81XXXXXX70',
  //   gender: 'पुरुष',
  // },
  // {
  //   id: '3',
  //   name: 'मीनाक्षी जितेश पाटील',
  //   age: 29,
  //   anukram: '33258',
  //   prabhag: 'प्रभाग-7',
  //   booth: '146/457/1257',
  //   epic: 'XCE5178439',
  //   mobile: '97XXXXXX46',
  //   gender: 'स्त्री',
  // },
];

export default function PhonebookReport() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔶 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6600" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>फोनबुक रिपोर्ट</Text>
      </View>

      {/* 🔶 Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="शोधा"
            value={search}
            onChangeText={setSearch}
            style={styles.input}
          />
          <MaterialCommunityIcons name="magnify" size={22} color="#FF6600" />
        </View>

        <View style={styles.sortBox}>
          <Text style={styles.sortText}>A-Z</Text>
          <MaterialCommunityIcons name="arrow-up-down" size={16} color="#FF6600" />
        </View>
      </View>

      {/* 🔶 List */}
      <FlatList
        data={DATA}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.name}>
                  {item.name} ({item.age})
                </Text>
                <Text style={styles.orangeText}>
                  अनुक्रम-{item.anukram}   {item.prabhag}
                </Text>
              </View>

              <MaterialCommunityIcons name="dots-vertical" size={20} color="#999" />
            </View>

            <Text style={styles.detail}>डेस्क - {item.booth}</Text>
            <Text style={styles.detail}>आय डी - {item.epic}</Text>
            <Text style={styles.detail}>
              {item.mobile} ({item.gender})
            </Text>

            <View style={styles.expandIcon}>
              <MaterialCommunityIcons name="chevron-down" size={22} color="#666" />
            </View>
          </View>
        )}
      />

      {/* 🔶 Floating Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.pdfFab}>
          <MaterialCommunityIcons name="file-pdf-box" size={22} color="#fff" />
          <Text style={styles.fabText}>PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.xlsFab}>
          <MaterialCommunityIcons name="file-excel-box" size={22} color="#fff" />
          <Text style={styles.fabText}>XLS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  /* Search */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 15,
    borderRadius: 25,
    height: 42,
  },
  input: { flex: 1, fontSize: 14 },
  sortBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  sortText: {
    color: '#FF6600',
    fontWeight: '600',
    marginRight: 4,
  },

  /* Card */
  card: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  orangeText: {
    color: '#FF6600',
    fontWeight: '600',
    marginTop: 2,
    fontSize: 13,
  },
  detail: {
    color: '#555',
    fontSize: 13,
    marginTop: 2,
  },
  expandIcon: {
    alignItems: 'center',
    marginTop: 6,
  },

  /* Floating buttons */
  fabContainer: {
    position: 'absolute',
    right: 15,
    bottom: 90,
  },
  pdfFab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  xlsFab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fabText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 12,
  },
});