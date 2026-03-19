import axios from "axios";

// Keep API requests relative so Vite can proxy /api to Laravel in development.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default api;
