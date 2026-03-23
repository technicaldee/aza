import { formatNaira } from "./common.js";

const params = new URLSearchParams(window.location.search);
const statusPill = document.querySelector("#result-pill");
const heading = document.querySelector("#result-heading");
const summary = document.querySelector("#result-summary");
const txnRef = document.querySelector("#detail-txnref");
const amount = document.querySelector("#detail-amount");
const responseCode = document.querySelector("#detail-response-code");
const paymentReference = document.querySelector("#detail-payment-reference");
const rrn = document.querySelector("#detail-rrn");
const errorBox = document.querySelector("#error-box");

const verified = params.get("verified") === "true";
const amountValue = Number(params.get("amount") || 0);

statusPill.textContent = verified ? "Verified" : "Needs Attention";
statusPill.className =
  "inline-flex rounded-full px-4 py-2 text-sm font-bold " +
  (verified ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800");

heading.textContent = verified
  ? "Payment confirmed on the server"
  : "We could not verify this payment yet";
summary.textContent =
  params.get("responseDescription") ||
  params.get("error") ||
  "Use the transaction reference below if you want to requery again.";

txnRef.textContent = params.get("txnref") || "Unavailable";
amount.textContent = amountValue ? formatNaira(amountValue) : "Unavailable";
responseCode.textContent = params.get("responseCode") || params.get("redirectResponseCode") || "--";
paymentReference.textContent = params.get("paymentReference") || "--";
rrn.textContent = params.get("retrievalReferenceNumber") || "--";

if (params.get("error")) {
  errorBox.textContent = params.get("error");
  errorBox.classList.remove("hidden");
}
