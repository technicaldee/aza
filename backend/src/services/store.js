import crypto from "node:crypto";
import { query } from "./db.js";
import { hashPassword, verifyPassword } from "./passwords.js";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function mapVendor(row) {
  if (!row) {
    return null;
  }

  const firstName = row.first_name || String(row.full_name || "").split(" ")[0] || "";
  const lastName =
    row.last_name ||
    String(row.full_name || "")
      .split(" ")
      .slice(1)
      .join(" ");

  return {
    id: row.id,
    slug: row.slug,
    firstName,
    lastName,
    fullName: row.full_name,
    businessName: row.business_name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    category: row.category,
    bankCode: row.bank_code,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountName: row.account_name,
    nin: row.nin,
    ninVerified: Boolean(row.nin_verified),
    ninStatus: row.nin_status,
    ninVerifiedAt: row.nin_verified_at,
    voiceLanguage: row.voice_language,
    createdAt: row.created_at
  };
}

function mapPayment(row) {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    merchantSlug: row.merchant_slug,
    transactionRef: row.transaction_ref,
    paymentReference: row.payment_reference,
    retrievalReferenceNumber: row.retrieval_reference_number,
    payerName: row.payer_name,
    amount: Number(row.amount),
    channel: row.channel,
    providerResponseCode: row.provider_response_code,
    providerResponseDescription: row.provider_response_description,
    status: row.status,
    note: row.note,
    createdAt: row.created_at
  };
}

async function slugExists(slug) {
  const result = await query("SELECT 1 FROM vendors WHERE slug = $1 LIMIT 1", [slug]);
  return result.rowCount > 0;
}

async function createUniqueSlug(seed) {
  const base = slugify(seed) || "aza-vendor";
  let slug = base;
  let counter = 2;

  while (await slugExists(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

export async function createVendor(payload) {
  const existingVendor = await getVendorByEmail(payload.email);

  if (existingVendor) {
    const error = new Error("A vendor with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const vendor = {
    id: crypto.randomUUID(),
    slug: await createUniqueSlug(payload.businessName || payload.fullName),
    firstName: String(payload.firstName || "").trim(),
    lastName: String(payload.lastName || "").trim(),
    fullName: `${String(payload.firstName || "").trim()} ${String(payload.lastName || "").trim()}`.trim(),
    businessName: payload.businessName,
    email: String(payload.email || "").trim().toLowerCase(),
    phone: payload.phone,
    location: payload.location,
    category: payload.category,
    bankCode: payload.bankCode || null,
    bankName: payload.bankName || null,
    accountNumber: payload.accountNumber || null,
    accountName: payload.accountName || null,
    passwordHash: await hashPassword(payload.password),
    nin: null,
    ninVerified: false,
    ninStatus: "PENDING",
    voiceLanguage: payload.voiceLanguage || "English"
  };

  const result = await query(
    `
      INSERT INTO vendors (
        id, slug, first_name, last_name, full_name, business_name, email, phone,
        location, category, bank_code, bank_name, account_number, account_name,
        password_hash, nin, nin_verified, nin_status, voice_language
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *
    `,
    [
      vendor.id,
      vendor.slug,
      vendor.firstName,
      vendor.lastName,
      vendor.fullName,
      vendor.businessName,
      vendor.email,
      vendor.phone,
      vendor.location,
      vendor.category,
      vendor.bankCode,
      vendor.bankName,
      vendor.accountNumber,
      vendor.accountName,
      vendor.passwordHash,
      vendor.nin,
      vendor.ninVerified,
      vendor.ninStatus,
      vendor.voiceLanguage
    ]
  );

  return mapVendor(result.rows[0]);
}

export async function getVendorById(vendorId) {
  const result = await query("SELECT * FROM vendors WHERE id = $1 LIMIT 1", [vendorId]);
  return mapVendor(result.rows[0]);
}

export async function getVendorByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const result = await query(
    "SELECT * FROM vendors WHERE LOWER(email) = $1 LIMIT 1",
    [normalizedEmail]
  );
  return mapVendor(result.rows[0]);
}

export async function authenticateVendor(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const result = await query(
    "SELECT * FROM vendors WHERE LOWER(email) = $1 LIMIT 1",
    [normalizedEmail]
  );
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  const isValid = await verifyPassword(password, row.password_hash);

  if (!isValid) {
    return null;
  }

  return mapVendor(row);
}

export async function getVendorBySlug(slug) {
  const result = await query("SELECT * FROM vendors WHERE slug = $1 LIMIT 1", [slug]);
  return mapVendor(result.rows[0]);
}

export async function updateVendorPayoutDetails(vendorId, payload) {
  const result = await query(
    `
      UPDATE vendors
      SET bank_code = $2,
          bank_name = $3,
          account_number = $4,
          account_name = $5
      WHERE id = $1
      RETURNING *
    `,
    [vendorId, payload.bankCode, payload.bankName, payload.accountNumber, payload.accountName]
  );

  return mapVendor(result.rows[0]);
}

export async function updateVendorNinVerification(vendorId, payload) {
  const result = await query(
    `
      UPDATE vendors
      SET nin = $2,
          nin_verified = $3,
          nin_status = $4,
          nin_verified_at = $5,
          first_name = COALESCE(first_name, $6),
          last_name = COALESCE(last_name, $7)
      WHERE id = $1
      RETURNING *
    `,
    [
      vendorId,
      payload.nin,
      payload.ninVerified,
      payload.ninStatus,
      payload.ninVerifiedAt || null,
      payload.firstName || null,
      payload.lastName || null
    ]
  );

  return mapVendor(result.rows[0]);
}

export async function listPaymentsForVendor(vendorId) {
  const result = await query(
    "SELECT * FROM payments WHERE vendor_id = $1 ORDER BY created_at DESC",
    [vendorId]
  );
  return result.rows.map(mapPayment);
}

export async function createPayment(payload) {
  const result = await query(
    `
      INSERT INTO payments (
        id, vendor_id, merchant_slug, transaction_ref, payment_reference,
        retrieval_reference_number, payer_name, amount, channel,
        provider_response_code, provider_response_description, status, note
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `,
    [
      crypto.randomUUID(),
      payload.vendorId,
      payload.merchantSlug,
      payload.transactionRef || null,
      payload.paymentReference || null,
      payload.retrievalReferenceNumber || null,
      payload.payerName || "Customer",
      Number(payload.amount),
      payload.channel,
      payload.providerResponseCode || null,
      payload.providerResponseDescription || null,
      payload.status || "COMPLETED",
      payload.note || ""
    ]
  );

  return mapPayment(result.rows[0]);
}

export async function getPaymentByTransactionRef(transactionRef) {
  const result = await query(
    "SELECT * FROM payments WHERE transaction_ref = $1 LIMIT 1",
    [transactionRef]
  );
  return result.rows[0] ? mapPayment(result.rows[0]) : null;
}

export async function getDashboard(vendorId) {
  const vendor = await getVendorById(vendorId);

  if (!vendor) {
    return null;
  }

  const payments = await listPaymentsForVendor(vendorId);
  const totalVolume = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return {
    vendor,
    stats: {
      totalTransactions: payments.length,
      totalVolume,
      averageTicket: payments.length ? totalVolume / payments.length : 0
    },
    payments
  };
}
