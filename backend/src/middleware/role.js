

const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    // verifyToken must run first — it sets req.user
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log suspicious access attempts — useful for security monitoring
      console.warn(
        `🚨  RBAC: user ${req.user.id} (role: ${req.user.role}) attempted` +
          ` to access a route requiring: ${allowedRoles.join(", ")}`,
      );
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };

export default requireRole;
