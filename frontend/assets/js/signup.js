import { registerVendor } from "./api.js";
import { setCurrentVendorId, showToast } from "./common.js";

const form = document.querySelector("#signup-form");
const submitButton = document.querySelector("#signup-submit");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  submitButton.disabled = true;
  submitButton.textContent = "Creating account...";

  try {
    const result = await registerVendor(payload);
    setCurrentVendorId(result.vendor.id);
    showToast("Vendor account created.", "success");
    window.location.href = `/dashboard.html?vendor=${result.vendor.id}`;
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create Vendor Account";
  }
});
