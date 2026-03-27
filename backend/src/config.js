import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, "../.env") });
dotenv.config();

const mode = (process.env.INTERSWITCH_MODE || "TEST").toUpperCase();
const port = Number(process.env.PORT || 4000);
const backendBaseUrl = process.env.BACKEND_BASE_URL || `http://localhost:${port}`;
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const isLive = mode === "LIVE";

function parseOriginList(value) {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSupportedCurrencyCodes(value) {
  const defaults = ["566", "840", "978", "826", "404", "936", "710"];
  const parsed = (value || "")
    .split(",")
    .map((code) => code.trim())
    .filter((code) => /^\d{3}$/.test(code));

  if (parsed.length === 0) {
    return defaults;
  }

  return Array.from(new Set(parsed));
}

const defaultPassportTokenUrl = "https://qa.interswitchng.com/passport/oauth/token";
const defaultApiBaseUrl = isLive
  ? "https://webpay.interswitchng.com"
  : "https://qa.interswitchng.com";
const defaultWebpayBaseUrl = isLive
  ? "https://newwebpay.interswitchng.com"
  : "https://newwebpay.qa.interswitchng.com";
const defaultIdentityBaseUrl = "https://api-marketplace-routing.k8.isw.la/marketplace-routing/api/v1";
const defaultTermiiBaseUrl = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";

export const config = {
  port,
  mode,
  backendBaseUrl,
  frontendBaseUrl,
  corsAllowedOrigins: Array.from(
    new Set([
      frontendBaseUrl,
      ...parseOriginList(process.env.CORS_ALLOWED_ORIGINS)
    ])
  ),
  databaseUrl: process.env.DATABASE_URL || "",
  clientId: process.env.INTERSWITCH_CLIENT_ID || "",
  clientSecret: process.env.INTERSWITCH_CLIENT_SECRET || "",
  identityClientId: process.env.INTERSWITCH_IDENTITY_CLIENT_ID || "",
  identityClientSecret: process.env.INTERSWITCH_IDENTITY_CLIENT_SECRET || "",
  merchantCode: process.env.INTERSWITCH_MERCHANT_CODE || "",
  payItemId: process.env.INTERSWITCH_PAY_ITEM_ID || "",
  payItemName: process.env.INTERSWITCH_PAY_ITEM_NAME || "AZA Instant Payment",
  currency: process.env.INTERSWITCH_CURRENCY || "566",
  supportedCurrencies: parseSupportedCurrencyCodes(process.env.INTERSWITCH_SUPPORTED_CURRENCIES),
  passportTokenUrl:
    process.env.INTERSWITCH_PASSPORT_TOKEN_URL || defaultPassportTokenUrl,
  apiBaseUrl: process.env.INTERSWITCH_API_BASE_URL || defaultApiBaseUrl,
  webpayBaseUrl: process.env.INTERSWITCH_WEBPAY_BASE_URL || defaultWebpayBaseUrl,
  identityPassportTokenUrl:
    process.env.INTERSWITCH_IDENTITY_PASSPORT_TOKEN_URL || defaultPassportTokenUrl,
  identityBaseUrl:
    process.env.INTERSWITCH_IDENTITY_BASE_URL || defaultIdentityBaseUrl,
  identityBankListUrl:
    process.env.INTERSWITCH_IDENTITY_BANK_LIST_URL ||
    `${defaultIdentityBaseUrl}/verify/identity/account-number/bank-list`,
  identityAccountResolveUrl:
    process.env.INTERSWITCH_IDENTITY_ACCOUNT_RESOLVE_URL ||
    `${defaultIdentityBaseUrl}/verify/identity/account-number/resolve`,
  identityNinUrl:
    process.env.INTERSWITCH_IDENTITY_NIN_URL ||
    `${defaultIdentityBaseUrl}/verify/identity/nin`,
  termiiApiKey: process.env.TERMII_API_KEY || "",
  termiiBaseUrl: defaultTermiiBaseUrl,
  termiiSenderId: process.env.TERMII_SENDER_ID || "AZA",
  termiiChannel: process.env.TERMII_CHANNEL || "dnd",
  siteRedirectUrl:
    process.env.INTERSWITCH_SITE_REDIRECT_URL ||
    `${backendBaseUrl}/api/interswitch/redirect`,
  webhookSecret: process.env.INTERSWITCH_WEBHOOK_SECRET || ""
};

export function getCheckoutScriptUrl() {
  return `${config.webpayBaseUrl}/inline-checkout.js`;
}

export function getRedirectActionUrl() {
  return `${config.webpayBaseUrl}/collections/w/pay`;
}
