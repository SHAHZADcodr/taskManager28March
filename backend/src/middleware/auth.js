

// ─────────────────────────────────────────────────────────────
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const verifyToken = async (req, res, next) => {
  try {
    // Read from cookie, NOT from Authorization header
    const token = req.cookies?.accessToken;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Not authenticated. Please log in." });
    }

    // Verify signature. Throws if expired or tampered.
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch live user data from DB — don't trust stale token payload
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [decoded.id],
    );

    if (!result.rows[0]) {
      // User was deleted after token was issued
      return res.status(401).json({ error: "User no longer exists." });
    }

    // Attach full live user object to request
    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Specific message so the frontend knows to try a silent refresh
      return res.status(401).json({
        error: "Access token expired.",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({ error: "Invalid token." });
  }
};

export default verifyToken;