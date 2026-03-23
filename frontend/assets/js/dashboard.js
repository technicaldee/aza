import {
  getIdentityBanks,
  getVendorDashboard,
  resolveVendorAccount,
  updateVendorPayoutDetails
} from "./api.js";
import {
  buildMerchantLink,
  buildQrUrl,
  clearCurrentVendorId,
  copyToClipboard,
  formatDateTime,
  formatNaira,
  getCurrentVendorId,
  setCurrentVendorId,
  showToast
} from "./common.js";

const vendorName = document.querySelector("#vendor-name");
const vendorSubtitle = document.querySelector("#vendor-subtitle");
const totalVolume = document.querySelector("#total-volume");
const totalTransactions = document.querySelector("#total-transactions");
const averageTicket = document.querySelector("#average-ticket");
const paymentLinkOutput = document.querySelector("#payment-link-output");
const qrImage = document.querySelector("#qr-image");
const transactionsBody = document.querySelector("#transactions-body");
const emptyState = document.querySelector("#empty-state");
const copyLinkButton = document.querySelector("#copy-payment-link");
const openLinkButton = document.querySelector("#open-payment-link");
const downloadQrButton = document.querySelector("#download-qr");
const overviewTabButton = document.querySelector("#tab-overview");
const withdrawTabButton = document.querySelector("#tab-withdraw");
const overviewPanel = document.querySelector("#overview-panel");
const withdrawPanel = document.querySelector("#withdraw-panel");
const payoutForm = document.querySelector("#payout-form");
const payoutSubmitButton = document.querySelector("#save-payout-details");
const bankCodeSelect = document.querySelector("#bank-code");
const accountNumberInput = document.querySelector("#account-number");
const resolvedAccountNameInput = document.querySelector("#resolved-account-name");
const accountMatchStatus = document.querySelector("#account-match-status");
const logoutButton = document.querySelector("#logout-button");

let merchantLink = "";
let currentVendorId = "";
let banksLoaded = false;
let resolvedPayout = null;

function setActiveTab(tab) {
  const isOverview = tab === "overview";

  overviewPanel?.classList.toggle("hidden", !isOverview);
  withdrawPanel?.classList.toggle("hidden", isOverview);

  overviewTabButton?.classList.toggle("bg-indigo-50", isOverview);
  overviewTabButton?.classList.toggle("text-indigo-700", isOverview);
  overviewTabButton?.classList.toggle("text-slate-500", !isOverview);

  withdrawTabButton?.classList.toggle("bg-indigo-50", !isOverview);
  withdrawTabButton?.classList.toggle("text-indigo-700", !isOverview);
  withdrawTabButton?.classList.toggle("text-slate-500", isOverview);
}

function renderPayments(payments) {
  transactionsBody.innerHTML = "";

  if (!payments.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  payments.forEach((payment) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-surface-bright transition-colors";
    row.innerHTML = `
      <td class="px-6 py-5">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-xs">
            ${payment.payerName.slice(0, 1).toUpperCase()}
          </div>
          <span class="font-headline font-bold text-sm text-primary">${payment.payerName}</span>
        </div>
      </td>
      <td class="px-6 py-5 font-headline font-bold text-sm text-primary">${formatNaira(payment.amount)}</td>
      <td class="px-6 py-5 font-body text-sm text-on-surface-variant">${formatDateTime(payment.createdAt)}</td>
      <td class="px-6 py-5 text-right">
        <span class="inline-flex rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">${payment.channel}</span>
      </td>
    `;
    transactionsBody.appendChild(row);
  });
}

function renderBankOptions(banks) {
  bankCodeSelect.innerHTML = '<option value="">Select bank</option>';

  banks.forEach((bank) => {
    const option = document.createElement("option");
    option.value = bank.code;
    option.textContent = bank.name;
    bankCodeSelect.appendChild(option);
  });
}

async function ensureBanksLoaded() {
  if (banksLoaded) {
    return;
  }

  const response = await getIdentityBanks();
  renderBankOptions(response.banks || []);
  banksLoaded = true;
}

function resetResolvedAccount() {
  resolvedPayout = null;
  if (resolvedAccountNameInput) {
    resolvedAccountNameInput.value = "";
  }
  if (accountMatchStatus) {
    accountMatchStatus.textContent = "Select a bank and enter a valid account number to resolve the account name.";
    accountMatchStatus.className = "text-sm text-on-surface-variant";
  }
}

