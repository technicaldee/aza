import { getPublicConfig, getPublicMerchant, verifyInlinePayment } from "./api.js";
import {
  amountToMinor,
  formatDateTime,
  formatCurrency,
  generateTransactionReference,
  loadExternalScript,
  showToast
} from "./common.js";

const merchantName = document.querySelector("#merchant-name");
const merchantLocation = document.querySelector("#merchant-location");
const merchantCategory = document.querySelector("#merchant-category");
const amountInput = document.querySelector("#amount-input");
const currencySelect = document.querySelector("#currency-select");
const currencySymbol = document.querySelector("#currency-symbol");
const payerNameInput = document.querySelector("#payer-name");
const payerEmailInput = document.querySelector("#payer-email");
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
let selectedCurrency = null;

const CURRENCY_METADATA = {
  404: { alpha: "KES", symbol: "KSh", label: "Kenyan Shilling (KES)" },
  566: { alpha: "NGN", symbol: "₦", label: "Nigerian Naira (NGN)" },
  710: { alpha: "ZAR", symbol: "R", label: "South African Rand (ZAR)" },
  826: { alpha: "GBP", symbol: "£", label: "British Pound (GBP)" },
  840: { alpha: "USD", symbol: "$", label: "US Dollar (USD)" },
  936: { alpha: "GHS", symbol: "GH₵", label: "Ghanaian Cedi (GHS)" },
  978: { alpha: "EUR", symbol: "€", label: "Euro (EUR)" }
};

function getCurrencyInfo(code) {
  const numericCode = Number(code);
  const meta = CURRENCY_METADATA[numericCode];
  if (meta) {
    return { code: numericCode, ...meta };
  }

  return {
    code: numericCode,
    alpha: "NGN",
    symbol: "₦",
    label: `Currency ${numericCode}`
  };
}

function renderCurrencyOptions() {
  if (!currencySelect || !publicConfig) {
    return;
  }

  const supported = Array.isArray(publicConfig.supportedCurrencies)
    ? publicConfig.supportedCurrencies
    : [];
  const defaultCode = Number(publicConfig.currency || 566);
  const uniqueCodes = Array.from(new Set([defaultCode, ...supported.map(Number).filter(Boolean)]));

  currencySelect.innerHTML = "";

  uniqueCodes.forEach((code) => {
    const currency = getCurrencyInfo(code);
    const option = document.createElement("option");
    option.value = String(currency.code);
    option.textContent = currency.label;
    option.selected = currency.code === defaultCode;
    currencySelect.appendChild(option);
  });

  selectedCurrency = getCurrencyInfo(defaultCode);
  if (currencySymbol) {
    currencySymbol.textContent = selectedCurrency.symbol;
  }
}

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
    renderCurrencyOptions();

    merchantName.textContent = merchant.businessName;
    merchantLocation.textContent = merchant.location;
    merchantCategory.textContent = merchant.category;

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
  const amountMinor = amountToMinor(amount);
  const payerEmail = payerEmailInput?.value.trim() || "";

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
    const activeCurrency = selectedCurrency || getCurrencyInfo(publicConfig.currency || 566);
    await loadExternalScript(publicConfig.checkoutScriptUrl);

    const txnRef = generateTransactionReference("aza_qt");

    window.webpayCheckout({
      merchant_code: publicConfig.merchantCode,
      pay_item_id: publicConfig.payItemId,
      pay_item_name: `${merchant.businessName} Payment`,
      txn_ref: txnRef,
      amount: amountMinor,
      currency: activeCurrency.code,
      cust_name: payerNameInput?.value.trim() || "Customer",
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
            payerName: payerNameInput?.value.trim() || "Customer",
            note: ""
          });

          successCard.classList.remove("hidden");
          successAmount.textContent = formatCurrency(result.payment.amount, activeCurrency.alpha);
          successTime.textContent = formatDateTime(result.payment.createdAt);
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
currencySelect?.addEventListener("change", () => {
  selectedCurrency = getCurrencyInfo(currencySelect.value);
  if (currencySymbol) {
    currencySymbol.textContent = selectedCurrency.symbol;
  }
});

init();
