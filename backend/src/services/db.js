import { Pool } from "pg";
import { config } from "../config.js";

if (!config.databaseUrl) {
  throw new Error("Missing DATABASE_URL in backend env.");
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  enableChannelBinding: true
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      business_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      category TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_name TEXT NOT NULL,
      voice_language TEXT NOT NULL DEFAULT 'English',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY,
      vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      merchant_slug TEXT NOT NULL,
      transaction_ref TEXT UNIQUE,
      payment_reference TEXT,
      retrieval_reference_number TEXT,
      payer_name TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      channel TEXT NOT NULL,
      provider_response_code TEXT,
      provider_response_description TEXT,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS transaction_ref TEXT UNIQUE;
  `);

  await query(`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS payment_reference TEXT;
  `);

  await query(`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS retrieval_reference_number TEXT;
  `);

  await query(`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS provider_response_code TEXT;
  `);

  await query(`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS provider_response_description TEXT;
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_payments_vendor_created_at
    ON payments(vendor_id, created_at DESC);
  `);
}
