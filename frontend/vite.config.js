import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        signup: resolve(__dirname, "signup.html"),
        signin: resolve(__dirname, "signin.html"),
        verifyNin: resolve(__dirname, "verify-nin.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        pay: resolve(__dirname, "pay.html"),
        paymentResponse: resolve(__dirname, "payment-response.html")
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173
  },
  preview: {
    host: "0.0.0.0",
    port: 4173
  }
});
