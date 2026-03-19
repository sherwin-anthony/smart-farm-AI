import axios from "axios";

// Central HTTP client for all frontend feature modules.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
