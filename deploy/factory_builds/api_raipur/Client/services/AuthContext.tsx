// import React, { createContext, useContext, useState, useEffect } from 'react';
// import * as SecureStore from 'expo-secure-store';
// import { Alert } from 'react-native';

// export type UserRole = 'admin' | 'user' | null;

// const AuthContext = createContext<{
//   isLoggedIn: boolean | null;
//   role: UserRole;
//   userId: string | null;
//   userName: string | null; // <--- 1. NEW PROPERTY
//   isLoading: boolean;
//   // 2. UPDATED LOGIN SIGNATURE: Added userName
//   login: (token: string, role: string, userId: string, userName: string) => Promise<void>; 
//   logout: () => Promise<void>;
// }>({ 
//   isLoggedIn: null, 
//   role: null, 
//   userId: null, 
//   userName: null, // <--- DEFAULT VALUE
//   isLoading: true,
//   login: async () => {}, 
//   logout: async () => {} 
// });

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// 👇 1. UPDATE THIS LINE
export type UserRole = 'admin' | 'user' | 'superadmin' | null;

const AuthContext = createContext<{
  isLoggedIn: boolean | null;
  role: UserRole;
  userId: string | null;
  userName: string | null;
  isLoading: boolean;
  login: (token: string, role: string, userId: string, userName: string) => Promise<void>;
  logout: () => Promise<void>;
}>({
  // ... (keep default values the same)
  isLoggedIn: null,
  role: null,
  userId: null,
  userName: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null); // <--- 3. NEW STATE
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const storedRole = await SecureStore.getItemAsync('userRole');
        const storedUserId = await SecureStore.getItemAsync('userId');
        const storedUserName = await SecureStore.getItemAsync('userName'); // <--- 4. LOAD NAME

        if (token && storedRole) {
          setIsLoggedIn(true);
          setRole(storedRole as UserRole);
          setUserId(storedUserId);
          setUserName(storedUserName); // <--- SET NAME
        } else {
          setIsLoggedIn(false);
          setRole(null);
          setUserId(null);
          setUserName(null);
        }
      } catch (e) {
        console.error("❌ [Auth] Error loading session:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  // 5. UPDATE LOGIN FUNCTION
  const login = async (token: string, newRole: string, newUserId: string, newUserName: string) => {
    
    if (!newRole) {
       newRole = 'user';
    }

    const safeRole = newRole.toString().toLowerCase() as UserRole;

    try {
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userRole', safeRole);
      
      if (newUserId) {
        await SecureStore.setItemAsync('userId', newUserId);
      }

      // <--- 6. SAVE NAME
      if (newUserName) {
        await SecureStore.setItemAsync('userName', newUserName);
      }

      setRole(safeRole);
      setUserId(newUserId);
      setUserName(newUserName); // <--- UPDATE STATE
      setIsLoggedIn(true);

    } catch (error) {
      Alert.alert("Auth Error", "Failed to save session.");
      console.error(error);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userRole');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('userName'); // <--- 7. DELETE NAME
    
    setRole(null);
    setUserId(null);
    setUserName(null); // <--- RESET STATE
    setIsLoggedIn(false);
  };

  return (
    // <--- 8. PASS userName TO VALUE
    <AuthContext.Provider value={{ isLoggedIn, role, userId, userName, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);