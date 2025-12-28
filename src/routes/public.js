import express from "express";
import { Response } from "../models/Response.js";
import { catalog } from "../data/catalog.js";

export const publicRouter = express.Router();

publicRouter.get("/api/catalog", (req, res) => {
  res.json({ ok: true, catalog });
});

publicRouter.post("/api/respond", async (req, res) => {
  const { name, ageGroup, selections } = req.body ?? {};

  if (!name || !ageGroup) {
    return res.status(400).json({ ok: false, message: "name y ageGroup son obligatorios" });
  }

  const safeSelections = Array.isArray(selections) ? selections.filter((x) => typeof x === "string") : [];

  // upsert por nombre (si ya existe, actualiza)
  const doc = await Response.findOneAndUpdate(
    { name: name.trim() },
    { name: name.trim(), ageGroup, selections: safeSelections },
    { upsert: true, new: true }
  );

  res.json({ ok: true, data: doc });
});