import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = "https://store-saathi-api.vercel.app/api";
// Backend: http://store-saarthi-backend.ap-south-1.elasticbeanstalk.com/api
console.log("🔥 RUNTIME API URL:", API_URL);
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // Silently fail — request proceeds without token
  }
  return config;
});

