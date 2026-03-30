import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../services/AuthContext';
import { useTranslation } from 'react-i18next'; // Import the hook
import '../i18n'; // Ensure i18n is initialized

export default function TabLayout() {
  const { role, isLoading } = useAuth();
  const { t } = useTranslation(); // Initialize translation hook

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  // Define Roles
  const isSuperAdmin = role === 'superadmin'; 
  const isAdmin = role === 'admin';
  // Voter is anyone who is NOT an admin AND NOT a super admin
  const isVoter = !isAdmin && !isSuperAdmin;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: { height: 70, paddingBottom: 10 },
      }}
    >
      {/* 1. ADMIN HOME (Admin Only) */}
      <Tabs.Screen
        name="home"
        options={{
          title: t('tab_home'),
          href: isAdmin ? '/home' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-outline" size={24} color={color} />,
        }}
      />

      {/* 2. VOTER HOME (Voter Only) */}
      <Tabs.Screen
        name="voter-home"
        options={{
          title: t('tab_home'),
          href: isVoter ? '/voter-home' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-outline" size={24} color={color} />,
        }}
      />

      {/* 3. SEARCH (Admin Only) */}
      <Tabs.Screen
        name="search"
        options={{
          title: t('tab_search'),
          href: isAdmin ? '/search' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-search-outline" size={24} color={color} />,
        }}
      />

       {/* 8. ADMIN DASHBOARD (Super Admin Only) */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: t('tab_dashboard'), 
          href: isSuperAdmin ? '/admin-dashboard' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={color} />,
        }}
      />

      {/* 4. SETTINGS (Everyone) */}
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tab_settings'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog-outline" size={24} color={color} />,
        }}
      />

      {/* 5. UPLOAD (Voter Only) */}
      <Tabs.Screen
        name="uploads"
        options={{
          title: t('tab_upload'),
          href: isVoter ? '/uploads' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cloud-upload-outline" size={24} color={color} />,
        }}
      />

      {/* 6. REPORTS (Admin Only) */}
      <Tabs.Screen
        name="reports"
        options={{
          title: t('tab_reports'),
          href: isAdmin ? '/reports' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-chart-outline" size={24} color={color} />,
        }}
      />

      {/* 7. SYNC (Admin Only) */}
      <Tabs.Screen
        name="sync"
        options={{
          title: t('tab_sync'),
          href: isAdmin ? '/sync' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="sync" size={24} color={color} />,
        }}
      />

      {/* HIDDEN SCREENS */}
      <Tabs.Screen
        name='voting'
        options={{ href: null }}
      />
    </Tabs>
  );
}