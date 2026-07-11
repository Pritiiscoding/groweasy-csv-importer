import "dotenv/config";
import express from "express";
import cors from "cors";
import parseRouter from "./routes/parse.js";
import extractRouter from "./routes/extract.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", provider: process.env.AI_PROVIDER || "anthropic" });
});

app.use("/api/parse", parseRouter);
app.use("/api/extract", extractRouter);

// Central error handler - keeps error shape consistent for the frontend.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GrowEasy CSV importer API listening on port ${PORT}`);
});
