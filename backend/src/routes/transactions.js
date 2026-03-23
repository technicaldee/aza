import { Router } from "express";
import { config } from "../config.js";
import { requeryTransaction } from "../services/interswitch.js";

const router = Router();

function buildFrontendResponseUrl(params) {
  const url = new URL("/payment-response.html", config.frontendBaseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

router.post("/transactions/requery", async (req, res, next) => {
  try {
    const txnRef = req.body.txnRef || req.body.txnref;
    const amount = req.body.amount;
    const merchantCode = req.body.merchantCode;
    const data = await requeryTransaction({ txnRef, amount, merchantCode });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/transactions/requery", async (req, res, next) => {
  try {
    const txnRef = req.query.txnRef || req.query.txnref;
    const amount = req.query.amount;
    const merchantCode = req.query.merchantCode;
    const data = await requeryTransaction({ txnRef, amount, merchantCode });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/interswitch/redirect", async (req, res, next) => {
  try {
    const txnRef = req.body.txnref;
    const amount = req.body.amount;
    const redirectResponseCode = req.body.resp;
    const redirectDescription = req.body.desc;
    const retRef = req.body.retRef;

    const verification = await requeryTransaction({
      txnRef,
      amount
    });

    const amountMatches = Number(verification?.Amount) === Number(amount);
    const verified = verification?.ResponseCode === "00" && amountMatches;

    res.redirect(
      303,
      buildFrontendResponseUrl({
        txnref: txnRef,
        amount: verification?.Amount || amount,
        verified,
        responseCode: verification?.ResponseCode,
        responseDescription: verification?.ResponseDescription,
        merchantReference: verification?.MerchantReference,
        paymentReference: verification?.PaymentReference,
        retrievalReferenceNumber: verification?.RetrievalReferenceNumber || retRef,
        redirectResponseCode,
        redirectDescription
      })
    );
  } catch (error) {
    res.redirect(
      303,
      buildFrontendResponseUrl({
        verified: false,
        error: error.message,
        txnref: req.body.txnref,
        amount: req.body.amount
      })
    );
    console.error("Redirect verification failed:", error);
  }
});

export default router;
