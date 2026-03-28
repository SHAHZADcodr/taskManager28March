
import "dotenv/config"; 
import { initDb } from "./config/initDb.js";


import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { serve, setup } from "swagger-ui-express";
import yaml from "yamljs";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Routes
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(json({ limit: "10kb" }));

const swaggerDoc = yaml.load(join(__dirname, "../swagger.yaml"));
app.use("/api/docs", serve, setup(swaggerDoc));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ✅ Controlled startup
(async () => {
  try {
    console.log("🚀 Starting server...");
    console.log("DB PASSWORD:", process.env.DB_PASSWORD);

    await initDb(); // 🔥 this will also test connection

    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  }
})();
