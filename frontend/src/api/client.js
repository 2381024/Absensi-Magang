// ===== API Client =====
// Currently uses mockApi (localStorage-based).
// When backend is ready, switch USE_MOCK to false.

import { mockApi } from "./mockApi";

const USE_MOCK = true;

/* ---------- real HTTP client ---------- */
const BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function httpRequest(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

/* ---------- unified API (mock-aware) ---------- */
export const api = {
  // Auth
  login: (username, password) =>
    USE_MOCK
      ? mockApi.login(username, password)
      : httpRequest("POST", "/auth/login", { username, password }),

  // Users (admin)
  getUsers: () =>
    USE_MOCK ? mockApi.getUsers() : httpRequest("GET", "/users"),

  getUser: (id) =>
    USE_MOCK ? mockApi.getUser(id) : httpRequest("GET", `/users/${id}`),

  createUser: (data) =>
    USE_MOCK ? mockApi.createUser(data) : httpRequest("POST", "/users", data),

  updateUser: (id, data) =>
    USE_MOCK ? mockApi.updateUser(id, data) : httpRequest("PUT", `/users/${id}`, data),

  deleteUser: (id) =>
    USE_MOCK ? mockApi.deleteUser(id) : httpRequest("DELETE", `/users/${id}`),

  // Geofences (admin)
  getGeofences: () =>
    USE_MOCK ? mockApi.getGeofences() : httpRequest("GET", "/geofences"),

  getGeofence: (id) =>
    USE_MOCK ? mockApi.getGeofence(id) : httpRequest("GET", `/geofences/${id}`),

  createGeofence: (data) =>
    USE_MOCK ? mockApi.createGeofence(data) : httpRequest("POST", "/geofences", data),

  updateGeofence: (id, data) =>
    USE_MOCK ? mockApi.updateGeofence(id, data) : httpRequest("PUT", `/geofences/${id}`, data),

  deleteGeofence: (id) =>
    USE_MOCK ? mockApi.deleteGeofence(id) : httpRequest("DELETE", `/geofences/${id}`),

  getGeofenceSetting: () =>
    USE_MOCK ? mockApi.getGeofenceSetting() : httpRequest("GET", "/settings/geofence"),

  updateGeofenceSetting: (enabled) =>
    USE_MOCK ? mockApi.updateGeofenceSetting(enabled) : httpRequest("PUT", "/settings/geofence", { enabled }),

  // Shifts
  getActiveShift: (userId) =>
    USE_MOCK ? mockApi.getActiveShift(userId) : httpRequest("GET", "/shifts/active"),

  startShift: (userId, coords) =>
    USE_MOCK ? mockApi.startShift(userId, coords) : httpRequest("POST", "/shifts/start", coords),

  endShift: (userId, coords) =>
    USE_MOCK
      ? mockApi.endShift(userId, coords)
      : httpRequest("PUT", "/shifts/active/end", coords),

  getShifts: (params = {}) => {
    if (USE_MOCK) return mockApi.getShifts(params);
    const qs = new URLSearchParams();
    if (params.userId) qs.set("userId", params.userId);
    if (params.status) qs.set("status", params.status);
    return httpRequest("GET", `/shifts?${qs.toString()}`);
  },

  getShift: (id) =>
    USE_MOCK ? mockApi.getShift(id) : httpRequest("GET", `/shifts/${id}`),

  updateShift: (id, data) =>
    USE_MOCK ? mockApi.updateShift(id, data) : httpRequest("PUT", `/shifts/${id}`, data),

  deleteShift: (id) =>
    USE_MOCK ? mockApi.deleteShift(id) : httpRequest("DELETE", `/shifts/${id}`),
};

// Keep legacy default export compatibility
api.get = (...args) => api;
api.post = (...args) => api;
api.put = (...args) => api;
api.delete = (...args) => api;