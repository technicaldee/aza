import { Router } from "express";
import {
  getIdentityBankList,
  resolveIdentityAccount,
  verifyNinIdentity
} from "../services/interswitch.js";
import {
  authenticateVendor,
  createVendor,
  getDashboard,
  getVendorById,
  getVendorBySlug,
  updateVendorNinVerification,
  updateVendorPayoutDetails
} from "../services/store.js";

const router = Router();

function normalizeName(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(expectedFullName, actualName) {
  const expected = normalizeName(expectedFullName);
  const actual = normalizeName(actualName);

  if (!expected || !actual) {
    return false;
  }

  if (expected === actual) {
    return true;
  }

  const expectedParts = expected.split(" ").filter(Boolean);
  return expectedParts.every((part) => actual.includes(part));
}

function extractResolvedAccount(data) {
  const accountName =
    data?.data?.accountName ||
    data?.data?.account_name ||
    data?.data?.account?.accountName ||
    data?.data?.account?.account_name ||
    data?.accountName ||
    data?.account_name ||
    "";
  const bankName =
    data?.data?.bankName ||
    data?.data?.bank_name ||
    data?.data?.bank?.name ||
    data?.bankName ||
    data?.bank_name ||
    "";

  return {
    accountName: String(accountName || "").trim(),
    bankName: String(bankName || "").trim()
  };
}

router.post("/", async (req, res, next) => {
  try {
    const required = [
      "firstName",
      "lastName",
      "businessName",
      "email",
      "password",
      "phone",
      "location",
      "category"
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

router.get("/banks", async (req, res, next) => {
  try {
    const response = await getIdentityBankList();

    if (response?.success !== true || !Array.isArray(response?.data)) {
      res.status(502).json({
        message: response?.message || "Unable to fetch bank list."
      });
      return;
    }

    res.json({
      banks: response.data
        .filter((bank) => bank?.active !== false)
        .map((bank) => ({
          code: bank.code,
          name: bank.name,
          slug: bank.slug
        }))
    });
  } catch (error) {
    next(error);
  }
});

router.post("/signin", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }

    const vendor = await authenticateVendor(email, password);

    if (!vendor) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    res.json({ vendor });
  } catch (error) {
    next(error);
  }
});

router.post("/:vendorId/verify-nin", async (req, res, next) => {
  try {
    const vendor = await getVendorById(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({ message: "Vendor not found." });
      return;
    }

    const nin = String(req.body.nin || "").trim();

    if (!nin) {
      res.status(400).json({ message: "NIN is required." });
      return;
    }

    const verification = await verifyNinIdentity({
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      nin
    });

    const ninCheck = verification?.data?.summary?.nin_check;
    const verified =
      verification?.success === true &&
      verification?.data?.ninStatus?.status === "verified" &&
      (ninCheck?.status === "EXACT_MATCH" ||
        (ninCheck?.fieldMatches?.firstname === true &&
          ninCheck?.fieldMatches?.lastname === true));

    if (!verified) {
      res.status(400).json({
        message:
          verification?.message ||
          "NIN verification failed. Ensure the NIN matches the first and last name used at signup.",
        verification
      });
      return;
    }

    const updatedVendor = await updateVendorNinVerification(vendor.id, {
      nin,
      ninVerified: true,
      ninStatus: verification?.data?.ninStatus?.status || "verified",
      ninVerifiedAt: new Date().toISOString(),
      firstName: vendor.firstName,
      lastName: vendor.lastName
    });

    res.json({
      vendor: updatedVendor,
      verification
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:vendorId/resolve-account", async (req, res, next) => {
  try {
    const vendor = await getVendorById(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({ message: "Vendor not found." });
      return;
    }

    const bankCode = String(req.body.bankCode || "").trim();
    const accountNumber = String(req.body.accountNumber || "").trim();

    if (!bankCode || !accountNumber) {
      res.status(400).json({ message: "bankCode and accountNumber are required." });
      return;
    }

    const resolution = await resolveIdentityAccount({
      bankCode,
      accountNumber
    });
    const resolved = extractResolvedAccount(resolution);
    const matchesSignupName = namesMatch(vendor.fullName, resolved.accountName);

    if (!resolved.accountName) {
      res.status(400).json({
        message: resolution?.message || "Could not resolve account name.",
        resolution
      });
      return;
    }

    res.json({
      accountName: resolved.accountName,
      bankName: resolved.bankName || String(req.body.bankName || "").trim(),
      bankCode,
      accountNumber,
      matchesSignupName,
      resolution
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:vendorId/payout-details", async (req, res, next) => {
  try {
    const required = ["bankCode", "accountNumber"];
    const missing = required.filter((field) => !req.body[field]);

    if (missing.length) {
      res.status(400).json({
        message: `Missing required fields: ${missing.join(", ")}`
      });
      return;
    }

    const vendor = await getVendorById(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({ message: "Vendor not found." });
      return;
    }

    if (!vendor.ninVerified) {
      res.status(400).json({ message: "Complete NIN verification before adding payout details." });
      return;
    }

    const resolution = await resolveIdentityAccount({
      bankCode: req.body.bankCode,
      accountNumber: req.body.accountNumber
    });
    const resolved = extractResolvedAccount(resolution);

    if (!resolved.accountName) {
      res.status(400).json({
        message: resolution?.message || "Could not resolve account name.",
        resolution
      });
      return;
    }

    if (!namesMatch(vendor.fullName, resolved.accountName)) {
      res.status(400).json({
        message: "Account name must match the signup name before payout details can be saved.",
        resolution
      });
      return;
    }

    const updatedVendor = await updateVendorPayoutDetails(req.params.vendorId, {
      bankCode: String(req.body.bankCode || "").trim(),
      bankName: resolved.bankName || String(req.body.bankName || "").trim(),
      accountNumber: String(req.body.accountNumber || "").trim(),
      accountName: resolved.accountName
    });

    res.json({ vendor: updatedVendor });
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
