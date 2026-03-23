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
      first_name TEXT,
      last_name TEXT,
      full_name TEXT NOT NULL,
      business_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      category TEXT NOT NULL,
      bank_code TEXT,
      bank_name TEXT,
      account_number TEXT,
      account_name TEXT,
      password_hash TEXT,
      nin TEXT,
      nin_verified BOOLEAN NOT NULL DEFAULT FALSE,
      nin_status TEXT NOT NULL DEFAULT 'PENDING',
      nin_verified_at TIMESTAMPTZ,
      voice_language TEXT NOT NULL DEFAULT 'English',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    ALTER TABLE vendors
    ALTER COLUMN bank_name DROP NOT NULL;
  `);

  await query(`
    ALTER TABLE vendors
    ALTER COLUMN account_number DROP NOT NULL;
  `);

  await query(`
    ALTER TABLE vendors
    ALTER COLUMN account_name DROP NOT NULL;
  `);

  await query(`
    ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS password_hash TEXT;
  `);

  await query(`
    ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS first_name TEXT;
  `);

  await query(`
    ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS last_name TEXT;
  `);

  await query(`
    ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS bank_code TEXT;
  `);

  await query(`
    ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS nin TEXT;
  `);

  await query(`
    ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS nin_verified BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  await query(`
    ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS nin_status TEXT NOT NULL DEFAULT 'PENDING';
  `);

  await query(`
    ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS nin_verified_at TIMESTAMPTZ;
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
