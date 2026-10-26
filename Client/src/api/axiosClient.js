import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4100/api",
  headers: { "Content-Type": "application/json" },
});

// Reads the token straight from localStorage (written by useAuthStore's
// persist middleware) rather than importing the store, to avoid a
// store <-> client circular import.
axiosClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem("afc_token");
  if (raw) {
    try {
      config.headers.Authorization = `Bearer ${raw}`;
    } catch {
      // ignore malformed storage
    }
  }
  return config;
});

// Normalize errors once here so stores don't repeat try/catch parsing.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong. Please try again.";
    return Promise.reject({ ...error, message });
  }
);

export default axiosClient;