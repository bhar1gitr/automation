import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  StyleSheet,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useRouter, Link } from 'expo-router'; 

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { signUp } = useAuth(); 
  const router = useRouter(); 
  
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
        await signUp(email, password, name);
    } catch (error) {
        console.error(error);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.contentContainer}>
          
          {/* Header - Made more compact */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>LK</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start voting today</Text>
          </View>

          {/* Form - Reduced gaps */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                placeholder="John Doe"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                placeholder="name@example.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Create a password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={[styles.input, focusedInput === 'confirmPassword' && styles.inputFocused]}
                onFocus={() => setFocusedInput('confirmPassword')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <TouchableOpacity 
              onPress={handleSignUp}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer - Reduced margin */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  keyboardView: { 
    flex: 1 
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center', // Centers everything vertically
    paddingHorizontal: 24,
  },
  headerContainer: { 
    alignItems: 'center', 
    marginBottom: 20 // Reduced from 32
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
    fontSize: 30 // Reduced from 30
  },
  title: { 
    fontSize: 24, // Reduced from 28
    fontWeight: 'bold', 
    color: '#333' 
  },
  subtitle: { 
    color: '#666', 
    marginTop: 4, 
    fontSize: 14 
  },
  formContainer: { 
    gap: 12 // Reduced from 16 to bring inputs closer
  },
  inputGroup: { 
    marginBottom: 0 // Rely on gap for spacing
  },
  label: { 
    color: '#333', 
    fontWeight: '500', 
    marginBottom: 6, 
    marginLeft: 4, 
    fontSize: 14 
  },
  input: { 
    width: '100%', 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#eee', 
    borderRadius: 12, 
    padding: 12, // Reduced padding from 16
    color: '#333', 
    fontSize: 16 
  },
  inputFocused: { 
    borderColor: '#FF6600', 
    borderWidth: 1.5 
  },
  actionButton: { 
    width: '100%', 
    backgroundColor: '#FF6600', 
    padding: 14, // Slightly reduced
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 8, 
    shadowColor: '#FF6600', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 3 
  },
  actionButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 24, // Reduced from 40
  },
  footerText: { 
    color: '#666' 
  },
  linkText: { 
    color: '#FF6600', 
    fontWeight: 'bold' 
  },
});