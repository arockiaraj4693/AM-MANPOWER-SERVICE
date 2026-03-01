import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (!token) {
      setErr("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const f = new FormData(e.target);
    const password = f.get("password");
    const confirm = f.get("confirm");
    if (password !== confirm) {
      setErr("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(API + "/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (d.ok) {
        setSuccess(true);
      } else {
        setErr(d.error || "Reset failed");
      }
    } catch {
      setErr("Server error. Please try again.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
        <h4>Password Reset Successfully!</h4>
        <p style={{ color: "#6b7280" }}>You can now log in with your new password.</p>
        <button
          className="btn"
          style={{
            marginTop: "16px",
            background: "linear-gradient(90deg,#ff6b00,#ff8a2b)",
            color: "#fff",
            padding: "10px 24px",
          }}
          onClick={() => nav("/admin/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h3>Set New Password</h3>
      <form onSubmit={submit}>
        <div style={{ marginBottom: "12px" }}>
          <input
            name="password"
            type="password"
            placeholder="New password (min 6 characters)"
            required
            minLength={6}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e6e9ee" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <input
            name="confirm"
            type="password"
            placeholder="Confirm new password"
            required
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e6e9ee" }}
          />
        </div>
        <button
          className="btn"
          type="submit"
          disabled={loading || !token}
          style={{
            width: "100%",
            background: "linear-gradient(90deg,#ff6b00,#ff8a2b)",
            color: "#fff",
            padding: "12px",
          }}
        >
          {loading ? "Resetting..." : "Reset Password"}
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
