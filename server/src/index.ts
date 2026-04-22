import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import projectsRouter from "./routes/projects.js";
import mentorRouter from "./routes/mentor.js";
import pmEvalRouter from "./routes/pm-eval.js";

const app = express();
const PORT = process.env.PORT ?? 3001;
const MONGODB_URI = process.env.MONGODB_URI ?? "";

app.use(cors({ origin: ["http://localhost:8080", "http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.use("/api/projects", projectsRouter);
app.use("/api/mentor", mentorRouter);
app.use("/api/pm", pmEvalRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
