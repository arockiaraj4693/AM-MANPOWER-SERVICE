import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("am_admin_token");
}
function getRole() {
  return localStorage.getItem("am_admin_role");
}

export default function PendingRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (!getToken() || getRole() !== "super") {
      nav("/admin/login");
      return;
    }
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API + "/api/admin/pending", {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (res.status === 401) {
        localStorage.removeItem("am_admin_token");
        nav("/admin/login");
        return;
      }
      const d = await res.json();
      if (!d.ok) return setError(d.error || "Failed to load");
      setItems(d.items || []);
    } catch {
      setError("Server error");
    }
    setLoading(false);
  }

  async function accept(id) {
    if (!confirm("Accept this registration request? The user will be able to log in.")) return;
    try {
      const res = await fetch(API + "/api/admin/pending/" + id + "/accept", {
        method: "POST",
        headers: { Authorization: "Bearer " + getToken() },
      });
      const d = await res.json();
      if (d.ok) {
        setActionMsg("Registration accepted. User can now log in.");
        fetchList();
        setTimeout(() => setActionMsg(""), 4000);
      } else {
        alert(d.error || "Failed to accept");
      }
    } catch {
      alert("Server error");
    }
  }

  async function reject(id) {
    if (!confirm("Delete this registration request?")) return;
    try {
      const res = await fetch(API + "/api/admin/pending/" + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      const d = await res.json();
      if (d.ok) {
        setActionMsg("Request deleted.");
        fetchList();
        setTimeout(() => setActionMsg(""), 3000);
      } else {
        alert(d.error || "Failed");
      }
    } catch {
      alert("Server error");
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h3>Pending Registration Requests</h3>
        <button
          className="btn"
          style={{ background: "#374151", color: "#fff" }}
          onClick={() => nav("/admin/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {actionMsg && (
        <div
          style={{
            padding: "12px 16px",
            background: "#f0fdf4",
            color: "#16a34a",
            borderRadius: "8px",
            marginBottom: "16px",
            fontWeight: "600",
          }}
        >
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          Loading...
        </div>
      ) : (
        <div className="grid">
          {items.length === 0 && (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                color: "#6b7280",
                padding: "40px",
              }}
            >
              No pending registration requests.
            </div>
          )}
          {items.map((it) => (
            <div key={it._id} className="card">
              <div className="card-body">
                <div
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    background: it.role === "admin" ? "#dbeafe" : "#f3e8ff",
                    color: it.role === "admin" ? "#1d4ed8" : "#7c3aed",
                    marginBottom: "8px",
                  }}
                >
                  {it.role.toUpperCase()}
                </div>
                <p className="small" style={{ margin: "4px 0" }}>
                  <strong>Email:</strong> {it.email}
                </p>
                <p className="small" style={{ margin: "4px 0" }}>
                  <strong>Mobile:</strong> {it.phone}
                </p>
                <p className="small" style={{ margin: "4px 0", color: "#6b7280" }}>
                  Requested: {new Date(it.createdAt).toLocaleString()}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "12px",
                  }}
                >
                  <button
                    className="btn"
                    style={{ background: "#16a34a", color: "#fff", flex: 1 }}
                    onClick={() => accept(it._id)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => reject(it._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px",
            background: "#fef2f2",
            color: "#dc2626",
            borderRadius: "8px",
            marginTop: "12px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
