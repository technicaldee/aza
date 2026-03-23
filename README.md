# AZA Web Checkout Demo

This repo is split into a separate `frontend/` and `backend/` so you can keep the merchant-facing experience isolated from the server-side Interswitch verification and token work.

## What is included

- A landing page based on your AZA mockup
- A vendor dashboard page based on your mockup
- A checkout page wired for:
  - Interswitch inline checkout
  - Interswitch web redirect checkout
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

3. Add your actual Interswitch values in `backend/.env`.

Important:
- `INTERSWITCH_CLIENT_ID` and `INTERSWITCH_CLIENT_SECRET` are for server-side token generation.
- `INTERSWITCH_PAY_ITEM_ID` is required before inline checkout and redirect checkout can open successfully.
- `INTERSWITCH_SITE_REDIRECT_URL` should point to the backend redirect handler so the backend can verify the transaction before the frontend shows success.

## Run locally

```bash
npm run dev
```

Frontend:
- `http://localhost:5173`

Backend:
- `http://localhost:4000`

## Useful backend endpoints

- `GET /api/health`
- `GET /api/config/public`
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

## Docs used

- [Web Checkout](https://docs.interswitchgroup.com/docs/web-checkout)
- [Authentication](https://docs.interswitchgroup.com/docs/authentication)
- [Non Card Payments](https://docs.interswitchgroup.com/docs/non-card-payments)
- [Webhooks](https://docs.interswitchgroup.com/docs/webhooks)
