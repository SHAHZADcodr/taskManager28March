

import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 5, // max 5 requests per window per IP
  standardHeaders: true, // tells client when the window resets
  legacyHeaders: false,
  message: {
    error: "Too many attempts from this IP. Please try again in 15 minutes.",
  },
  
  skipSuccessfulRequests: true,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});
