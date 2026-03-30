
// import axios from 'axios';

// export const BASE_URL = 'http://192.168.1.14:3000/api'; 
// // export const BASE_URL = 'https://purna-server.onrender.com/api';
// // const BASE_URL = 'https://purna-full.onrender.com/api'; 

// const API = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export default API; 

// Client/services/api.ts







// import axios from 'axios';

// // This pulls directly from the .env file
// export const BASE_URL = process.env.EXPO_PUBLIC_API_URL;


// const API = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export default API;








import axios from 'axios';
import { Alert } from 'react-native'; // Import Alert for mobile

// 1. Get the URL from environment
const rawUrl = process.env.EXPO_PUBLIC_API_URL;

// 2. Append the /api suffix
export const BASE_URL = `${rawUrl}/api`;

// 🚀 ALERT FOR DEBUGGING:
// This will show a popup on your phone so you can see the final path
Alert.alert(
  "Network Debug",
  `Current API Path: ${BASE_URL}`,
  [{ text: "OK" }]
);

console.log("🌐 CURRENT API PATH:", BASE_URL);

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;

