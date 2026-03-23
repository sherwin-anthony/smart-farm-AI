import axios from "axios";
import { api } from "../../api/client";
import type { AuthUser, LoginPayload, RegisterPayload, UpdateUserPayload } from "./types";

const csrf = axios.create({
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Purpose: auth API calls for login/register/current user/logout.
export const getCsrfCookie = async (): Promise<void> => {
  await csrf.get("/sanctum/csrf-cookie");
};

export const registerUser = async (payload: RegisterPayload) => {
  await getCsrfCookie();
  const response = await api.post<{ message: string; user: AuthUser }>("/register", payload);
  return response.data;
};

export const loginUser = async (payload: LoginPayload) => {
  await getCsrfCookie();
  const response = await api.post<{ message: string; user: AuthUser }>("/login", payload);
  return response.data;
};

export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const response = await api.get<AuthUser>("/user");
  return response.data;
};

export const updateCurrentUser = async (payload: UpdateUserPayload): Promise<AuthUser> => {
  await getCsrfCookie();
  const response = await api.put<{ message: string; user: AuthUser }>("/user", payload);
  return response.data.user;
};

export const logoutUser = async (): Promise<void> => {
  await getCsrfCookie();
  await api.post("/logout");
};



 /**  
  * import { api } from "../../api/client";
import type { AuthUser, LoginPayload, RegisterPayload } from "./types";

// Purpose: auth API calls for login/register/current user/logout.

export const getCsrfCookie = async (): Promise<void> => {
  await api.get("/sanctum/csrf-cookie", {
    baseURL: "http://127.0.0.1:5173",
  });
};

export const registerUser = async (payload: RegisterPayload) => {
  await getCsrfCookie();
  const response = await api.post<{ message: string; user: AuthUser }>("/register", payload);
  return response.data;
};

export const loginUser = async (payload: LoginPayload) => {
  await getCsrfCookie();
  const response = await api.post<{ message: string; user: AuthUser }>("/login", payload);
  return response.data;
};

export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const response = await api.get<AuthUser>("/user");
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post("/logout");
};

   */
