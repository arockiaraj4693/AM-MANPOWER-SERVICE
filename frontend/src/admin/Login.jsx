import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const f = new FormData(e.target);
    const body = { username: f.get("username"), password: f.get("password") };
    const api = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    try {
      const res = await fetch(api + "/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("am_admin_token", data.token);
        localStorage.setItem("am_admin_role", data.role || "supervisor");
        nav("/admin/dashboard");
      } else setErr(data.error || "Login failed");
    } catch (err) {
      setErr("Server error");
    }
    setLoading(false);
  }

  return (
    <div className="auth-card">
      <h3>Admin Login</h3>
      <form onSubmit={submit}>
        <div>
          <input name="username" placeholder="Username" required />
        </div>
        <div>
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
          />
        </div>
        <div>
          <button className="btn" disabled={loading}>
            {loading ? "Signing..." : "Sign in"}
          </button>
        </div>
      </form>
      {err && <div className="msg">{err}</div>}
    </div>
  );
}
