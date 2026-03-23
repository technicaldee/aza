const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getPublicConfig() {
  return apiRequest("/config/public");
}

export function createAccessToken() {
  return apiRequest("/auth/token", {
    method: "POST"
  });
}

export function requeryTransaction(payload) {
  return apiRequest("/transactions/requery", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function initializeWallet(payload) {
  return apiRequest("/wallet/initialize", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getWalletStatus(payload) {
  return apiRequest("/wallet/status", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createVirtualAccount(payload) {
  return apiRequest("/virtual-accounts", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
