import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("am_admin_token");
}
function getRole() {
  return localStorage.getItem("am_admin_role");
}

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    if (!getToken()) {
      nav("/admin/login");
      return;
    }
    fetchList();
    if (getRole() === "super") fetchPendingCount();
  }, []);

  async function fetchList() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API + "/api/admin/applications", {
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

  async function fetchPendingCount() {
    try {
      const res = await fetch(API + "/api/admin/pending", {
        headers: { Authorization: "Bearer " + getToken() },
      });
      const d = await res.json();
      if (d.ok) setPendingCount((d.items || []).length);
    } catch {
      // ignore
    }
  }

  async function del(id) {
    if (!confirm("Delete this application?")) return;
    try {
      const res = await fetch(API + "/api/admin/applications/" + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      const d = await res.json();
      if (d.ok) fetchList();
      else alert(d.error || "Delete failed");
    } catch {
      alert("Server error");
    }
  }

  function logout() {
    localStorage.removeItem("am_admin_token");
    localStorage.removeItem("am_admin_role");
    nav("/admin/login");
  }

  const role = getRole();

  return (
    <div>
      <div className="admin-header">
        <h3>Applications</h3>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {role === "super" && (
            <>
              <button
                className="btn"
                style={{ background: "#7c3aed", color: "#fff", position: "relative" }}
                onClick={() => nav("/admin/pending")}
              >
                Pending Requests
                {pendingCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                className="btn"
                style={{ background: "#0f766e", color: "#fff" }}
                onClick={() => nav("/admin/logs")}
              >
                Logs
              </button>
            </>
          )}
          <button
            className="btn"
            style={{ background: "#1d4ed8", color: "#fff" }}
            onClick={() => nav("/admin/admins")}
          >
            Admins
          </button>
          <button
            className="btn"
            style={{ background: "#374151", color: "#fff" }}
            onClick={() => nav("/admin/supervisors")}
          >
            Supervisors
          </button>
          <button
            className="btn btn-danger"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          Loading...
        </div>
      ) : (
        <div className="grid">
          {items.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#6b7280", padding: "40px" }}>
              No applications yet.
            </div>
          )}
          {items.map((it) => (
            <div key={it._id} className="card">
              <div className="card-body">
                <h5>{it.name}</h5>
                <small style={{ color: "#6b7280" }}>
                  {it.jobTitle} &bull; {new Date(it.createdAt).toLocaleString()}
                </small>
                <p className="small" style={{ marginTop: "6px" }}>{it.address}</p>
                <p className="small">
                  Phone: <strong>{it.contact}</strong>
                </p>
                <div className="actions" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                  <a
                    className="btn"
                    style={{ background: "#16a34a", color: "#fff", fontSize: "0.85rem", padding: "7px 11px" }}
                    href={"https://wa.me/" + (it.contact || "")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                  <a
                    className="btn"
                    style={{ background: "#2563eb", color: "#fff", fontSize: "0.85rem", padding: "7px 11px" }}
                    href={"tel:" + (it.contact || "")}
                  >
                    Call
                  </a>
                  {it.resume && (
                    <a
                      className="btn"
                      style={{ background: "#7c3aed", color: "#fff", fontSize: "0.85rem", padding: "7px 11px" }}
                      href={
                        (it.resume || "").startsWith("/uploads")
                          ? API + it.resume
                          : it.resume
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Resume
                    </a>
                  )}
                  {(role === "admin" || role === "super") && (
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: "0.85rem", padding: "7px 11px" }}
                      onClick={() => del(it._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", marginTop: "12px" }}>
          {error}
        </div>
      )}
    </div>
  );
}
