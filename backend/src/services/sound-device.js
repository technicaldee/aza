import { renderSoundDeviceMessage } from "../translations/sound-device/index.js";
import { sendSoundDeviceSms } from "./termii.js";

function formatAmountForSpeech(amount) {
  const numericAmount = Number(amount || 0);

  if (Number.isInteger(numericAmount)) {
    return String(numericAmount);
  }

  return numericAmount.toFixed(2);
}

export async function notifySoundDevice({ vendor, payment }) {
  if (!vendor?.soundDevicePhone) {
    return {
      sent: false,
      reason: "not_synced"
    };
  }

  const message = renderSoundDeviceMessage(vendor.voiceLanguage, "payment_received", {
    amount: formatAmountForSpeech(payment.amount),
    payerName: payment.payerName || "Customer"
  });

  const result = await sendSoundDeviceSms({
    to: vendor.soundDevicePhone,
    message
  });

  return {
    sent: true,
    message,
    provider: "termii",
    result
  };
}
