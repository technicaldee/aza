import { signInVendor } from "./api.js";
import { setCurrentVendorId, showToast } from "./common.js";

const form = document.querySelector("#signin-form");
const submitButton = document.querySelector("#signin-submit");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "")
  };

  submitButton.disabled = true;
  submitButton.textContent = "Signing in...";

  try {
    const result = await signInVendor(payload);
    setCurrentVendorId(result.vendor.id);
    showToast("Signed in successfully.", "success");
    window.location.href = result.vendor.ninVerified
      ? `/dashboard.html?vendor=${result.vendor.id}`
      : `/verify-nin.html?vendor=${result.vendor.id}`;
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign In";
  }
});
