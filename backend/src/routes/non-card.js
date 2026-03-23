import { Router } from "express";
import {
  createStaticVirtualAccount,
  getWalletPaymentStatus,
  initializeWalletPayment
} from "../services/interswitch.js";

const router = Router();

router.post("/wallet/initialize", async (req, res, next) => {
  try {
    const data = await initializeWalletPayment(req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/wallet/status", async (req, res, next) => {
  try {
    const data = await getWalletPaymentStatus(req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/virtual-accounts", async (req, res, next) => {
  try {
    const data = await createStaticVirtualAccount(req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
