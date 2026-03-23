import app, { ensureAppReady } from "../src/app.js";

export default async function handler(req, res) {
  await ensureAppReady();
  return app(req, res);
}
