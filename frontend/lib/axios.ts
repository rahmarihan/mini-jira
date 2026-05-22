// frontend/src/lib/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "/api" : "http://localhost:3001"),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("mini-jira.idToken")
      : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("mini-jira.accessToken");
      localStorage.removeItem("mini-jira.idToken");
      localStorage.removeItem("mini-jira.refreshToken");
      localStorage.removeItem("mini-jira.user");
      localStorage.removeItem("token");
      document.cookie = "token=; Max-Age=0; path=/";
      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
