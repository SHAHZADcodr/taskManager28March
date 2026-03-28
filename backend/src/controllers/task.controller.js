
// ─────────────────────────────────────────────────────────────
import pool from"../config/db.js";

// ── GET /api/v1/tasks ─────────────────────────────────────────
// Admin: sees all tasks. User: sees only their own.
// Supports filtering by status/priority and pagination.
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;

    // Clamp page/limit to prevent abuse (e.g. limit=999999)
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    // Build query dynamically — only add clauses for filters that were provided
    const params = [];
    const clauses = [];
    let i = 1;

    if (req.user.role !== "admin") {
      // Regular users are hard-locked to their own tasks
      clauses.push(`user_id = $${i++}`);
      params.push(req.user.id);
    }
    if (status) {
      clauses.push(`status = $${i++}`);
      params.push(status);
    }
    if (priority) {
      clauses.push(`priority = $${i++}`);
      params.push(priority);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    // Get total count for pagination metadata
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM tasks ${where}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const result = await pool.query(
      `SELECT * FROM tasks ${where}
       ORDER BY created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, safeLimit, offset],
    );

    res.json({
      tasks: result.rows,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/tasks/:id ─────────────────────────────────────
const getTaskById = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [
      req.params.id,
    ]);
    const task = result.rows[0];

    if (!task) return res.status(404).json({ error: "Task not found." });

    // Ownership check — admin bypasses this
    if (req.user.role !== "admin" && task.user_id !== req.user.id) {
    
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/tasks ────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, due_date } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.user.id, // always use the ID from the token, never from body
        title,
        description || null,
        status || "pending",
        priority || "medium",
        due_date || null,
      ],
    );

    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/v1/tasks/:id ─────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const task = await getOwnedTask(req.params.id, req.user);
    if (!task) return res.status(404).json({ error: "Task not found." });

    const { title, description, status, priority, due_date } = req.body;

    // COALESCE: if a field isn't provided, keep the existing value
    // This lets the frontend send partial updates (PATCH-like behaviour)
    const result = await pool.query(
      `UPDATE tasks
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           status      = COALESCE($3, status),
           priority    = COALESCE($4, priority),
           due_date    = COALESCE($5, due_date),
           updated_at  = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, description, status, priority, due_date, req.params.id],
    );

    res.json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/v1/tasks/:id ──────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const task = await getOwnedTask(req.params.id, req.user);
    if (!task) return res.status(404).json({ error: "Task not found." });

    await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
    res.json({ message: "Task deleted." });
  } catch (err) {
    next(err);
  }
};

// ── Private helper ────────────────────────────────────────────
// Fetches task and enforces ownership in one reusable function.
// Returns the task if the user owns it (or is admin), null otherwise.
const getOwnedTask = async (taskId, user) => {
  const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [
    taskId,
  ]);
  const task = result.rows[0];
  if (!task) return null;
  if (user.role !== "admin" && task.user_id !== user.id) return null;
  return task;
};

export {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
}
