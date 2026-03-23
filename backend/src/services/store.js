import crypto from "node:crypto";
import { query } from "./db.js";

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

  return {
    id: row.id,
    slug: row.slug,
    fullName: row.full_name,
    businessName: row.business_name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    category: row.category,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountName: row.account_name,
    voiceLanguage: row.voice_language,
    createdAt: row.created_at
  };
}

function mapPayment(row) {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    merchantSlug: row.merchant_slug,
    payerName: row.payer_name,
    amount: Number(row.amount),
    channel: row.channel,
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
  const vendor = {
    id: crypto.randomUUID(),
    slug: await createUniqueSlug(payload.businessName || payload.fullName),
    fullName: payload.fullName,
    businessName: payload.businessName,
    email: payload.email,
    phone: payload.phone,
    location: payload.location,
    category: payload.category,
    bankName: payload.bankName,
    accountNumber: payload.accountNumber,
    accountName: payload.accountName,
    voiceLanguage: payload.voiceLanguage || "English"
  };

  const result = await query(
    `
      INSERT INTO vendors (
        id, slug, full_name, business_name, email, phone, location, category,
        bank_name, account_number, account_name, voice_language
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `,
    [
      vendor.id,
      vendor.slug,
      vendor.fullName,
      vendor.businessName,
      vendor.email,
      vendor.phone,
      vendor.location,
      vendor.category,
      vendor.bankName,
      vendor.accountNumber,
      vendor.accountName,
      vendor.voiceLanguage
    ]
  );

  return mapVendor(result.rows[0]);
}

export async function getVendorById(vendorId) {
  const result = await query("SELECT * FROM vendors WHERE id = $1 LIMIT 1", [vendorId]);
  return mapVendor(result.rows[0]);
}

export async function getVendorBySlug(slug) {
  const result = await query("SELECT * FROM vendors WHERE slug = $1 LIMIT 1", [slug]);
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
        id, vendor_id, merchant_slug, payer_name, amount, channel, status, note
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `,
    [
      crypto.randomUUID(),
      payload.vendorId,
      payload.merchantSlug,
      payload.payerName || "Customer",
      Number(payload.amount),
      payload.channel,
      payload.status || "COMPLETED",
      payload.note || ""
    ]
  );

  return mapPayment(result.rows[0]);
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
