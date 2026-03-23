import { getCurrentVendorId, setCurrentVendorId, showToast } from "./common.js";
import { getVendor, verifyVendorNin } from "./api.js";

const firstNameOutput = document.querySelector("#verify-first-name");
const lastNameOutput = document.querySelector("#verify-last-name");
const form = document.querySelector("#nin-form");
const ninInput = document.querySelector("#nin-input");
const statusText = document.querySelector("#nin-status");
const submitButton = document.querySelector("#nin-submit");

let currentVendor = null;

async function init() {
  const params = new URLSearchParams(window.location.search);
  const vendorId = params.get("vendor") || getCurrentVendorId();

  if (!vendorId) {
    window.location.href = "/signup.html";
    return;
  }

  try {
    const vendor = await getVendor(vendorId);
    currentVendor = vendor;
    setCurrentVendorId(vendor.id);

    if (vendor.ninVerified) {
      window.location.href = `/dashboard.html?vendor=${vendor.id}`;
      return;
    }

    firstNameOutput.textContent = vendor.firstName || "--";
    lastNameOutput.textContent = vendor.lastName || "--";
  } catch (error) {
    showToast(error.message, "error");
    window.location.href = "/signin.html";
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentVendor) {
    return;
  }

  const nin = ninInput.value.trim();

  submitButton.disabled = true;
  submitButton.textContent = "Verifying...";
  statusText.textContent = "Verifying your NIN against the signup name...";
  statusText.className = "text-sm text-on-surface-variant";

  try {
    await verifyVendorNin(currentVendor.id, { nin });
    showToast("NIN verified successfully.", "success");
    statusText.textContent = "Verification successful. Redirecting to your dashboard...";
    statusText.className = "text-sm font-semibold text-green-700";
    window.location.href = `/dashboard.html?vendor=${currentVendor.id}`;
  } catch (error) {
    statusText.textContent = error.message;
    statusText.className = "text-sm font-semibold text-red-600";
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Verify NIN";
  }
});

init();
