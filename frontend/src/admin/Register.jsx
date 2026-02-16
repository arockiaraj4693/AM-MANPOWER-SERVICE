import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowFirst, setAllowFirst] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    // check if any admin exists
    (async () => {
      const api = import.meta.env.VITE_API_BASE || "http://localhost:5000";
      try {
        const r = await fetch(api + "/api/admin/first-register", {
          method: "GET",
        });
        if (r.status === 403) setAllowFirst(false);
        else setAllowFirst(true);
      } catch (e) {
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
    const api = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    try {
      let res;
      if (allowFirst) {
        const secret = f.get("secret") || "";
        res = await fetch(api + "/api/admin/first-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, secret }),
        });
      } else {
        // must be logged in super to create - use token
        const token = localStorage.getItem("am_admin_token");
        res = await fetch(api + "/api/admin/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ username: email, role, email, phone }),
        });
      }
      const data = await res.json();
      if (data.ok) {
        if (allowFirst) nav("/admin/login");
        else {
          setOtpSent(true);
          setPendingEmail(email);
        }
      } else setErr(data.error || "Failed");
    } catch (err) {
      setErr("Server error");
    }
    setLoading(false);
  }

  return (
    <div className="auth-card">
      <h3>
        {allowFirst
          ? "Create first Super Admin"
          : "Register Admin (super only)"}
      </h3>
      {!otpSent ? (
        <form onSubmit={submit}>
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email (will be username)"
              required
            />
          </div>
          {allowFirst ? (
            <div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
              />
            </div>
          ) : (
            <>
              <div>
                <select name="role">
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div>
                <input name="phone" placeholder="Phone (required)" required />
              </div>
            </>
          )}
          {allowFirst && (
            <div>
              <div>
                <input
                  name="secret"
                  placeholder="Enter secret to create super"
                  required
                />
              </div>
            </div>
          )}
          <div>
            <button className="btn" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p>
            Invite link sent to <strong>{pendingEmail}</strong>. The user should
            click the link to set their password (valid 15 minutes).
          </p>
        </div>
      )}
      {err && <div className="msg">{err}</div>}
    </div>
  );
}
