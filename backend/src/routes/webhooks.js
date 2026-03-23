import { Router } from "express";
import { verifyWebhookSignature } from "../services/interswitch.js";

const router = Router();

router.post("/interswitch", async (req, res) => {
  const signature = req.get("X-Interswitch-Signature");
  const verification = verifyWebhookSignature(req.rawBody, signature);

  if (!verification.skipped && !verification.verified) {
    console.warn("Rejected webhook: invalid X-Interswitch-Signature");
    res.sendStatus(200);
    return;
  }

  console.log("Webhook received:", JSON.stringify(req.body));
  res.sendStatus(200);
});

export default router;
