import { config } from "../config.js";

function ensureResponseOk(response, data) {
  if (response.ok && (data?.code === "ok" || data?.message === "Successfully Sent" || data?.message_id)) {
    return;
  }

  const error = new Error(data?.message || data?.error || "Termii SMS request failed.");
  error.statusCode = response.status || 500;
  error.details = data;
  throw error;
}

function normalizePhoneNumber(phoneNumber) {
  const digits = String(phoneNumber || "").replace(/\D+/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("234")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `234${digits.slice(1)}`;
  }

  return digits;
}

export async function sendSoundDeviceSms({ to, message }) {
  if (!config.termiiApiKey) {
    throw new Error("Missing TERMII_API_KEY.");
  }

  const normalizedPhone = normalizePhoneNumber(to);

  if (!normalizedPhone) {
    throw new Error("A valid sound device phone number is required.");
  }

  const payload = {
    api_key: config.termiiApiKey,
    to: normalizedPhone,
    from: config.termiiSenderId,
    sms: message,
    type: "plain",
    channel: config.termiiChannel
  };

  const response = await fetch(`${config.termiiBaseUrl}/api/sms/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  ensureResponseOk(response, data);

  return {
    ...data,
    to: normalizedPhone
  };
}

export function formatSoundDevicePhone(phoneNumber) {
  return normalizePhoneNumber(phoneNumber);
}
