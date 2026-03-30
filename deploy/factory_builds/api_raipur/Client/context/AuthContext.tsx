import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
// Import your existing API service
import { api } from '../services/api'; 

type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in when app opens
    const loadToken = async () => {
      const storedToken = await SecureStore.getItemAsync('userToken');
      if (storedToken) {
        setToken(storedToken);
      }
      setIsLoading(false);
    };
    loadToken();
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      // 1. Call your backend API here
      // const response = await api.post('/login', { email, pass });
      // const { token } = response.data;
      
      // MOCK LOGIC FOR DEMO (Replace with actual backend call above)
      const mockToken = "abcdefg-123456"; 
      
      // 2. Save token to device storage
      await SecureStore.setItemAsync('userToken', mockToken);
      setToken(mockToken);
      
      // 3. Navigate to inside the app
      router.replace('/(tabs)/home'); 
    } catch (error) {
      alert("Login Failed: " + error.message);
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('userToken');
    setToken(null);
    router.replace('/sign-in');
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};