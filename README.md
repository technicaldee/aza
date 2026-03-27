# AZA

AZA is a UPI-inspired payment experience built for Nigeria, focused on transporters and small businesses that need fast, trustworthy payment confirmation.

Customers can pay through a simple AZA link (QR/link flow), and vendors get immediate confirmation through the app and optional voice hardware.

## Hackathon Story

We are inspired by India's UPI and are replicating that accessibility model for Nigeria:

- frictionless payment acceptance for everyday merchants
- faster trust at point-of-sale with instant confirmation
- lightweight hardware for offline-like confidence while moving

AZA is designed for keke riders, transport operators, and small businesses that cannot afford payment ambiguity.

### Cross-Border Example

If I visit Ghana and do not have cedis, I can still pay for transportation using AZA from my naira card/account, and the vendor receives in their local currency (based on supported Interswitch currencies).

## How AZA Works

1. Vendor signs up and gets a unique payment link.
2. Vendor shares link/QR with customers.
3. Customer opens the pay screen, enters amount, and chooses currency.
4. Payment is processed via Interswitch.
5. Backend verifies payment and records transaction.
6. Vendor receives confirmation in dashboard and on sound hardware.

## Sound Hardware (Core Differentiator)

AZA includes a simple hardware flow for voice confirmation:

- the device has a SIM and runs the Python module in `sound_machine/sms_reader.py`
- Termii sends SMS alerts after verified payments
- the device reads only SMS from the official configured sender ID
- audio can play through the device speaker or any affordable mini speaker via AUX

The external speaker is optional. The key value is reliable spoken confirmation.

## Key Features

- Vendor onboarding and dashboard
- Mandatory NIN verification step for trust/compliance flow
- Public pay page per merchant slug
- Multi-currency checkout (default NGN, configurable supported currencies for Interswitch)
- Payment verification using server-side Interswitch requery
- Termii-powered SMS notification pipeline for sound device playback
- Payment history and merchant data stored in Postgres

## Tech Stack

- Frontend: Vite + vanilla JS + Tailwind
- Backend: Node.js + Express
- Database: Postgres
- Payments: Interswitch
- Messaging: Termii
- Device runtime: Python (`sound_machine`)

## Team Contributions

This section is included for hackathon submission compliance (technical and non-technical contributions).

- **Edidiong Udoh** ([github.com/technicaldee](https://github.com/technicaldee))
  - built the application codebase (frontend, backend, payment and verification flows)
  - integrated deployment and shipped the hosted environment
  - implemented device/SMS integration logic across the platform
- **Inimfon Udoh** ([github.com/innie4](https://github.com/innie4))
  - designed the product direction and user experience
  - created design mockups and visual flow
  - defined interaction flow across merchant and customer journeys

## Local Setup

```bash
npm install
cp backend/.env.example backend/.env
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Sandbox Test Credentials and Rules

For demo/testing in Interswitch test mode:

- Signup must use:
  - First name: `Bunch`
  - Last name: `Dillon`
- Identity verification test value:
  - `63184876213`
- Quick login:
  - Email: `edidiong.udoh@pintoptechnologies.com`
  - Password: `Test1234`

Any deviation from these sandbox values may fail during test verification as we are using test mode for nin verificattion

## Environment Notes

Core backend variables:

- `DATABASE_URL`
- `INTERSWITCH_CLIENT_ID`
- `INTERSWITCH_CLIENT_SECRET`
- `INTERSWITCH_PAY_ITEM_ID`
- `INTERSWITCH_CURRENCY` (default currency code, NGN is `566`)
- `INTERSWITCH_SUPPORTED_CURRENCIES` (comma-separated numeric codes, for pay screen selector)
- `INTERSWITCH_SITE_REDIRECT_URL`
- `TERMII_API_KEY`
- `TERMII_SENDER_ID`

## Deployment

Deploy as two Vercel projects from this monorepo:

- frontend root: `frontend/`
- backend root: `backend/`

Set frontend `VITE_API_BASE_URL` to backend `/api` URL, then configure backend env variables for Interswitch, Postgres, and Termii.

## API Highlights

- `GET /api/config/public`
- `POST /api/vendors`
- `GET /api/vendors/public/:slug`
- `POST /api/payments/verify-inline`
- `POST /api/interswitch/redirect`
- `POST /api/webhooks/interswitch`

## References

- [Interswitch Web Checkout](https://docs.interswitchgroup.com/docs/web-checkout)
- [Interswitch Authentication](https://docs.interswitchgroup.com/docs/authentication)
- [Interswitch Non-Card Payments](https://docs.interswitchgroup.com/docs/non-card-payments)
- [Termii Messaging API](https://developers.termii.com/messaging-api)
