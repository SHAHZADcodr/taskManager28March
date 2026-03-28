
// auth.controller.js — register, login, refresh, logout
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from"../config/db.js";
import { ACCESS_COOKIE, REFRESH_COOKIE, CLEAR_OPTIONS, CLEAR_REFRESH } from "../config/cookies.js";

// ── Helper: create and store a refresh token ──────────────────

const createRefreshToken = async (userId) => {

  const raw = crypto.randomBytes(64).toString("hex");

  // Hash before storing — if DB is breached, attacker gets hashes not tokens
  const hash = crypto.createHash("sha256").update(raw).digest("hex");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, hash, expiresAt],
  );

  return raw; // return the raw token to set as the cookie value
};

// ── Helper: sign an access token ──────────────────────────────
// Only store the user ID — role is fetched live from DB in auth middleware
const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES,
  });

// ── POST /api/v1/auth/register ────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    console.log("Registering user :",req.body);

    // Cost factor 12: ~250ms per hash — fast enough for real users,
    // slow enough to make brute-force attacks impractical
    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, password_hash],
    );

    // 201 Created — new resource was made
    // Never return password_hash in any response
    res.status(201).json({
      message: "Account created successfully.",
      user: result.rows[0],
    });
  } catch (err) {
    next(err); // 23505 (duplicate email) handled in errorHandler
  }
};

// ── POST /api/v1/auth/login ───────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
  
    const dummyHash = "$2a$12$dummyhashfordummyhashfordummy.dummyhashfordummy";
    const isMatch = await bcrypt.compare(
      password,
      user ? user.password_hash : dummyHash,
    );

    if (!user || !isMatch) {
      // Deliberately vague — don't tell attacker which was wrong
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Issue token pair
    const accessToken = signAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);

    // Set both as HttpOnly cookies — JS cannot read them
    res.cookie("accessToken", accessToken, ACCESS_COOKIE);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE);

    res.json({
      message: "Logged in successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/auth/refresh ─────────────────────────────────

const refresh = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;

    if (!rawToken) {
      return res.status(401).json({ error: "No refresh token." });
    }

    // Hash the incoming token to compare against the stored hash
    const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Look it up — must exist, not be expired
    const result = await pool.query(
      `SELECT rt.*, u.id as user_id
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
      [hash],
    );

    if (!result.rows[0]) {
      return res.status(401).json({
        error: "Refresh token invalid or expired. Please log in again.",
      });
    }

    const userId = result.rows[0].user_id;
    
    await pool.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [
      hash,
    ]);

    const newAccessToken = signAccessToken(userId);
    const newRefreshToken = await createRefreshToken(userId);

    res.cookie("accessToken", newAccessToken, ACCESS_COOKIE);
    res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE);

    res.json({ message: "Token refreshed." });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/auth/logout ──────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;

    if (rawToken) {
      const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
      // Delete from DB — this token can never be used again
      await pool.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [
        hash,
      ]);
    }

    // Clear both cookies from the browser
    res.clearCookie("accessToken", CLEAR_OPTIONS);
    res.clearCookie("refreshToken", CLEAR_REFRESH);

    res.json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/auth/me ───────────────────────────────────────
// Returns current authenticated user's profile
const getMe = (req, res) => {
  // req.user is set by verifyToken middleware — already fetched from DB
  res.json({ user: req.user });
};


export { register, login, refresh, logout, getMe };