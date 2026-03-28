

import { body, validationResult } from "express-validator";

// Reusable helper — returns all validation errors as a 422 response
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return ALL errors at once so the user can fix everything in one go
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

const registerRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name too long")
    .escape(), // sanitise HTML chars — prevents stored XSS

  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(), // lowercases, removes dots from gmail, etc.

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
  // Don't .escape() passwords — special chars are valid and valuable
];

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export  { registerRules, loginRules, validate };
