// frontend/src/lib/axios.ts
import axios from "axios";

function getApiBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  if (typeof window === "undefined") {
    return configuredUrl;
  }

  const configured = new URL(configuredUrl);
  const pageHostname = window.location.hostname;
  const shouldUsePageHost =
    configured.hostname === "localhost" &&
    pageHostname !== "localhost" &&
    pageHostname !== "127.0.0.1";

  if (shouldUsePageHost) {
    configured.hostname = pageHostname;
  }

  return configured.toString();
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  // This MVP sends the Cognito ID token to the backend because it contains
  // custom:role and custom:teamId. CognitoAuthGuard verifies tokenUse: "id".
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
