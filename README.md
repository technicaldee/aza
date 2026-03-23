# AZA Web Checkout Demo

This repo is split into a separate `frontend/` and `backend/` so you can keep the merchant-facing experience isolated from the server-side Interswitch verification, checkout work, and Postgres-backed merchant data.

## What is included

- A landing page based on your AZA mockup
- A vendor signup page that persists merchant records in Postgres
- A mandatory post-signup NIN verification step before dashboard access
- A live vendor dashboard page based on your mockup
- A dashboard banner for syncing a sound device phone number
- A clean merchant payment page opened by merchant slug
- A backend that stores signup data and payment history in Postgres
- Translated sound-device SMS alerts sent through Termii after successful payments
- A `sound_machine/` device module that watches SMS and reads messages out loud
- Existing Interswitch helper routes for:
  - inline checkout
  - web redirect checkout
  - server-side transaction requery
  - wallet initialize and status checks
  - static transfer account generation
- A verified payment response page for redirect returns
- An Express backend that keeps the client secret off the frontend

## Project structure

```text
.
├── backend
│   ├── .env.example
│   ├── package.json
│   └── src
│       ├── config.js
│       ├── routes
│       ├── server.js
│       └── services
├── frontend
│   ├── assets
│   │   ├── css
│   │   └── js
│   ├── dashboard.html
│   ├── index.html
│   ├── package.json
│   ├── pay.html
│   ├── payment-response.html
│   └── vite.config.js
├── sound_machine
│   ├── README.md
│   ├── requirements.txt
│   └── sms_reader.py
└── package.json
```

## Setup

1. Install dependencies from the repo root:

```bash
npm install
```

2. Update the backend env:

```bash
cp backend/.env.example backend/.env
```

3. Add your actual values in `backend/.env`.

Important:
- `DATABASE_URL` is required. The app now uses Postgres as the source of truth for vendors and payments.
- `INTERSWITCH_CLIENT_ID` and `INTERSWITCH_CLIENT_SECRET` are for server-side token generation.
- `INTERSWITCH_IDENTITY_CLIENT_ID` and `INTERSWITCH_IDENTITY_CLIENT_SECRET` are used for NIN verification and bank/account validation.
- `INTERSWITCH_PAY_ITEM_ID` is required before inline checkout and redirect checkout can open successfully.
- `INTERSWITCH_SITE_REDIRECT_URL` should point to the backend redirect handler so the backend can verify the transaction before the frontend shows success.
- `TERMII_API_KEY` is used for sound-device SMS alerts.
- `TERMII_BASE_URL` should be your Termii dashboard base URL. The current default is `https://api.ng.termii.com`.

## Run locally

```bash
npm run dev
```

Frontend:
- `http://localhost:5173`

Backend:
- `http://localhost:4000`

## Deploy on Vercel

Deploy frontend and backend as two separate Vercel projects from the same repo.

1. Create a **frontend** Vercel project with root directory `frontend/`.
2. Create a **backend** Vercel project with root directory `backend/`.
3. Add environment variables:

Backend project:
- `DATABASE_URL`
- `INTERSWITCH_CLIENT_ID`
- `INTERSWITCH_CLIENT_SECRET`
- `INTERSWITCH_MERCHANT_CODE` (or ensure it can be derived from token claims)
- `INTERSWITCH_PAY_ITEM_ID`
- `INTERSWITCH_PAY_ITEM_NAME`
- `INTERSWITCH_CURRENCY`
- `INTERSWITCH_MODE`
- `INTERSWITCH_PASSPORT_TOKEN_URL`
- `INTERSWITCH_API_BASE_URL`
- `INTERSWITCH_WEBPAY_BASE_URL`
- `INTERSWITCH_WEBHOOK_SECRET` (if using signed webhook validation)
- `INTERSWITCH_IDENTITY_CLIENT_ID`
- `INTERSWITCH_IDENTITY_CLIENT_SECRET`
- `INTERSWITCH_IDENTITY_PASSPORT_TOKEN_URL`
- `INTERSWITCH_IDENTITY_BASE_URL`
- `INTERSWITCH_IDENTITY_BANK_LIST_URL`
- `INTERSWITCH_IDENTITY_ACCOUNT_RESOLVE_URL`
- `INTERSWITCH_IDENTITY_NIN_URL`
- `TERMII_API_KEY`
- `TERMII_BASE_URL`
- `TERMII_SENDER_ID`
- `TERMII_CHANNEL`
- `BACKEND_BASE_URL=https://<your-backend-project>.vercel.app`
- `FRONTEND_BASE_URL=https://<your-frontend-project>.vercel.app`
- `INTERSWITCH_SITE_REDIRECT_URL=https://<your-backend-project>.vercel.app/api/interswitch/redirect`

Frontend project:
- `VITE_API_BASE_URL=https://<your-backend-project>.vercel.app/api`

After both are deployed, frontend calls backend through `VITE_API_BASE_URL`, and backend redirects/response URLs resolve to the deployed domains.

## Useful backend endpoints

- `GET /api/health`
- `GET /api/config/public`
- `POST /api/vendors`
- `GET /api/vendors/public/:slug`
- `GET /api/vendors/:vendorId/dashboard`
- `PUT /api/vendors/:vendorId/sound-device`
- `POST /api/payments`
- `POST /api/auth/token`
- `POST /api/transactions/requery`
- `POST /api/interswitch/redirect`
- `POST /api/wallet/initialize`
- `POST /api/wallet/status`
- `POST /api/virtual-accounts`
- `POST /api/webhooks/interswitch`

## Notes

- Redirect notifications from Interswitch are not trusted directly. The backend requeries the transaction before redirecting the customer to the final frontend response page.
- The webhook route verifies `X-Interswitch-Signature` when `INTERSWITCH_WEBHOOK_SECRET` is set.
- The checkout buttons stay usable only when the required merchant config is available.
- On startup, the backend creates the `vendors` and `payments` tables if they do not exist.
- Successful payments can send translated SMS alerts to a synced sound-device number via Termii.

## Docs used

- [Web Checkout](https://docs.interswitchgroup.com/docs/web-checkout)
- [Authentication](https://docs.interswitchgroup.com/docs/authentication)
- [Non Card Payments](https://docs.interswitchgroup.com/docs/non-card-payments)
- [Webhooks](https://docs.interswitchgroup.com/docs/webhooks)
- [Termii Messaging API](https://developers.termii.com/messaging-api)
