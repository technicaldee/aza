import {
  createVirtualAccount,
  getPublicConfig,
  getWalletStatus,
  initializeWallet,
  requeryTransaction
} from "./api.js";
import {
  copyToClipboard,
  formatMinorAsNaira,
  generateTransactionReference,
  loadExternalScript,
  nairaToMinor,
  rememberTransaction,
  renderJson,
  showToast
} from "./common.js";

const amountInput = document.querySelector("#amount-input");
const customerEmailInput = document.querySelector("#customer-email");
const txnRefInput = document.querySelector("#txn-ref-input");
const walletStatusInput = document.querySelector("#wallet-status-input");
const walletProviderInput = document.querySelector("#wallet-provider");
const walletPartyIdInput = document.querySelector("#wallet-party-id");
const virtualAccountProvider = document.querySelector("#virtual-account-provider");
const inlineCheckoutButton = document.querySelector("#inline-checkout-btn");
const redirectCheckoutButton = document.querySelector("#redirect-checkout-btn");
const verifyButton = document.querySelector("#verify-transaction-btn");
const walletInitButton = document.querySelector("#wallet-init-btn");
const walletStatusButton = document.querySelector("#wallet-status-btn");
const createVirtualAccountButton = document.querySelector("#create-virtual-account-btn");
const integrationLog = document.querySelector("#integration-log");
const redirectForm = document.querySelector("#redirect-form");
const copyAccountNumberButton = document.querySelector("#copy-account-number");
const accountNumberSlot = document.querySelector("#transfer-account-number");
const bankNameSlot = document.querySelector("#transfer-bank-name");
const accountNameSlot = document.querySelector("#transfer-account-name");
const envBadge = document.querySelector("#environment-badge");
const configNotice = document.querySelector("#config-notice");
const methodButtons = document.querySelectorAll(".pay-method");
const responseAmount = document.querySelector("#success-amount");
const responseStatus = document.querySelector("#success-status");

let publicConfig = null;
let selectedMethod = "redirect";
let latestWalletReference = "";

function getAmountMinor() {
  return nairaToMinor(amountInput.value || 0);
}

function getTxnRef() {
  const existing = txnRefInput.value.trim();

  if (existing) {
    return existing;
  }

  const generated = generateTransactionReference("aza_checkout");
  txnRefInput.value = generated;
  return generated;
}

function updateMethodState(method) {
  selectedMethod = method;
  methodButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.method === method);
  });
}

function updateSuccessPreview(message, amountMinor) {
  responseStatus.textContent = message;
  responseAmount.textContent = formatMinorAsNaira(amountMinor);
}

function renderConfig() {
  envBadge.textContent = publicConfig?.mode || "TEST";
  configNotice.textContent = publicConfig?.checkoutReady
    ? "Checkout config is ready. You can test inline or redirect flows now."
    : `Missing: ${publicConfig?.missingFields?.join(", ") || "backend config"}`;
}

async function startInlineCheckout() {
  if (!publicConfig?.checkoutReady) {
    showToast("Set merchant code and pay item ID in backend/.env.", "warn");
    return;
  }

  const txnRef = getTxnRef();
  const amount = getAmountMinor();

  try {
    await loadExternalScript(publicConfig.checkoutScriptUrl);
    rememberTransaction({ txnRef, amount });

    window.webpayCheckout({
      merchant_code: publicConfig.merchantCode,
      pay_item_id: publicConfig.payItemId,
      pay_item_name: publicConfig.payItemName,
      txn_ref: txnRef,
      site_redirect_url: publicConfig.siteRedirectUrl,
      amount,
      currency: Number(publicConfig.currency),
      cust_name: "AZA Customer",
      cust_email: customerEmailInput.value.trim() || "customer@aza.app",
      onComplete: (response) => {
        renderJson(integrationLog, response);
        updateSuccessPreview("Inline checkout callback received", amount);
        showToast("Inline checkout callback received.", "success");
      },
      mode: publicConfig.mode
    });
  } catch (error) {
    renderJson(integrationLog, { error: error.message });
    showToast(error.message, "error");
  }
}

