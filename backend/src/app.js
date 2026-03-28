
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

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Server listening on port ${PORT}`);
  
  try {
    console.log("⏳ Initializing database...");
    // We do this INSIDE the listen callback so the port is already open
    await initDb(); 
    console.log("🚀 Database is ready and synchronized.");
  } catch (err) {
    // If DB fails, we log it, but the server is at least "up" 
    // so you can see the error in the Live Logs.
    console.error("❌ Database initialization failed:", err.message);
  }
});
