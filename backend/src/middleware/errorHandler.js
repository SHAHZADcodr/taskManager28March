
// ─────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  // Always log the full error internally for debugging
  console.error(
    `[${new Date().toISOString()}] ERROR:`,
    err.stack || err.message,
  );

  // ── Known error types ────────────────────────────────────────

  // PostgreSQL: unique constraint violation (e.g. duplicate email)
  if (err.code === "23505") {
    return res.status(409).json({ error: "That email is already registered." });
  }

  // PostgreSQL: foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({ error: "Referenced record does not exist." });
  }

  // Custom errors thrown intentionally in controllers (err.statusCode set)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // ── Unknown / unexpected errors ──────────────────────────────
  // In production: send a vague message so we don't expose internals
  // In development: send the actual message so you can debug
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again."
      : err.message;

  res.status(500).json({ error: message });
};


export default errorHandler;
