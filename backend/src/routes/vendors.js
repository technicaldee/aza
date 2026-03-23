import { Router } from "express";
import {
  createVendor,
  getDashboard,
  getVendorById,
  getVendorBySlug
} from "../services/store.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const required = [
      "fullName",
      "businessName",
      "email",
      "phone",
      "location",
      "category",
      "bankName",
      "accountNumber",
      "accountName"
    ];
    const missing = required.filter((field) => !req.body[field]);

    if (missing.length) {
      res.status(400).json({
        message: `Missing required fields: ${missing.join(", ")}`
      });
      return;
    }

    const vendor = await createVendor(req.body);
    res.status(201).json({ vendor });
  } catch (error) {
    next(error);
  }
});

router.get("/public/:slug", async (req, res, next) => {
  try {
    const vendor = await getVendorBySlug(req.params.slug);

    if (!vendor) {
      res.status(404).json({ message: "Merchant not found." });
      return;
    }

    res.json({
      id: vendor.id,
      slug: vendor.slug,
      fullName: vendor.fullName,
      businessName: vendor.businessName,
      location: vendor.location,
      category: vendor.category,
      voiceLanguage: vendor.voiceLanguage
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:vendorId/dashboard", async (req, res, next) => {
  try {
    const dashboard = await getDashboard(req.params.vendorId);

    if (!dashboard) {
      res.status(404).json({ message: "Vendor not found." });
      return;
    }

    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

router.get("/:vendorId", async (req, res, next) => {
  try {
    const vendor = await getVendorById(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({ message: "Vendor not found." });
      return;
    }

    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

export default router;
