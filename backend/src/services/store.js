import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "../../data");
const dbFile = resolve(dataDir, "db.json");

const initialDb = {
  vendors: [],
  payments: []
};

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dbFile, "utf8");
  } catch {
    await writeFile(dbFile, JSON.stringify(initialDb, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const content = await readFile(dbFile, "utf8");
  return JSON.parse(content);
}

async function writeDb(db) {
  await ensureDb();
  await writeFile(dbFile, JSON.stringify(db, null, 2));
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function createUniqueSlug(seed, vendors) {
  const base = slugify(seed) || "aza-vendor";
  let slug = base;
  let counter = 2;

  while (vendors.some((vendor) => vendor.slug === slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

export async function createVendor(payload) {
  const db = await readDb();
  const vendor = {
    id: crypto.randomUUID(),
    slug: createUniqueSlug(payload.businessName || payload.fullName, db.vendors),
    fullName: payload.fullName,
    businessName: payload.businessName,
    email: payload.email,
    phone: payload.phone,
    location: payload.location,
    category: payload.category,
    bankName: payload.bankName,
    accountNumber: payload.accountNumber,
    accountName: payload.accountName,
    voiceLanguage: payload.voiceLanguage || "English",
    createdAt: new Date().toISOString()
  };

  db.vendors.push(vendor);
  await writeDb(db);
  return vendor;
}

export async function getVendorById(vendorId) {
  const db = await readDb();
  return db.vendors.find((vendor) => vendor.id === vendorId) || null;
}

export async function getVendorBySlug(slug) {
  const db = await readDb();
  return db.vendors.find((vendor) => vendor.slug === slug) || null;
}

export async function listPaymentsForVendor(vendorId) {
  const db = await readDb();
  return db.payments
    .filter((payment) => payment.vendorId === vendorId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createPayment(payload) {
  const db = await readDb();
  const payment = {
    id: crypto.randomUUID(),
    vendorId: payload.vendorId,
    merchantSlug: payload.merchantSlug,
    payerName: payload.payerName || "Customer",
    amount: Number(payload.amount),
    channel: payload.channel,
    status: payload.status || "COMPLETED",
    note: payload.note || "",
    createdAt: new Date().toISOString()
  };

  db.payments.push(payment);
  await writeDb(db);
  return payment;
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
      averageTicket: payments.length ? Math.round(totalVolume / payments.length) : 0
    },
    payments
  };
}
