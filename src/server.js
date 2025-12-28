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

dotenv.config();

const app = express();
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(cors());
app.use(express.json({ limit: "200kb" }));
app.use(morgan("dev"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static
app.use(express.static(path.join(__dirname, "..", "public")));

// Routes
app.use(publicRouter);
app.use(adminRouter);

// Health
app.get("/api/health", (req, res) => res.json({ ok: true, status: "up" }));

const PORT = process.env.PORT || 3000;

await connectDB(process.env.MONGO_URI);

app.listen(PORT, () => {
  console.log(`[HTTP] http://localhost:${PORT}`);
});