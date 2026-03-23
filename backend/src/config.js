import dotenv from "dotenv";

dotenv.config();

const mode = (process.env.INTERSWITCH_MODE || "TEST").toUpperCase();
const port = Number(process.env.PORT || 4000);
const backendBaseUrl = process.env.BACKEND_BASE_URL || `http://localhost:${port}`;
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";

export const config = {
  port,
  mode,
  backendBaseUrl,
  frontendBaseUrl,
  databaseUrl: process.env.DATABASE_URL || "",
  clientId: process.env.INTERSWITCH_CLIENT_ID || "",
  clientSecret: process.env.INTERSWITCH_CLIENT_SECRET || "",
  merchantCode: process.env.INTERSWITCH_MERCHANT_CODE || "",
  payItemId: process.env.INTERSWITCH_PAY_ITEM_ID || "",
  payItemName: process.env.INTERSWITCH_PAY_ITEM_NAME || "AZA Instant Payment",
  currency: process.env.INTERSWITCH_CURRENCY || "566",
  passportTokenUrl:
    process.env.INTERSWITCH_PASSPORT_TOKEN_URL ||
    "https://qa.interswitchng.com/passport/oauth/token",
  apiBaseUrl:
    process.env.INTERSWITCH_API_BASE_URL || "https://qa.interswitchng.com",
  webpayBaseUrl:
    process.env.INTERSWITCH_WEBPAY_BASE_URL ||
    "https://newwebpay.qa.interswitchng.com",
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
