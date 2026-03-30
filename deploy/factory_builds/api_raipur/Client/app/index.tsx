import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';

// 1. IMPORT YOUR API INSTANCE
import API from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // const handleLogin = async () => {
  //   // 1. Validation
  //   if (!email || !password) {
  //     Alert.alert("Hold on", "Please enter both email and password.");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     // 2. Network Request
  //     console.log("🚀 Sending request to /auth/login...");
  //     const response = await API.post('/auth/login', {
  //       email: email.trim(),
  //       password: password
  //     });

  //     console.log("📦 Full Response:", JSON.stringify(response.data, null, 2));

  //     // 3. Safe Data Extraction
  //     const data = response.data;
  //     const token = data.token || data.data?.token; 
  //     const user = data.user || data.data?.user;

  //     if (!token || !user) {
  //       Alert.alert("Error", "Login successful but missing Token or User data.");
  //       setLoading(false);
  //       return;
  //     }

  //     const userRole = user.role;
  //     // 👇 NEW: Extract ID (supports both 'id' and '_id')
  //     const userId = user.id || user._id;

  //     if (!userRole) {
  //       Alert.alert("Error", "User found, but 'role' is missing.");
  //       setLoading(false);
  //       return;
  //     }

  //     // 4. Call Login with 3 Arguments
  //     console.log(`✅ Calling login with: Token=${token.substring(0,5)}... Role=${userRole} ID=${userId}`);
      
  //     // 👇 PASS USER ID HERE
  //     await login(token, userRole, userId);

  //     // 5. Redirect
  //     if (userRole === 'admin') {
  //       router.replace('/(tabs)/home');
  //     } else {
  //       router.replace('/(tabs)/voter-home');
  //     }

  //   } catch (error: any) {
  //     console.error("❌ Login Error:", error);
  //     const serverMsg = error.response?.data?.message;
  //     const serverError = error.response?.data?.error;
      
  //     Alert.alert(
  //       "Login Failed", 
  //       serverMsg || serverError || error.message || "Unknown error occurred"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  
  const handleLogin = async () => {
    // 1. Validation
    if (!email || !password) {
      Alert.alert("Hold on", "Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      // 2. Network Request
      console.log("🚀 Sending request to /auth/login...");
      const response = await API.post('/auth/login', {
        email: email.trim(),
        password: password
      });

      console.log("📦 Full Response:", JSON.stringify(response.data, null, 2));

      // 3. Safe Data Extraction
      const data = response.data;
      
      // Check if data is nested or direct
      const token = data.token || data.data?.token; 
      const user = data.user || data.data?.user;

      if (!token || !user) {
        Alert.alert("Error", "Login successful but missing Token or User data.");
        setLoading(false);
        return;
      }

      // 4. Extract User Details
      const userRole = user.role;
      const userId = user.id || user._id; // Handle both 'id' and '_id'
      
      // Get the Name (Fallback to 'User' if missing)
      // Check your database field name: usually 'name', 'fullName', or 'username'
      const userName = user.name || user.fullName || user.username || "User"; 

      if (!userRole) {
        Alert.alert("Error", "User found, but 'role' is missing.");
        setLoading(false);
        return;
      }

      // 5. Call Login Context with ALL 4 Arguments
      console.log(`✅ Logging in: Role=${userRole}, ID=${userId}, Name=${userName}`);
      
      // Arguments: (token, role, userId, userName)
      await login(token, userRole, userId, userName);

      // 6. Redirect based on Role
      // if (userRole === 'admin') {
      //   router.replace('/(tabs)/home');
      // } else {
      //   router.replace('/(tabs)/voter-home');
      // }

      if (userRole === 'admin') {
        router.replace('/(tabs)/home'); // Send Super Admin to the Admin Dashboard
      } else if(userRole === 'superadmin'){
        router.replace('/admin-dashboard');
      }else {
        router.replace('/(tabs)/voter-home');
      }

    } catch (error: any) {
      console.error("❌ Login Error:", error);
      
      const serverMsg = error.response?.data?.message;
      const serverError = error.response?.data?.error;
      
      Alert.alert(
        "Login Failed", 
        serverMsg || serverError || "Connection error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>LK</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              placeholder="name@example.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              style={[
                styles.input,
                focusedInput === 'email' && styles.inputFocused
              ]}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[
                styles.input,
                focusedInput === 'password' && styles.inputFocused
              ]}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            style={styles.signInButton}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    height: 80,
    width: 80,
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FF6600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    color: '#666',
    marginTop: 8,
    fontSize: 16,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 14,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    color: '#333',
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#FF6600',
    borderWidth: 1.5,
  },
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  forgotPasswordText: {
    color: '#FF6600',
    fontWeight: '600',
    fontSize: 14,
  },
  signInButton: {
    width: '100%',
    backgroundColor: '#FF6600',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#666',
  },
  signUpText: {
    color: '#FF6600',
    fontWeight: 'bold',
  },
});