

import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL+"/api",
  withCredentials: true, 
});

// Flag to prevent multiple simultaneous refresh calls
let isRefreshing = false;
// Queue of requests that came in while refresh was in progress
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(),
  );
  failedQueue = [];
};

api.interceptors.response.use(
  // Success — just pass the response through
  (response) => response,

  // Error — check if it's an expired token we can silently recover from
  async (error) => {
    const original = error.config;

    const isExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !original._retry; // prevent infinite retry loop

    if (!isExpired) {
      return Promise.reject(error);
    }

    // Mark so we don't retry this request again
    original._retry = true;

    if (isRefreshing) {
      // Another request is already refreshing — queue this one
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(original));
    }

    isRefreshing = true;

    try {
      // Ask the server for a new accessToken using our refreshToken cookie
      await api.post("/auth/refresh");
      processQueue(null); // unblock queued requests
      return api(original); // retry the original request
    } catch (refreshError) {
      processQueue(refreshError);
      // Refresh failed — force re-login
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
