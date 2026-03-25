import cors from "cors";
import express from "express";
import morgan from "morgan";
import configRouter from "./routes/config.js";
import paymentsRouter from "./routes/payments.js";
import vendorsRouter from "./routes/vendors.js";
import nonCardRouter from "./routes/non-card.js";
import transactionsRouter from "./routes/transactions.js";
import webhookRouter from "./routes/webhooks.js";
import { config } from "./config.js";
import { initDb, query } from "./services/db.js";

const app = express();

function rawBodySaver(req, res, buffer) {
  if (buffer?.length) {
    req.rawBody = buffer.toString("utf8");
  }
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, server-to-server, webhooks) with no Origin header.
      if (!origin) return callback(null, true);

      if (config.corsAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);
app.use(morgan("dev"));
app.use(express.json({ verify: rawBodySaver }));
app.use(express.urlencoded({ extended: false, verify: rawBodySaver }));

app.get("/api/health", async (req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({
      ok: true,
      mode: config.mode,
      database: "connected"
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/config", configRouter);
app.use("/api/auth", configRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api", transactionsRouter);
app.use("/api", nonCardRouter);
app.use("/api/webhooks", webhookRouter);

app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error",
    details: error.details || null
  });
});

let initPromise;

export async function ensureAppReady() {
  if (!initPromise) {
    initPromise = initDb();
  }

  await initPromise;
}

export default app;
