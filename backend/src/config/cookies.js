// cookies.js
const isProd = process.env.NODE_ENV === "production";

const BASE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict",
  path: "/",
};

export const ACCESS_COOKIE = {
  ...BASE_OPTIONS,
  maxAge: 15 * 60 * 1000,
};

export const REFRESH_COOKIE = {
  ...BASE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth",
};

export const CLEAR_OPTIONS = { ...BASE_OPTIONS, maxAge: 0 };
export const CLEAR_REFRESH = { ...CLEAR_OPTIONS, path: "/api/v1/auth" };
