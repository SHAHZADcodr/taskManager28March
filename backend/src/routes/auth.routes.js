
import express from "express";
import { authLimiter } from "../middleware/rateLimiter.js";
import verifyToken from "../middleware/auth.js";
import { registerRules, loginRules, validate } from "../validators/auth.validator.js";
import { register, login, refresh, logout, getMe } from "../controllers/auth.controller.js";


const router = express.Router();
// Rate limiter applied ONLY to register and login
// (not refresh/logout — those don't need brute-force protection)
router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login", authLimiter, loginRules, validate, login);

// These read from the refreshToken cookie — no body payload needed
router.post("/refresh", refresh);
router.post("/logout", logout);

// Protected — requires valid accessToken cookie
router.get("/me", verifyToken, getMe);

export default router;
