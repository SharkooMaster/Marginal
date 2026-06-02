import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL } from "./config";

const ACCESS_KEY = "marginal.access";
const REFRESH_KEY = "marginal.refresh";
const USER_KEY = "marginal.user";

let accessToken = null;
let refreshToken = null;
let onAuthFail = null;

// AuthContext registers a callback so an expired session can drop the user
// back to the sign-in screen.
export function setOnAuthFail(fn) {
  onAuthFail = fn;
}

export async function loadStoredAuth() {
  const [a, r, u] = await Promise.all([
    AsyncStorage.getItem(ACCESS_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);
  accessToken = a;
  refreshToken = r;
  return { access: a, refresh: r, user: u ? JSON.parse(u) : null };
}

export async function saveAuth({ access, refresh, user }) {
  accessToken = access;
  refreshToken = refresh;
  await Promise.all([
    AsyncStorage.setItem(ACCESS_KEY, access),
    AsyncStorage.setItem(REFRESH_KEY, refresh),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearAuth() {
  accessToken = null;
  refreshToken = null;
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, USER_KEY]);
}

function rawRequest(path, options = {}, useAuth = true) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (useAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

async function tryRefresh() {
  if (!refreshToken) return false;
  const res = await rawRequest(
    "/auth/token/refresh/",
    { method: "POST", body: JSON.stringify({ refresh: refreshToken }) },
    false
  );
  if (!res.ok) return false;
  const data = await res.json();
  accessToken = data.access;
  await AsyncStorage.setItem(ACCESS_KEY, data.access);
  return true;
}

async function request(path, options = {}) {
  let res = await rawRequest(path, options);
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawRequest(path, options);
    } else {
      await clearAuth();
      if (onAuthFail) onAuthFail();
      throw new Error("Sessionen har gått ut. Logga in igen.");
    }
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Multipart upload (FormData). Does not set Content-Type so the platform can
// add the correct multipart boundary. Retries once on a 401 after refresh.
async function multipartRequest(path, formData) {
  const send = () =>
    fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
  let res = await send();
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await send();
    } else {
      await clearAuth();
      if (onAuthFail) onAuthFail();
      throw new Error("Sessionen har gått ut. Logga in igen.");
    }
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

async function authRequest(path, payload) {
  const res = await rawRequest(path, { method: "POST", body: JSON.stringify(payload) }, false);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Något gick fel (${res.status})`);
  }
  return data;
}

export const auth = {
  login: (email, password) => authRequest("/auth/login/", { email, password }),
  register: (payload) => authRequest("/auth/register/", payload),
  me: () => request("/auth/me/"),
};

export const api = {
  listProjects: ({ archived = false } = {}) =>
    request(`/projects/?archived=${archived ? "true" : "false"}`),
  getProject: (id) => request(`/projects/${id}/`),
  setArchived: (id, archived) =>
    request(`/projects/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ archived }),
    }),
  createProject: (data) =>
    request("/projects/", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id, data) =>
    request(`/projects/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}/`, { method: "DELETE" }),
  createScopeItem: (data) =>
    request("/scope-items/", { method: "POST", body: JSON.stringify(data) }),

  logCheckIn: (data) =>
    request("/check-ins/", { method: "POST", body: JSON.stringify(data) }),
  logMaterial: (data) =>
    request("/material-usages/", { method: "POST", body: JSON.stringify(data) }),

  listAta: () => request("/ata-items/"),
  advanceAta: (id) =>
    request(`/ata-items/${id}/advance/`, { method: "POST", body: "{}" }),
  rejectAta: (id) =>
    request(`/ata-items/${id}/reject/`, { method: "POST", body: "{}" }),

  listTeam: () => request("/auth/team/"),
  addMember: (data) =>
    request("/auth/team/", { method: "POST", body: JSON.stringify(data) }),
  registerDevice: (token, platform) =>
    request("/auth/device/", {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    }),

  listPhotos: (projectId) => request(`/photos/?project=${projectId}`),
  uploadPhoto: (formData) => multipartRequest("/photos/", formData),
  deletePhoto: (id) => request(`/photos/${id}/`, { method: "DELETE" }),
};
