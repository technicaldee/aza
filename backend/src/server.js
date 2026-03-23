import { config } from "./config.js";
import app, { ensureAppReady } from "./app.js";

async function start() {
  await ensureAppReady();

  app.listen(config.port, () => {
    console.log(`AZA backend listening on ${config.backendBaseUrl}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
