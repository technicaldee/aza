import app, { ensureAppReady } from "../src/app.js";

export default async function handler(req, res) {
  try {
    await ensureAppReady();
    return app(req, res);
  } catch (error) {
    console.error("Serverless init failed:", error);

    res.status(500).json({
      message: "Backend initialization failed.",
      details: error?.message || null
    });
  }
}
