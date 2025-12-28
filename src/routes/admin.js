import express from "express";
import { Response } from "../models/Response.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { calculateAggregate } from "../services/calculator.js";

export const adminRouter = express.Router();

adminRouter.get("/api/admin/responses", adminAuth, async (req, res) => {
  const responses = await Response.find().sort({ updatedAt: -1 }).lean();
  res.json({ ok: true, data: responses });
});

adminRouter.get("/api/admin/summary", adminAuth, async (req, res) => {
  const heatFactor = Number(process.env.HEAT_FACTOR || "1.35");
  const responses = await Response.find().lean();
  const summary = calculateAggregate(responses, heatFactor);
  res.json({ ok: true, summary });
});

adminRouter.get("/api/admin/export/html", adminAuth, async (req, res) => {
  const heatFactor = Number(process.env.HEAT_FACTOR || "1.35");
  const responses = await Response.find().lean();
  const summary = calculateAggregate(responses, heatFactor);

  const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Lista de compras – Fin de Año</title>
  <style>
    body { font-family: system-ui, Arial, sans-serif; margin: 0; padding: 16px; background: #0b0f17; color: #e8eefc; }
    h1, h2 { margin: 0.6em 0; }
    .card { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 16px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,.1); text-align: left; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.12); font-size: 12px; }
    footer { opacity: .7; font-size: 13px; margin-top: 20px; }
  </style>
</head>
<body>

  <h1>🛒 Lista de compras – Fin de Año</h1>
  <div class="badge">Respuestas: ${summary.count}</div>
  <div class="badge">Factor calor: ${summary.heatFactor}</div>
  <div class="badge">Generado: ${new Date().toLocaleString()}</div>

  <div class="card">
    <h2>📦 Bebidas – Compra sugerida</h2>
    <table>
      <thead><tr><th>Item</th><th>Cantidad</th></tr></thead>
      <tbody>
        ${summary.packaging.map(p => `
          <tr>
            <td>${p.item}</td>
            <td><strong>${p.buy}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>🍬 Mesa dulce</h2>
    <table>
      <thead><tr><th>Producto</th><th>Estimado</th><th>Sugerido</th></tr></thead>
      <tbody>
        ${summary.sweetsSummary.map(s => `
          <tr>
            <td>${s.label}</td>
            <td>${s.grams} g</td>
            <td><strong>${s.suggested}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>

  <footer>
    Generado automáticamente. Ideal para abrir desde el celular en el súper.
  </footer>

</body>
</html>
`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

adminRouter.get("/api/admin/checklist", adminAuth, async (req, res) => {
  const heatFactor = Number(process.env.HEAT_FACTOR || "1.35");
  const responses = await Response.find().lean();
  const summary = calculateAggregate(responses, heatFactor);

  res.json({
    ok: true,
    meta: {
      generatedAt: new Date(),
      responses: summary.count,
      heatFactor: summary.heatFactor
    },
    checklist: summary.packaging.map((p, idx) => ({
      id: `item-${idx}`,
      label: p.item,
      quantity: p.buy,
      checked: false
    })),
    sweets: summary.sweetsSummary,
    totals: summary.totals
  });
});

adminRouter.delete("/api/admin/clear", adminAuth, async (req, res) => {
  await Response.deleteMany({});
  res.json({ ok: true });
});