const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

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

export function registerVendor(payload) {
  return apiRequest("/vendors", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function signInVendor(payload) {
  return apiRequest("/vendors/signin", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getVendor(vendorId) {
  return apiRequest(`/vendors/${vendorId}`);
}

export function getVendorDashboard(vendorId) {
  return apiRequest(`/vendors/${vendorId}/dashboard`);
}

export function getIdentityBanks() {
  return apiRequest("/vendors/banks");
}

export function verifyVendorNin(vendorId, payload) {
  return apiRequest(`/vendors/${vendorId}/verify-nin`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function resolveVendorAccount(vendorId, payload) {
  return apiRequest(`/vendors/${vendorId}/resolve-account`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateVendorPayoutDetails(vendorId, payload) {
  return apiRequest(`/vendors/${vendorId}/payout-details`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function updateVendorSoundDevice(vendorId, payload) {
  return apiRequest(`/vendors/${vendorId}/sound-device`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getPublicMerchant(slug) {
  return apiRequest(`/vendors/public/${slug}`);
}

export function createPayment(payload) {
  return apiRequest("/payments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function verifyInlinePayment(payload) {
  return apiRequest("/payments/verify-inline", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
