import { Router } from "express";
import { requeryTransaction } from "../services/interswitch.js";
import {
  createPayment,
  getPaymentByTransactionRef,
  getVendorBySlug
} from "../services/store.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { merchantSlug, amount, channel, payerName, note } = req.body;

    if (!merchantSlug || !amount || !channel) {
      res.status(400).json({
        message: "merchantSlug, amount, and channel are required."
      });
      return;
    }

    const vendor = await getVendorBySlug(merchantSlug);

    if (!vendor) {
      res.status(404).json({ message: "Merchant not found." });
      return;
    }

    const payment = await createPayment({
      vendorId: vendor.id,
      merchantSlug,
      amount,
      channel,
      payerName,
      note
    });

    res.status(201).json({ payment, vendor });
  } catch (error) {
    next(error);
  }
});

router.post("/verify-inline", async (req, res, next) => {
  try {
    const { merchantSlug, txnRef, amountMinor, payerName, note } = req.body;

    if (!merchantSlug || !txnRef || !amountMinor) {
      res.status(400).json({
        message: "merchantSlug, txnRef, and amountMinor are required."
      });
      return;
    }

    const vendor = await getVendorBySlug(merchantSlug);

    if (!vendor) {
      res.status(404).json({ message: "Merchant not found." });
      return;
    }

    const existingPayment = await getPaymentByTransactionRef(txnRef);

    if (existingPayment) {
      res.json({
        payment: existingPayment,
        vendor,
        verification: { reused: true }
      });
      return;
    }

    const verification = await requeryTransaction({
      txnRef,
      amount: amountMinor
    });

    if (
      verification?.ResponseCode !== "00" ||
      Number(verification?.Amount) !== Number(amountMinor)
    ) {
      res.status(400).json({
        message: verification?.ResponseDescription || "Payment could not be verified.",
        verification
      });
      return;
    }

    const payment = await createPayment({
      vendorId: vendor.id,
      merchantSlug,
      transactionRef: txnRef,
      paymentReference: verification?.PaymentReference,
      retrievalReferenceNumber: verification?.RetrievalReferenceNumber,
      amount: Number(verification.Amount) / 100,
      channel: "QUICKTELLER_INLINE",
      payerName,
      note,
      providerResponseCode: verification?.ResponseCode,
      providerResponseDescription: verification?.ResponseDescription
    });

    res.status(201).json({ payment, vendor, verification });
  } catch (error) {
    next(error);
  }
});

export default router;
