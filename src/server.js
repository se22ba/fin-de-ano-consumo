import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { publicRouter } from "./routes/public.js";
import { adminRouter } from "./routes/admin.js";

/* =====================
   ENV
===================== */
dotenv.config();

/* =====================
   APP
===================== */
const app = express();

/* Helmet ajustado para local + Render */
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(express.json({ limit: "200kb" }));
app.use(morgan("dev"));

/* =====================
   PATHS
===================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================
   STATIC FILES
===================== */
app.use(express.static(path.join(__dirname, "..", "public")));

/* =====================
   ROUTES
===================== */
app.use(publicRouter);
app.use(adminRouter);

/* =====================
   HEALTHCHECK
===================== */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "up",
    env: process.env.NODE_ENV || "development"
  });
});

/* =====================
   SERVER START
===================== */
const PORT = process.env.PORT || 3000;

/* ======== MONGO VALIDATION ======== */
if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI no está definida");
  console.error("👉 Verificá la variable en Render y redeployá");
  process.exit(1);
}

console.log("✅ MONGO_URI detectada");

/* ======== DB CONNECT ======== */
try {
  await connectDB(process.env.MONGO_URI);
  console.log("✅ MongoDB conectado correctamente");
} catch (err) {
  console.error("❌ Error conectando a MongoDB");
  console.error(err);
  process.exit(1);
}

/* ======== LISTEN ======== */
app.listen(PORT, () => {
  console.log(`🚀 Server escuchando en puerto ${PORT}`);
});