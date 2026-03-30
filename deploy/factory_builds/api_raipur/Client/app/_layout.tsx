// import React, { createContext, useState, useEffect, useContext } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [token, setToken] = useState(null);
//   const [role, setRole] = useState(null); // Add Role state
//   const [isLoading, setIsLoading] = useState(true);

//   // 1. CHECK LOGIN ON APP START
//   useEffect(() => {
//     const loadStorageData = async () => {
//       try {
//         const storedToken = await AsyncStorage.getItem('userToken');
//         const storedRole = await AsyncStorage.getItem('userRole');
        
//         if (storedToken) {
//           setToken(storedToken);
//           setRole(storedRole);
//         }
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     loadStorageData();
//   }, []);

//   // 2. LOGIN FUNCTION (Updates State + Saves to Storage)
//   const login = async (newToken, newRole) => {
//     setIsLoading(true);
//     setToken(newToken);
//     setRole(newRole);
//     try {
//       alert('Yes');
//       await AsyncStorage.setItem('userToken', newToken);
//       await AsyncStorage.setItem('userRole', newRole);
//     } catch (e) {
//       console.error(e);
//     }
//     setIsLoading(false);
//   };

//   // 3. LOGOUT FUNCTION
//   const logout = async () => {
//     setIsLoading(true);
//     setToken(null);
//     setRole(null);
//     try {
//       await AsyncStorage.removeItem('userToken');
//       await AsyncStorage.removeItem('userRole');
//     } catch (e) {
//       console.error(e);
//     }
//     setIsLoading(false);
//   };

//   return (
//     <AuthContext.Provider value={{ token, role, isLoading, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider } from "../services/AuthContext"; // <--- Import your new Context file

export default function RootLayout() {
  return (
    // 👇 WRAP EVERYTHING HERE 👇
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack>
    </AuthProvider>
    // 👆 END WRAPPER 👆
  );
}