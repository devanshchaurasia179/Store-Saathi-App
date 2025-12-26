import axios from "axios";

/**
 * ⚠️ IMPORTANT
 * Use the SAME IP that worked in Expo + mobile browser
 */
export const API_URL = "http://172.24.190.193:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});
