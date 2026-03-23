import crypto from "node:crypto";
import { config, getCheckoutScriptUrl, getRedirectActionUrl } from "../config.js";

const tokenCache = {
  accessToken: "",
  expiresAt: 0,
  claims: null
};

function ensureResponseOk(response, data) {
  if (response.ok) {
    return;
  }

  const message =
    data?.error_description ||
    data?.message ||
    data?.ResponseDescription ||
    "Interswitch request failed";
  const error = new Error(message);
  error.statusCode = response.status;
  error.details = data;
  throw error;
}

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function parseJwtClaims(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

function buildBasicAuth() {
  return Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
}

async function parseJson(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function interswitchRequest(url, options = {}) {
  const response = await fetch(url, options);
  const data = await parseJson(response);
  ensureResponseOk(response, data);
  return data;
}

export async function getAccessToken(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && tokenCache.accessToken && now < tokenCache.expiresAt) {
    return {
      accessToken: tokenCache.accessToken,
      claims: tokenCache.claims
    };
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error("Missing INTERSWITCH_CLIENT_ID or INTERSWITCH_CLIENT_SECRET.");
  }

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const data = await interswitchRequest(config.passportTokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${buildBasicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const accessToken = data?.access_token || "";
  const expiresIn = Number(data?.expires_in || 0);
  const claims = parseJwtClaims(accessToken);

  tokenCache.accessToken = accessToken;
  tokenCache.claims = claims;
  tokenCache.expiresAt = now + Math.max(expiresIn - 60, 30) * 1000;

  return { accessToken, claims };
}

export async function resolveMerchantCode() {
  if (config.merchantCode) {
    return config.merchantCode;
  }

  const { claims } = await getAccessToken();
  return claims?.merchant_code || "";
}

export async function getPublicConfig() {
  let derivedMerchantCode = config.merchantCode;

  if (!derivedMerchantCode && config.clientId && config.clientSecret) {
    try {
      derivedMerchantCode = await resolveMerchantCode();
    } catch {
      derivedMerchantCode = "";
    }
  }

  const missingFields = [];

  if (!derivedMerchantCode) {
    missingFields.push("INTERSWITCH_MERCHANT_CODE");
  }

  if (!config.payItemId) {
    missingFields.push("INTERSWITCH_PAY_ITEM_ID");
  }

  return {
    mode: config.mode,
    currency: config.currency,
    merchantCode: derivedMerchantCode,
    payItemId: config.payItemId,
    payItemName: config.payItemName,
    siteRedirectUrl: config.siteRedirectUrl,
    checkoutScriptUrl: getCheckoutScriptUrl(),
    redirectActionUrl: getRedirectActionUrl(),
    checkoutReady: missingFields.length === 0,
    missingFields
  };
}

export async function requeryTransaction({ txnRef, amount, merchantCode }) {
  const resolvedMerchantCode = merchantCode || (await resolveMerchantCode());

  if (!txnRef || !amount) {
    throw new Error("txnRef and amount are required for requery.");
  }

  if (!resolvedMerchantCode) {
    throw new Error("Merchant code is required to requery a transaction.");
  }

  const url = new URL("/collections/api/v1/gettransaction.json", config.apiBaseUrl);
  url.searchParams.set("merchantcode", resolvedMerchantCode);
  url.searchParams.set("transactionreference", txnRef);
  url.searchParams.set("amount", String(amount));

  return interswitchRequest(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
}

async function authenticatedPost(pathname, payload) {
  const { accessToken } = await getAccessToken();
  return interswitchRequest(`${config.apiBaseUrl}${pathname}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function initializeWalletPayment(payload) {
  return authenticatedPost("/collections/api/v1/wallet-pay/initialize", payload);
}

export async function getWalletPaymentStatus(payload) {
  return authenticatedPost("/collections/api/v1/wallet-pay/status", payload);
}

export async function createStaticVirtualAccount(payload) {
  const merchantCode = payload.merchantCode || (await resolveMerchantCode());

  if (!merchantCode) {
    throw new Error("Merchant code is required to generate a virtual account.");
  }

  return authenticatedPost("/paymentgateway/api/v1/payable/virtualaccount", {
    accountName: payload.accountName,
    merchantCode,
    ...(payload.provider ? { provider: payload.provider } : {})
  });
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!config.webhookSecret) {
    return {
      verified: false,
      skipped: true
    };
  }

  if (!signature || !rawBody) {
    return {
      verified: false,
      skipped: false
    };
  }

  const expected = crypto
    .createHmac("sha512", config.webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return {
      verified: false,
      skipped: false
    };
  }

  return {
    verified: crypto.timingSafeEqual(expectedBuffer, signatureBuffer),
    skipped: false
  };
}
