const toastRoot = document.createElement("div");
toastRoot.className = "toast-stack";
document.body.appendChild(toastRoot);

export function showToast(message, tone = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${tone}`;
  toast.textContent = message;
  toastRoot.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3600);
}

export function generateTransactionReference(prefix = "aza") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nairaToMinor(amount) {
  return Math.round(Number(amount || 0) * 100);
}

export function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2
  }).format(Number(amount || 0));
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

export function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function setCurrentVendorId(vendorId) {
  localStorage.setItem("aza:vendor-id", vendorId);
}

export function getCurrentVendorId() {
  return localStorage.getItem("aza:vendor-id");
}

export function clearCurrentVendorId() {
  localStorage.removeItem("aza:vendor-id");
}

export function buildMerchantLink(slug) {
  return `${window.location.origin}/pay.html?merchant=${slug}`;
}

export function buildQrUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(text)}`;
}

export async function loadExternalScript(src) {
  const existing = document.querySelector(`script[data-src="${src}"]`);

  if (existing) {
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.dataset.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.body.appendChild(script);
  });
}
