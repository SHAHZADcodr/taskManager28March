import { body, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });
  next();
};

const createTaskRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 255 })
    .withMessage("Title too long")
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description too long")
    .escape(),

  body("status")
    .optional()
    .isIn(["pending", "in_progress", "completed"])
    .withMessage("Invalid status value"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid priority value"),

  body("due_date")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date (YYYY-MM-DD)")
    .toDate(),
];

// Update uses the same rules but all fields are optional
const updateTaskRules = createTaskRules.map((rule) =>
  rule.optional ? rule : rule.optional(),
);

export  { createTaskRules, updateTaskRules, validate };
