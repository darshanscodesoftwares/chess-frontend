// src/api/axiosClient.js
import axios from "axios";

// Use environment variable for API base URL
// In production: VITE_API_BASE_URL should be set to your backend URL (e.g., https://backend.onrender.com/api)
// In development: defaults to localhost
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

// Log the API base URL on startup (helpful for debugging)
if (import.meta.env.DEV) {
  console.log("📡 API Base URL:", axiosClient.defaults.baseURL);
}

export default axiosClient;
