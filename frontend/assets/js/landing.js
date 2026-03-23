import { getPublicConfig } from "./api.js";
import {
  generateTransactionReference,
  loadExternalScript,
  nairaToMinor,
  rememberTransaction,
  renderJson,
  showToast
} from "./common.js";

const configPill = document.querySelector("#config-pill");
const configHint = document.querySelector("#config-hint");
const merchantCodeSlot = document.querySelector("#merchant-code");
const payItemSlot = document.querySelector("#pay-item-id");
const checkoutLog = document.querySelector("#checkout-log");
const inlineButton = document.querySelector("#launch-inline-checkout");

let publicConfig = null;

function renderConfigState() {
  if (!publicConfig) {
    return;
  }

  const configured = publicConfig.checkoutReady;
  configPill.textContent = configured ? "Checkout Ready" : "Configuration Needed";
  configPill.className =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold " +
    (configured
      ? "bg-emerald-500/15 text-emerald-100"
      : "bg-orange-500/15 text-orange-100");
  merchantCodeSlot.textContent = publicConfig.merchantCode || "Not resolved yet";
  payItemSlot.textContent = publicConfig.payItemId || "Missing pay item id";
  configHint.textContent = configured
    ? "Inline checkout and redirect checkout are ready to test."
    : `Missing: ${publicConfig.missingFields.join(", ")}`;
}

async function launchInlineCheckout() {
  if (!publicConfig?.checkoutReady) {
    showToast("Add your merchant code and pay item ID in backend/.env first.", "warn");
    return;
  }

  try {
    await loadExternalScript(publicConfig.checkoutScriptUrl);

    const txnRef = generateTransactionReference("aza_inline");
    const amount = nairaToMinor(100);
    rememberTransaction({ txnRef, amount });

    window.webpayCheckout({
      merchant_code: publicConfig.merchantCode,
      pay_item_id: publicConfig.payItemId,
      pay_item_name: publicConfig.payItemName,
      txn_ref: txnRef,
      site_redirect_url: publicConfig.siteRedirectUrl,
      amount,
      currency: Number(publicConfig.currency),
      cust_name: "AZA Demo Shopper",
      cust_email: "demo@aza.app",
      onComplete: (response) => {
        renderJson(checkoutLog, response);
        showToast("Inline checkout returned a response.", "success");
      },
      mode: publicConfig.mode
    });
  } catch (error) {
    renderJson(checkoutLog, { error: error.message });
    showToast(error.message, "error");
  }
}

async function init() {
  try {
    publicConfig = await getPublicConfig();
    renderConfigState();
    renderJson(checkoutLog, {
      status: publicConfig.checkoutReady ? "ready" : "missing-config",
      merchantCode: publicConfig.merchantCode || null,
      payItemId: publicConfig.payItemId || null,
      redirectUrl: publicConfig.siteRedirectUrl
    });
  } catch (error) {
    configHint.textContent = "Could not reach the backend API.";
    renderJson(checkoutLog, { error: error.message });
    showToast("Backend unavailable. Start the server on port 4000.", "error");
  }
}

inlineButton?.addEventListener("click", launchInlineCheckout);

init();
