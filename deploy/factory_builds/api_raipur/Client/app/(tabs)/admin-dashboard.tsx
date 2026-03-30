import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import API from '../../services/api'; // Ensure this points to your axios instance

// Define User Type
type User = {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // --- MODAL STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // --- FORM STATE ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  // 1. Fetch Users on Load
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/users');
      setUsers(response.data.data || response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      Alert.alert("Error", "Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Open Add Modal
  const handleAddPress = () => {
    setIsEditing(false);
    setCurrentUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setModalVisible(true);
  };

  // 3. Open Edit Modal
  const handleEditPress = (user: User) => {
    setIsEditing(true);
    setCurrentUserId(user._id);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Clear password field (optional for edit)
    // Only set role if it matches our types, else default user
    setRole(user.role === 'admin' ? 'admin' : 'user');
    setModalVisible(true);
  };

  // 4. Submit Logic (Add or Update)
  const handleSubmit = async () => {
    if (!name || !email) {
      Alert.alert("Error", "Name and Email are required");
      return;
    }

    // For Create: Password is required. For Edit: It's optional.
    if (!isEditing && !password) {
      Alert.alert("Error", "Password is required for new users");
      return;
    }

    const payload = { name, email, role, password };

    try {
      if (isEditing && currentUserId) {
        // UPDATE API CALL
        const res = await API.put(`/users/${currentUserId}`, payload);
        const updatedUser = res.data.data;

        // Update Local State
        setUsers(prev => prev.map(u => u._id === currentUserId ? updatedUser : u));
        Alert.alert("Success", "User updated successfully");
      } else {
        // CREATE API CALL
        const res = await API.post('/users', payload);
        const newUser = res.data.data;

        // Update Local State
        setUsers(prev => [...prev, newUser]);
        Alert.alert("Success", "User created successfully");
      }
      setModalVisible(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Operation failed";
      Alert.alert("Error", msg);
    }
  };

  // 5. Delete Logic
  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Ensure your API instance includes the Auth token in headers
              const response = await API.delete(`/users/${id}`);

              if (response.status === 200 || response.status === 204) {
                // Update local state by filtering out the deleted ID
                setUsers(prev => prev.filter(u => u._id !== id));
                Alert.alert("Success", "User removed.");
              }
            } catch (err: any) {
              const errorMsg = err.response?.data?.message || "Failed to delete user.";
              Alert.alert("Error", errorMsg);
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={[styles.badge, item.role === 'admin' ? styles.badgeAdmin : styles.badgeUser]}>
          <Text style={styles.badgeText}>{item.role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.iconBtn}>
          <MaterialCommunityIcons name="pencil" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} style={styles.iconBtn}>
          <MaterialCommunityIcons name="delete" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Add User</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        />
      )}

      {/* --- ADD / EDIT MODAL --- */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? "Edit User" : "Add New User"}</Text>

            <TextInput
              placeholder="Full Name"
              style={styles.input}
              value={name} onChangeText={setName}
            />
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
            />
            <TextInput
              placeholder={isEditing ? "Password (leave empty to keep)" : "Password"}
              style={styles.input}
              value={password} onChangeText={setPassword} secureTextEntry
            />

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text style={{ marginRight: 10, fontWeight: 'bold' }}>Role:</Text>

              {/* USER BUTTON */}
              <TouchableOpacity
                style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]}
                onPress={() => setRole('user')}
              >
                <Text style={[styles.roleText, role === 'user' && { color: '#fff' }]}>User</Text>
              </TouchableOpacity>

              {/* ADMIN BUTTON */}
              <TouchableOpacity
                style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
                onPress={() => setRole('admin')}
              >
                <Text style={[styles.roleText, role === 'admin' && { color: '#fff' }]}>Admin</Text>
              </TouchableOpacity>

              {/* SUPERADMIN BUTTON */}
              <TouchableOpacity
                style={[styles.roleBtn, role === 'superadmin' && styles.roleBtnActive]}
                onPress={() => setRole('superadmin')}
              >
                <Text style={[styles.roleText, role === 'superadmin' && { color: '#fff' }]}>Super</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                <Text style={styles.saveBtnText}>{isEditing ? "Update" : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: '#FFF', elevation: 2,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  addButton: {
    flexDirection: 'row', backgroundColor: '#FF6600', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 4 },
  card: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#666', marginBottom: 4 },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  badgeAdmin: { backgroundColor: '#E3F2FD' },
  badgeUser: { backgroundColor: '#F3F3F3' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  actions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 4 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },

  // MODAL STYLES
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20
  },
  modalContent: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 5
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16
  },
  roleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  roleBtn: {
    paddingVertical: 6, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', marginRight: 10
  },
  roleBtnActive: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
  roleText: { color: '#333' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cancelBtn: {
    flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', alignItems: 'center'
  },
  cancelBtnText: { color: '#333', fontWeight: 'bold' },
  saveBtn: {
    flex: 1, backgroundColor: '#FF6600', padding: 12, borderRadius: 8, alignItems: 'center'
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' }
});