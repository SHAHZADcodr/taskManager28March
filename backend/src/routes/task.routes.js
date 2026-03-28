
import express from "express";
import verifyToken from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { createTaskRules, updateTaskRules, validate } from "../validators/task.validator.js";
import { getTasks, getTaskById, createTask, updateTask, deleteTask } from "../controllers/task.controller.js";

const router = express.Router();
// All task routes require authentication
// API rate limiter applied to all (100 req/min per IP)
router.use(verifyToken, apiLimiter);

router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", createTaskRules, validate, createTask);
router.put("/:id", updateTaskRules, validate, updateTask);
router.delete("/:id", deleteTask);

export default router;
