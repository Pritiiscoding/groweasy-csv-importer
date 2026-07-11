import { Router } from "express";
import { extractCrmRecords } from "../services/aiExtractor.js";

const router = Router();

// POST /api/extract - body: { rows: Record<string,string>[] }
// Only called after the user has previewed and confirmed the import.
router.post("/", async (req, res, next) => {
  try {
    const { rows } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      const err = new Error("Request body must include a non-empty 'rows' array.");
      err.status = 400;
      throw err;
    }
    if (rows.length > 5000) {
      const err = new Error("Too many rows in a single request (limit 5000).");
      err.status = 400;
      throw err;
    }

    const result = await extractCrmRecords(rows);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
