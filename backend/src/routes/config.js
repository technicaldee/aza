import { Router } from "express";
import { getAccessToken, getPublicConfig } from "../services/interswitch.js";

const router = Router();

router.get("/public", async (req, res, next) => {
  try {
    const data = await getPublicConfig();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/token", async (req, res, next) => {
  try {
    const { accessToken, claims } = await getAccessToken(true);
    res.json({
      accessToken,
      claims
    });
  } catch (error) {
    next(error);
  }
});

export default router;
