import { API_BASE_URL } from "./config";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listProjects: () => request("/projects/"),
  getProject: (id) => request(`/projects/${id}/`),

  logCheckIn: (data) =>
    request("/check-ins/", { method: "POST", body: JSON.stringify(data) }),
  logMaterial: (data) =>
    request("/material-usages/", { method: "POST", body: JSON.stringify(data) }),

  listAta: () => request("/ata-items/"),
  advanceAta: (id) =>
    request(`/ata-items/${id}/advance/`, { method: "POST", body: "{}" }),
  rejectAta: (id) =>
    request(`/ata-items/${id}/reject/`, { method: "POST", body: "{}" }),
};