function startRedirectCheckout() {
  if (!publicConfig?.checkoutReady) {
    showToast("Set merchant code and pay item ID in backend/.env.", "warn");
    return;
  }

  const txnRef = getTxnRef();
  const amount = getAmountMinor();
  rememberTransaction({ txnRef, amount });

  redirectForm.action = publicConfig.redirectActionUrl;
  redirectForm.querySelector('[name="merchant_code"]').value = publicConfig.merchantCode;
  redirectForm.querySelector('[name="pay_item_id"]').value = publicConfig.payItemId;
  redirectForm.querySelector('[name="txn_ref"]').value = txnRef;
  redirectForm.querySelector('[name="amount"]').value = amount;
  redirectForm.querySelector('[name="currency"]').value = publicConfig.currency;
  redirectForm.querySelector('[name="site_redirect_url"]').value = publicConfig.siteRedirectUrl;
  redirectForm.submit();
}

async function verifyTransaction() {
  const txnRef = getTxnRef();
  const amount = getAmountMinor();

  try {
    const data = await requeryTransaction({ txnRef, amount });
    renderJson(integrationLog, data);
    updateSuccessPreview(data.ResponseDescription || "Transaction checked", data.Amount || amount);
    showToast("Transaction requery completed.", "success");
  } catch (error) {
    renderJson(integrationLog, { error: error.message });
    showToast(error.message, "error");
  }
}

async function createStaticAccount() {
  try {
    const provider = virtualAccountProvider.value;
    const data = await createVirtualAccount({
      accountName: "AZA Demo Store",
      ...(provider ? { provider } : {})
    });
    accountNumberSlot.textContent = data.accountNumber || "Unavailable";
    bankNameSlot.textContent = data.bankName || "Unavailable";
    accountNameSlot.textContent = data.accountName || "AZA Demo Store";
    renderJson(integrationLog, data);
    showToast("Static transfer account generated.", "success");
  } catch (error) {
    renderJson(integrationLog, { error: error.message });
    showToast(error.message, "error");
  }
}

async function initializeWalletPaymentFlow() {
  try {
    const txnRef = getTxnRef();
    const payload = {
      currencyCode: publicConfig?.currency || "566",
      provider: walletProviderInput.value,
      amount: getAmountMinor(),
      transactionReference: txnRef
    };

    if (payload.provider === "MOMO" && walletPartyIdInput.value.trim()) {
      payload.partyId = walletPartyIdInput.value.trim();
    }

    const data = await initializeWallet(payload);
    latestWalletReference = data.transactionReference || txnRef;
    walletStatusInput.value = latestWalletReference;
    renderJson(integrationLog, data);
    showToast("Wallet transaction initialized.", "success");
  } catch (error) {
    renderJson(integrationLog, { error: error.message });
    showToast(error.message, "error");
  }
}

async function checkWalletPaymentStatus() {
  try {
    const transactionReference =
      walletStatusInput.value.trim() || latestWalletReference || getTxnRef();
    const data = await getWalletStatus({ transactionReference });
    renderJson(integrationLog, data);
    showToast("Wallet status checked.", "success");
  } catch (error) {
    renderJson(integrationLog, { error: error.message });
    showToast(error.message, "error");
  }
}

copyAccountNumberButton?.addEventListener("click", async () => {
  await copyToClipboard(accountNumberSlot.textContent.trim());
  showToast("Account number copied.", "success");
});

inlineCheckoutButton?.addEventListener("click", startInlineCheckout);
redirectCheckoutButton?.addEventListener("click", startRedirectCheckout);
verifyButton?.addEventListener("click", verifyTransaction);
walletInitButton?.addEventListener("click", initializeWalletPaymentFlow);
walletStatusButton?.addEventListener("click", checkWalletPaymentStatus);
createVirtualAccountButton?.addEventListener("click", createStaticAccount);
methodButtons.forEach((button) => {
  button.addEventListener("click", () => updateMethodState(button.dataset.method));
});

document.querySelector("#primary-action")?.addEventListener("click", () => {
  if (selectedMethod === "inline") {
    startInlineCheckout();
    return;
  }

  if (selectedMethod === "wallet") {
    initializeWalletPaymentFlow();
    return;
  }

  startRedirectCheckout();
});

async function init() {
  try {
    publicConfig = await getPublicConfig();
    renderConfig();
    renderJson(integrationLog, publicConfig);
  } catch (error) {
    renderJson(integrationLog, { error: error.message });
    showToast("Backend unavailable. Start the API server first.", "error");
  }

  updateMethodState(selectedMethod);
  updateSuccessPreview("Awaiting payment attempt", getAmountMinor());
}

init();
