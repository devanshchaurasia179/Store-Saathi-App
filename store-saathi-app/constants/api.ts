import axios from "axios";

export const API_URL =
  "http://store-saathi-prod.eba-emjfwtyh.ap-south-1.elasticbeanstalk.com/api";
  console.log("🔥 RUNTIME API URL:", API_URL);
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true, // 🔥 THIS IS THE KEY
});

