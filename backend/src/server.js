import cors from "cors";
import express from "express";
import morgan from "morgan";
import { config } from "./config.js";
import configRouter from "./routes/config.js";
import nonCardRouter from "./routes/non-card.js";
import transactionsRouter from "./routes/transactions.js";
import webhookRouter from "./routes/webhooks.js";

const app = express();

function rawBodySaver(req, res, buffer) {
  if (buffer?.length) {
    req.rawBody = buffer.toString("utf8");
  }
}

app.use(
  cors({
    origin: true
  })
);
app.use(morgan("dev"));
app.use(express.json({ verify: rawBodySaver }));
app.use(express.urlencoded({ extended: false, verify: rawBodySaver }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mode: config.mode
  });
});

app.use("/api/config", configRouter);
app.use("/api/auth", configRouter);
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

app.listen(config.port, () => {
  console.log(`AZA backend listening on ${config.backendBaseUrl}`);
});