async function tryResolveAccount() {
  const bankCode = bankCodeSelect?.value.trim();
  const accountNumber = accountNumberInput?.value.trim();
  const bankName = bankCodeSelect?.options[bankCodeSelect.selectedIndex]?.textContent?.trim() || "";

  if (!currentVendorId || !bankCode || accountNumber?.length < 10) {
    resetResolvedAccount();
    return;
  }

  try {
    const resolution = await resolveVendorAccount(currentVendorId, {
      bankCode,
      bankName,
      accountNumber
    });
    resolvedPayout = resolution;
    resolvedAccountNameInput.value = resolution.accountName || "";
    accountMatchStatus.textContent = resolution.matchesSignupName
      ? "Account name verified and it matches the signup name."
      : "Resolved account name does not match the signup name.";
    accountMatchStatus.className = resolution.matchesSignupName
      ? "text-sm font-semibold text-green-700"
      : "text-sm font-semibold text-red-600";
  } catch (error) {
    resetResolvedAccount();
    accountMatchStatus.textContent = error.message;
    accountMatchStatus.className = "text-sm font-semibold text-red-600";
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const vendorId = params.get("vendor") || getCurrentVendorId();

  if (!vendorId) {
    window.location.href = "/signin.html";
    return;
  }

  try {
    const data = await getVendorDashboard(vendorId);
    currentVendorId = data.vendor.id;
    setCurrentVendorId(data.vendor.id);

    if (!data.vendor.ninVerified) {
      window.location.href = `/verify-nin.html?vendor=${data.vendor.id}`;
      return;
    }

    vendorName.textContent = `Morning, ${data.vendor.fullName.split(" ")[0]}`;
    vendorSubtitle.textContent = `${data.vendor.businessName} is ready to receive payments.`;
    totalVolume.textContent = formatNaira(data.stats.totalVolume);
    totalTransactions.textContent = String(data.stats.totalTransactions);
    averageTicket.textContent = formatNaira(data.stats.averageTicket);

    merchantLink = buildMerchantLink(data.vendor.slug);
    paymentLinkOutput.textContent = merchantLink;
    qrImage.src = buildQrUrl(merchantLink);
    qrImage.alt = `${data.vendor.businessName} payment QR`;
    if (data.vendor.bankCode) {
      ensureBanksLoaded()
        .then(() => {
          bankCodeSelect.value = data.vendor.bankCode || "";
        })
        .catch((error) => {
          showToast(error.message, "error");
        });
    }
    accountNumberInput.value = data.vendor.accountNumber || "";
    resolvedAccountNameInput.value = data.vendor.accountName || "";
    if (data.vendor.accountName) {
      resolvedPayout = {
        bankCode: data.vendor.bankCode,
        bankName: data.vendor.bankName,
        accountNumber: data.vendor.accountNumber,
        accountName: data.vendor.accountName,
        matchesSignupName: true
      };
      accountMatchStatus.textContent = "Saved payout account matches the signup name.";
      accountMatchStatus.className = "text-sm font-semibold text-green-700";
    } else {
      resetResolvedAccount();
    }

    renderPayments(data.payments);
  } catch (error) {
    clearCurrentVendorId();
    showToast(error.message, "error");
    window.setTimeout(() => {
      window.location.href = "/signin.html";
    }, 300);
  }
}

copyLinkButton?.addEventListener("click", async () => {
  if (!merchantLink) return;
  await copyToClipboard(merchantLink);
  showToast("Payment link copied.", "success");
});

openLinkButton?.addEventListener("click", () => {
  if (!merchantLink) return;
  window.open(merchantLink, "_blank");
});

downloadQrButton?.addEventListener("click", () => {
  if (!qrImage.src) return;
  window.open(qrImage.src, "_blank");
});

overviewTabButton?.addEventListener("click", () => {
  setActiveTab("overview");
});

withdrawTabButton?.addEventListener("click", () => {
  setActiveTab("withdraw");
  ensureBanksLoaded().catch((error) => {
    showToast(error.message, "error");
  });
});

payoutForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentVendorId) {
    showToast("Vendor session not found.", "error");
    return;
  }

  const payload = {
    bankCode: bankCodeSelect.value.trim(),
    bankName: bankCodeSelect.options[bankCodeSelect.selectedIndex]?.textContent?.trim() || "",
    accountNumber: accountNumberInput.value.trim()
  };

  if (!resolvedPayout?.matchesSignupName) {
    showToast("Resolve an account name that matches the signup name before saving.", "error");
    return;
  }

  payoutSubmitButton.disabled = true;
  payoutSubmitButton.textContent = "Saving...";

  try {
    await updateVendorPayoutDetails(currentVendorId, payload);
    showToast("Payout details saved.", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    payoutSubmitButton.disabled = false;
    payoutSubmitButton.textContent = "Save payout details";
  }
});

logoutButton?.addEventListener("click", () => {
  clearCurrentVendorId();
  window.location.href = "/";
});

bankCodeSelect?.addEventListener("change", tryResolveAccount);
accountNumberInput?.addEventListener("blur", tryResolveAccount);
accountNumberInput?.addEventListener("input", () => {
  if (accountNumberInput.value.trim().length < 10) {
    resetResolvedAccount();
  }
});

setActiveTab("overview");

init();
