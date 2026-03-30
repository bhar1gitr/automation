// app/pdf-viewer.tsx
import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, Stack } from 'expo-router';

export default function PdfViewer() {
  const { url } = useLocalSearchParams();
  const pdfUrl = url as string;

  // Android requires Google Docs Viewer workaround for remote PDFs
  // iOS renders PDFs natively in WebView
  const viewerUrl = Platform.OS === 'android' 
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`
    : pdfUrl;

  if (!pdfUrl) {
    return (
      <View style={styles.center}>
        <Text>No file URL provided</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Document Viewer', headerBackTitle: 'Back' }} />
      
      {/* ANDROID LOCALHOST WARNING:
        If you are testing on Android with 'http://192.168...', Google Docs Viewer 
        cannot reach your computer. This screen will likely be blank on Android 
        until you deploy your server to the internet (or use ngrok).
        iOS works fine locally.
      */}
      
      <WebView 
        source={{ uri: viewerUrl }}
        style={{ flex: 1 }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#FF6600" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loading: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});