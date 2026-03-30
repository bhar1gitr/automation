import * as SecureStore from 'expo-secure-store';
import API from './api'; // Ensure this path points to your api.js file created above

export const loginUser = async (voterId, password) => {
  try {
    // We use API.post instead of fetch. 
    // This automatically prepends the BASE_URL (http://192.168.1.10:3000/api)
    const response = await API.post('/login', { voterId, password });
console.log(response);
    // Axios returns the data directly in response.data
    const { token, user } = response.data;

    // Store the token securely
    if (token) {
        await SecureStore.setItemAsync('userToken', token);
    }
    
    // Store user info if it exists
    if (user) {
        await SecureStore.setItemAsync('userData', JSON.stringify(user));
    }

    return response.data;

  } catch (error) {
    // Handle Axios errors safely
    const errorMessage = error.response?.data?.message || 'Login failed. Please checks your connection.';
    console.error("Login Error:", errorMessage);
    throw new Error(errorMessage);
  }
};