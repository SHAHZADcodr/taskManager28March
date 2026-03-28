import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { s } from "../styles";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message;

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Sending login data:", form); // 🔍 debug

      const res = await api.post("/auth/login", form);

      console.log("Login response:", res.data); // 🔍 debug

      // ✅ SAFE CHECK (VERY IMPORTANT)
      if (res?.data?.user) {
        login(res.data.user);
        navigate("/dashboard");
      } else {
        throw new Error("Invalid response from server");
      }

    } catch (err) {
      console.error("Login error:", err);

      // ✅ Better error handling
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Login failed.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.heading}>Welcome back</h2>

        {successMsg && <div style={s.successBox}>{successMsg}</div>}
        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            required
            style={s.input}
          />

          <label style={s.label}>Password</label>
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            type="password"
            required
            style={s.input}
          />

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p style={s.sub}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}