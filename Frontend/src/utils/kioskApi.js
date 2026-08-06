// src/utils/kioskApi.js
import axios from "axios";

const kioskApi = axios.create({ baseURL: process.env.REACT_APP_API_BASE_URL });

kioskApi.interceptors.request.use(config => {
  // Get token from sessionStorage (set on activation)
  const token = sessionStorage.getItem("kioskDeviceToken") || (() => {
    try { return JSON.parse(localStorage.getItem("ehsKioskDeviceSession"))?.token; }
    catch { return null; }
  })();

  if (token) config.headers["x-kiosk-token"] = token;
  return config;
});

// Intercept 401s — kiosk session expired mid-day
kioskApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("ehsKioskDeviceSession");
      sessionStorage.removeItem("kioskDeviceToken");
      window.location.href = "/NEIN-LND/kiosk/start"; // reactivation needed
    }
    return Promise.reject(err);
  }
);

export default kioskApi;