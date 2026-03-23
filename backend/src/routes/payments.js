import { Router } from "express";
import { createPayment, getVendorBySlug } from "../services/store.js";

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

export default router;
