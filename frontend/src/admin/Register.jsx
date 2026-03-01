import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Register() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowFirst, setAllowFirst] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(API + "/api/admin/first-register");
        setAllowFirst(r.status !== 403);
      } catch {
        setAllowFirst(true);
      }
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const f = new FormData(e.target);
    const email = f.get("email");
    const password = f.get("password");
    const role = f.get("role") || "supervisor";
    const phone = f.get("phone") || "";

    try {
      let res;
      if (allowFirst) {
        const secret = f.get("secret") || "";
        res = await fetch(API + "/api/admin/first-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, secret }),
        });
      } else {
        res = await fetch(API + "/api/admin/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role, phone }),
        });
      }
      const data = await res.json();
      if (data.ok) {
        if (allowFirst) {
          nav("/admin/login");
        } else {
          setSubmitted(true);
        }
      } else {
        setErr(data.error || "Registration failed");
      }
    } catch {
      setErr("Server error. Please try again.");
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="auth-card">
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>⏳</div>
          <h4 style={{ color: "#0f1720", marginBottom: "12px" }}>
            Request Submitted!
          </h4>
          <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
            Your registration request has been submitted successfully.
          </p>
          <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
            Please wait for the <strong>Super Admin</strong> to review and
            approve your request. Once approved, you can log in using your{" "}
            <strong>email and password</strong>.
          </p>
          <button
            className="btn"
            style={{
              marginTop: "16px",
              background: "linear-gradient(90deg,#ff6b00,#ff8a2b)",
              color: "#fff",
            }}
            onClick={() => nav("/admin/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h3>{allowFirst ? "Create Super Admin" : "Register Account"}</h3>
      <form onSubmit={submit}>
        <div style={{ marginBottom: "12px" }}>
          <input
            name="email"
            type="email"
            placeholder="Email address"
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #e6e9ee",
            }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <input
            name="password"
            type="password"
            placeholder="Password (min 6 characters)"
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #e6e9ee",
            }}
          />
        </div>
        {!allowFirst && (
          <>
            <div style={{ marginBottom: "12px" }}>
              <select
                name="role"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #e6e9ee",
                }}
              >
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <input
                name="phone"
                placeholder="Phone number"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #e6e9ee",
                }}
              />
            </div>
          </>
        )}
        {allowFirst && (
          <div style={{ marginBottom: "12px" }}>
            <input
              name="secret"
              type="password"
              placeholder="Setup secret key"
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #e6e9ee",
              }}
            />
          </div>
        )}
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
          {loading
            ? "Submitting..."
            : allowFirst
              ? "Create Super Admin"
              : "Submit Request"}
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
          style={{
            background: "none",
            border: "none",
            color: "#ff6b00",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
          onClick={() => nav("/admin/login")}
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}
