import { getVendorDashboard } from "./api.js";
import {
  buildMerchantLink,
  buildQrUrl,
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

let merchantLink = "";

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

async function init() {
  const params = new URLSearchParams(window.location.search);
  const vendorId = params.get("vendor") || getCurrentVendorId();

  if (!vendorId) {
    window.location.href = "/signup.html";
    return;
  }

  try {
    const data = await getVendorDashboard(vendorId);
    setCurrentVendorId(data.vendor.id);

    vendorName.textContent = `Morning, ${data.vendor.fullName.split(" ")[0]}`;
    vendorSubtitle.textContent = `${data.vendor.businessName} is ready to receive payments.`;
    totalVolume.textContent = formatNaira(data.stats.totalVolume);
    totalTransactions.textContent = String(data.stats.totalTransactions);
    averageTicket.textContent = formatNaira(data.stats.averageTicket);

    merchantLink = buildMerchantLink(data.vendor.slug);
    paymentLinkOutput.textContent = merchantLink;
    qrImage.src = buildQrUrl(merchantLink);
    qrImage.alt = `${data.vendor.businessName} payment QR`;

    renderPayments(data.payments);
  } catch (error) {
    showToast(error.message, "error");
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

init();
