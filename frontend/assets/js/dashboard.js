import { getPublicConfig } from "./api.js";
import { copyToClipboard, renderJson, showToast } from "./common.js";

const configState = document.querySelector("#config-state");
const quickLog = document.querySelector("#dashboard-log");
const copyLinkButton = document.querySelector("#copy-payment-link");
const replayButton = document.querySelector("#replay-announcement");
const merchantMeta = document.querySelector("#merchant-meta");

async function init() {
  try {
    const config = await getPublicConfig();
    configState.textContent = config.checkoutReady
      ? "Backend connected"
      : "Backend connected, checkout still needs merchant setup";
    merchantMeta.textContent = config.merchantCode
      ? `Merchant code: ${config.merchantCode}`
      : "Merchant code not resolved yet";
    renderJson(quickLog, config);
  } catch (error) {
    configState.textContent = "Backend unavailable";
    renderJson(quickLog, { error: error.message });
  }
}

copyLinkButton?.addEventListener("click", async () => {
  const link = `${window.location.origin}/pay.html`;
  await copyToClipboard(link);
  showToast("Payment link copied.", "success");
});

replayButton?.addEventListener("click", () => {
  showToast('Voice replay queued: "Payment received, five hundred naira."', "info");
});

init();
