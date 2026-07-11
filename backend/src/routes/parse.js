import { Router } from "express";
import multer from "multer";
import { parseCsvBuffer } from "../services/csvParser.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const okType =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    cb(okType ? null : new Error("Only .csv files are supported."), okType);
  },
});

const router = Router();

// POST /api/parse - upload + parse only, used to populate the preview table.
router.post("/", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error("No file uploaded. Attach a CSV under the 'file' field.");
      err.status = 400;
      throw err;
    }
    const { headers, rows } = parseCsvBuffer(req.file.buffer);
    res.json({ headers, rows, totalRows: rows.length });
  } catch (err) {
    next(err);
  }
});

export default router;
