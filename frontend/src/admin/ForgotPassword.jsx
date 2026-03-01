import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [token, setToken] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const f = new FormData(e.target);
    const username = f.get("username");
    try {
      const res = await fetch(API + "/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const d = await res.json();
      if (d.ok && d.token) {
        setToken(d.token);
      } else {
        setErr(d.error || "User not found");
      }
    } catch {
      setErr("Server error. Please try again.");
    }
    setLoading(false);
  }

  if (token) {
    return (
      <div className="auth-card">
        <h3>Reset Your Password</h3>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "16px" }}>
          Your reset token has been generated. Click below to reset your password.
        </p>
        <button
          className="btn"
          style={{
            width: "100%",
            background: "linear-gradient(90deg,#ff6b00,#ff8a2b)",
            color: "#fff",
            padding: "12px",
          }}
          onClick={() => nav("/admin/reset-password?token=" + token)}
        >
          Set New Password
        </button>
        <div style={{ marginTop: "14px", textAlign: "center" }}>
          <button
            style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "0.88rem" }}
            onClick={() => nav("/admin/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h3>Forgot Password</h3>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "16px" }}>
        Enter your username or email to get a password reset link.
      </p>
      <form onSubmit={submit}>
        <div style={{ marginBottom: "12px" }}>
          <input
            name="username"
            placeholder="Email / Username"
            required
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e6e9ee" }}
          />
        </div>
        <button
          className="btn"
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: "linear-gradient(90deg,#ff6b00,#ff8a2b)",
            color: "#fff",
            padding: "12px",
          }}
        >
          {loading ? "Checking..." : "Get Reset Link"}
        </button>
      </form>
      {err && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            background: "#fef2f2",
            color: "#dc2626",
            borderRadius: "8px",
            fontSize: "0.9rem",
          }}
        >
          {err}
        </div>
      )}
      <div style={{ marginTop: "14px", textAlign: "center" }}>
        <button
          style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "0.88rem" }}
          onClick={() => nav("/admin/login")}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
