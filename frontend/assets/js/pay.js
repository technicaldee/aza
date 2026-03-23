import { createPayment, getPublicMerchant } from "./api.js";
import { copyToClipboard, formatDateTime, formatNaira, showToast } from "./common.js";

const merchantName = document.querySelector("#merchant-name");
const merchantLocation = document.querySelector("#merchant-location");
const merchantCategory = document.querySelector("#merchant-category");
const amountInput = document.querySelector("#amount-input");
const payerNameInput = document.querySelector("#payer-name");
const noteInput = document.querySelector("#payment-note");
const bankName = document.querySelector("#bank-name");
const accountNumber = document.querySelector("#account-number");
const accountName = document.querySelector("#account-name");
const copyAccountButton = document.querySelector("#copy-account-number");
const submitButton = document.querySelector("#submit-payment");
const methodButtons = document.querySelectorAll(".pay-method");
const successCard = document.querySelector("#success-card");
const successAmount = document.querySelector("#success-amount");
const successTime = document.querySelector("#success-time");
const successMethod = document.querySelector("#success-method");
const errorCard = document.querySelector("#error-card");
const pageBody = document.querySelector("#pay-shell");

let merchant = null;
let selectedMethod = "TRANSFER";

function setMethod(method) {
  selectedMethod = method;
  methodButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.method === method);
  });
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
    merchant = await getPublicMerchant(slug);
    merchantName.textContent = merchant.businessName;
    merchantLocation.textContent = merchant.location;
    merchantCategory.textContent = merchant.category;
    bankName.textContent = merchant.bankName;
    accountNumber.textContent = merchant.accountNumber;
    accountName.textContent = merchant.accountName;
  } catch (error) {
    errorCard.classList.remove("hidden");
    errorCard.textContent = error.message;
    pageBody.classList.add("opacity-60");
    submitButton.disabled = true;
  }
}

copyAccountButton?.addEventListener("click", async () => {
  await copyToClipboard(accountNumber.textContent.trim());
  showToast("Account number copied.", "success");
});

methodButtons.forEach((button) => {
  button.addEventListener("click", () => setMethod(button.dataset.method));
});

submitButton?.addEventListener("click", async () => {
  const amount = Number(amountInput.value || 0);

  if (!merchant) {
    showToast("Merchant is not loaded yet.", "warn");
    return;
  }

  if (amount <= 0) {
    showToast("Enter a valid amount.", "warn");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Confirming...";

  try {
    const result = await createPayment({
      merchantSlug: merchant.slug,
      amount,
      channel: selectedMethod,
      payerName: payerNameInput.value.trim() || "Customer",
      note: noteInput.value.trim()
    });

    successCard.classList.remove("hidden");
    successAmount.textContent = formatNaira(result.payment.amount);
    successTime.textContent = formatDateTime(result.payment.createdAt);
    successMethod.textContent = selectedMethod;
    showToast("Payment recorded successfully.", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "I’ve Made Payment";
  }
});

setMethod(selectedMethod);
init();
