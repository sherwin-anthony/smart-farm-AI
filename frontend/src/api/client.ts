import axios from "axios";



// Central HTTP client for all frontend feature modules.
// Purpose: shared HTTP client for all frontend feature modules.
// Routing: sends requests like /farms to Laravel's /api/farms through the base URL.

export const api = axios.create({

  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",

  headers: {

    Accept: "application/json",

    "Content-Type": "application/json",

  },

});

