// ===== API Client =====
// Currently uses mockApi (localStorage-based).
// When backend is ready, switch USE_MOCK to false.

import { mockApi } from "./mockApi";

const USE_MOCK = false;

/* ---------- real HTTP client ---------- */
const BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("mock_token");
}

async function httpRequest(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new Error(data?.message || res.statusText || "Request failed");
  }

  return data ?? {};
}

/* ---------- unified API (mock-aware) ---------- */
export const api = {
  // Auth
  login: (username, password) =>
    USE_MOCK
      ? mockApi.login(username, password)
      : httpRequest("POST", "/auth/login", { username, password }),

  changePassword: (currentPassword, newPassword) =>
    USE_MOCK
      ? mockApi.changePassword(currentPassword, newPassword)
      : httpRequest("POST", "/auth/change-password", {
          currentPassword,
          newPassword,
        }),

  getMe: () => (USE_MOCK ? mockApi.getMe?.() : httpRequest("GET", "/auth/me")),

  updateMe: (data) =>
    USE_MOCK ? mockApi.updateMe?.() : httpRequest("PUT", "/auth/me", data),

  // Users (admin)
  getUsers: () =>
    USE_MOCK ? mockApi.getUsers() : httpRequest("GET", "/users"),

  getUser: (id) =>
    USE_MOCK ? mockApi.getUser(id) : httpRequest("GET", `/users/${id}`),

  createUser: (data) =>
    USE_MOCK ? mockApi.createUser(data) : httpRequest("POST", "/users", data),

  updateUser: (id, data) =>
    USE_MOCK
      ? mockApi.updateUser(id, data)
      : httpRequest("PUT", `/users/${id}`, data),

  deleteUser: (id) =>
    USE_MOCK ? mockApi.deleteUser(id) : httpRequest("DELETE", `/users/${id}`),

  // Geofences (admin)
  getGeofences: () =>
    USE_MOCK ? mockApi.getGeofences() : httpRequest("GET", "/geofences"),

  getGeofence: (id) =>
    USE_MOCK ? mockApi.getGeofence(id) : httpRequest("GET", `/geofences/${id}`),

  createGeofence: (data) =>
    USE_MOCK
      ? mockApi.createGeofence(data)
      : httpRequest("POST", "/geofences", data),

  updateGeofence: (id, data) =>
    USE_MOCK
      ? mockApi.updateGeofence(id, data)
      : httpRequest("PUT", `/geofences/${id}`, data),

  deleteGeofence: (id) =>
    USE_MOCK
      ? mockApi.deleteGeofence(id)
      : httpRequest("DELETE", `/geofences/${id}`),

  // Companies (admin)
  getCompanies: () =>
    USE_MOCK ? mockApi.getCompanies() : httpRequest("GET", "/companies"),

  getCompany: (id) =>
    USE_MOCK ? mockApi.getCompany(id) : httpRequest("GET", `/companies/${id}`),

  createCompany: (data) =>
    USE_MOCK
      ? mockApi.createCompany(data)
      : httpRequest("POST", "/companies", data),

  updateCompany: (id, data) =>
    USE_MOCK
      ? mockApi.updateCompany(id, data)
      : httpRequest("PUT", `/companies/${id}`, data),

  deleteCompany: (id) =>
    USE_MOCK
      ? mockApi.deleteCompany(id)
      : httpRequest("DELETE", `/companies/${id}`),

  // Reports (admin)
  getAttendanceReport: (params = {}) => {
    if (USE_MOCK) return mockApi.getAttendanceReport(params);
    const qs = new URLSearchParams();
    if (params.startDate) qs.set("startDate", params.startDate);
    if (params.endDate) qs.set("endDate", params.endDate);
    if (params.userId) qs.set("userId", params.userId);
    const query = qs.toString();
    return httpRequest("GET", `/reports/attendance${query ? `?${query}` : ""}`);
  },

  getInternshipProgressReport: () =>
    USE_MOCK
      ? mockApi.getInternshipProgressReport()
      : httpRequest("GET", "/reports/internship-progress"),

  getSummaryReport: () =>
    USE_MOCK
      ? mockApi.getSummaryReport()
      : httpRequest("GET", "/reports/summary"),

  getGeofenceSetting: () =>
    USE_MOCK
      ? mockApi.getGeofenceSetting()
      : httpRequest("GET", "/settings/geofence"),

  updateGeofenceSetting: (enabled) =>
    USE_MOCK
      ? mockApi.updateGeofenceSetting(enabled)
      : httpRequest("PUT", "/settings/geofence", { enabled }),

  // Shifts
  getActiveShift: (userId) =>
    USE_MOCK
      ? mockApi.getActiveShift(userId)
      : httpRequest("GET", "/shifts/active"),

  startShift: (userId, coords) =>
    USE_MOCK
      ? mockApi.startShift(userId, coords)
      : httpRequest("POST", "/shifts/start", coords),

  endShift: (userId, coords) =>
    USE_MOCK
      ? mockApi.endShift(userId, coords)
      : httpRequest("PUT", "/shifts/active/end", coords),

  getShifts: (params = {}) => {
    if (USE_MOCK) return mockApi.getShifts(params);
    const qs = new URLSearchParams();
    if (params.userId) qs.set("userId", params.userId);
    if (params.status) qs.set("status", params.status);
    const query = qs.toString();
    return httpRequest("GET", `/shifts${query ? `?${query}` : ""}`);
  },

  getShift: (id) =>
    USE_MOCK ? mockApi.getShift(id) : httpRequest("GET", `/shifts/${id}`),

  updateShift: (id, data) =>
    USE_MOCK
      ? mockApi.updateShift(id, data)
      : httpRequest("PUT", `/shifts/${id}`, data),

  deleteShift: (id) =>
    USE_MOCK ? mockApi.deleteShift(id) : httpRequest("DELETE", `/shifts/${id}`),
};

// Keep legacy default export compatibility
api.get = (...args) => api;
api.post = (...args) => api;
api.put = (...args) => api;
api.delete = (...args) => api;
