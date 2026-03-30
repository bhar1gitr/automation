import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';

// 1. Import API and Context
import API from '../../services/api'; 
import { useAuth } from '../../services/AuthContext'; 

export default function Uploads() {
  const router = useRouter();
  
  // 2. Get the User ID from context
  const { userId } = useAuth(); 

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      setSelectedFile(result.assets[0]);
      
    } catch (err) {
      console.log('Unknown Error: ', err);
      Alert.alert('Error', 'Failed to pick a file.');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Safety Check
    if (!userId) {
      Alert.alert("Session Error", "User ID not found. Please log out and log in again.");
      return;
    }

    setUploading(true);

    try {
      console.log("📤 Starting upload...");

      // 3. Create Form Data
      const formData = new FormData();

      // A. Append the File
      // @ts-ignore: React Native FormData needs this specific shape
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/pdf', 
      });

      // B. Append User ID (Required for your MVC backend)
      formData.append('userId', userId);

      // 4. Send to Backend
      // Note: Do NOT manually set 'Content-Type': 'multipart/form-data' here. 
      // Axios/Fetch usually handles the boundary automatically when it sees FormData.
      // If your API instance forces JSON, you might need to override headers.
      const response = await API.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data, headers) => {
           return formData; // Prevents axios from stringifying the form data
        },
      });

      console.log("✅ Upload Success:", response.data);
      Alert.alert("Success", "File uploaded successfully!");
      setSelectedFile(null); 
      
      // Optional: Redirect
      // router.replace('/(tabs)/voter-home'); 

    } catch (error: any) {
     // 1. Log the basic error
      console.error("❌ RAW ERROR:", error);

      if (error.response) {
        // The server responded with a status code other than 2xx
        console.error("⚠️ Server Status:", error.response.status);
        console.error("⚠️ Server Data:", JSON.stringify(error.response.data, null, 2));
        console.error("⚠️ Server Headers:", JSON.stringify(error.response.headers, null, 2));
        
        Alert.alert("Server Error", 
          `Status: ${error.response.status}\nMessage: ${error.response.data?.message || "Unknown error"}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error("⚠️ No Response Received. Check your network/IP address.");
        Alert.alert("Network Error", "Server is not reachable. Are you using the correct IP address?");
      } else {
        // Something happened in setting up the request
        console.error("⚠️ Request Setup Error:", error.message);
        Alert.alert("App Error", error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Voter List</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Select a PDF file to upload and share with the Admin.
        </Text>

        {!selectedFile ? (
          <TouchableOpacity 
            style={styles.uploadBox} 
            onPress={pickDocument}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={40} color="#FF6600" />
            </View>
            <Text style={styles.uploadText}>Tap to Select PDF</Text>
            <Text style={styles.subText}>Supports .pdf files only</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileCard}>
            <View style={styles.fileIcon}>
              <MaterialCommunityIcons name="file-pdf-box" size={36} color="#E53935" />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>
                {(selectedFile.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0')} MB
              </Text>
            </View>
            <TouchableOpacity onPress={removeFile} style={styles.removeButton}>
              <MaterialCommunityIcons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, (!selectedFile || uploading) && styles.buttonDisabled]} 
            onPress={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Upload & Share</Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, padding: 24 },
  instructions: { textAlign: 'center', color: '#666', marginBottom: 30, fontSize: 15 },
  uploadBox: { borderWidth: 2, borderColor: '#FFCCBC', borderStyle: 'dashed', borderRadius: 20, backgroundColor: '#FFF', height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  uploadText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 6 },
  subText: { fontSize: 13, color: '#999' },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  fileIcon: { marginRight: 16 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  fileSize: { fontSize: 13, color: '#888' },
  removeButton: { padding: 8 },
  footer: { marginTop: 'auto' },
  button: { backgroundColor: '#FF6600', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#FF6600', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { backgroundColor: '#FFCCBC', shadowOpacity: 0, elevation: 0 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});