import { getPublicConfig, getPublicMerchant, verifyInlinePayment } from "./api.js";
import {
  formatDateTime,
  formatNaira,
  generateTransactionReference,
  loadExternalScript,
  nairaToMinor,
  showToast
} from "./common.js";

const merchantName = document.querySelector("#merchant-name");
const merchantLocation = document.querySelector("#merchant-location");
const merchantCategory = document.querySelector("#merchant-category");
const amountInput = document.querySelector("#amount-input");
const payerNameInput = document.querySelector("#payer-name");
const payerEmailInput = document.querySelector("#payer-email");
const noteInput = document.querySelector("#payment-note");
const submitButton = document.querySelector("#submit-payment");
const successCard = document.querySelector("#success-card");
const successAmount = document.querySelector("#success-amount");
const successTime = document.querySelector("#success-time");
const successMethod = document.querySelector("#success-method");
const errorCard = document.querySelector("#error-card");
const pageBody = document.querySelector("#pay-shell");
const quicktellerStatus = document.querySelector("#quickteller-status");

let merchant = null;
let publicConfig = null;

async function init() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("merchant");

  if (!slug) {
    errorCard.classList.remove("hidden");
    errorCard.textContent = "This payment link is incomplete. Open a merchant link from the dashboard.";
    pageBody.classList.add("opacity-60");
    submitButton.disabled = true;
    return;
  }

  try {
    const [merchantData, config] = await Promise.all([
      getPublicMerchant(slug),
      getPublicConfig()
    ]);

    merchant = merchantData;
    publicConfig = config;

    merchantName.textContent = merchant.businessName;
    merchantLocation.textContent = merchant.location;
    merchantCategory.textContent = merchant.category;
    quicktellerStatus.textContent = config.checkoutReady
      ? "Secure Quickteller inline checkout is ready."
      : "Quickteller configuration is incomplete.";

    if (!config.checkoutReady) {
      submitButton.disabled = true;
    }
  } catch (error) {
    errorCard.classList.remove("hidden");
    errorCard.textContent = error.message;
    pageBody.classList.add("opacity-60");
    submitButton.disabled = true;
  }
}

async function openQuicktellerInline() {
  const amount = Number(amountInput.value || 0);
  const amountMinor = nairaToMinor(amount);
  const payerEmail = payerEmailInput.value.trim();

  if (!merchant || !publicConfig) {
    showToast("Merchant is not loaded yet.", "warn");
    return;
  }

  if (amount <= 0) {
    showToast("Enter a valid amount.", "warn");
    return;
  }

  if (!payerEmail) {
    showToast("Customer email is required.", "warn");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Opening checkout...";

  try {
    await loadExternalScript(publicConfig.checkoutScriptUrl);

    const txnRef = generateTransactionReference("aza_qt");

    window.webpayCheckout({
      merchant_code: publicConfig.merchantCode,
      pay_item_id: publicConfig.payItemId,
      pay_item_name: `${merchant.businessName} Payment`,
      txn_ref: txnRef,
      amount: amountMinor,
      currency: Number(publicConfig.currency),
      cust_name: payerNameInput.value.trim() || "Customer",
      cust_email: payerEmail,
      site_redirect_url: publicConfig.siteRedirectUrl,
      mode: publicConfig.mode,
      onComplete: async () => {
        submitButton.textContent = "Verifying payment...";

        try {
          const result = await verifyInlinePayment({
            merchantSlug: merchant.slug,
            txnRef,
            amountMinor,
            payerName: payerNameInput.value.trim() || "Customer",
            note: noteInput.value.trim()
          });

          successCard.classList.remove("hidden");
          successAmount.textContent = formatNaira(result.payment.amount);
          successTime.textContent = formatDateTime(result.payment.createdAt);
          successMethod.textContent = "Quickteller Inline";
          showToast("Payment verified and recorded.", "success");
        } catch (error) {
          showToast(error.message, "error");
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = "Pay Securely with Quickteller";
        }
      }
    });
  } catch (error) {
    showToast(error.message, "error");
    submitButton.disabled = false;
    submitButton.textContent = "Pay Securely with Quickteller";
  }
}

submitButton?.addEventListener("click", openQuicktellerInline);

init();
