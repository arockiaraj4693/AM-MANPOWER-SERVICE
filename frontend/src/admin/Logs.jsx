import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("am_admin_token");
}
function getRole() {
  return localStorage.getItem("am_admin_role");
}

const ACTION_LABELS = {
  delete_application: { label: "Application Deleted", color: "#dc2626", bg: "#fef2f2" },
  delete_user: { label: "User Deleted", color: "#9a3412", bg: "#fff7ed" },
};

export default function Logs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (!getToken() || getRole() !== "super") {
      nav("/admin/login");
      return;
    }
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API + "/api/admin/logs", {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (res.status === 401) {
        localStorage.removeItem("am_admin_token");
        nav("/admin/login");
        return;
      }
      const d = await res.json();
      if (!d.ok) return setError(d.error || "Failed to load logs");
      setItems(d.items || []);
    } catch {
      setError("Server error");
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="admin-header">
        <h3>Activity Logs</h3>
        <button
          className="btn"
          style={{ background: "#374151", color: "#fff" }}
          onClick={() => nav("/admin/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "16px" }}>
        Showing all deletion activity. Visible to Super Admin only.
      </p>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          Loading logs...
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          No activity logs yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((log) => {
            const meta = ACTION_LABELS[log.action] || { label: log.action, color: "#374151", bg: "#f9fafb" };
            return (
              <div
                key={log._id}
                style={{
                  background: "#fff",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  boxShadow: "0 2px 10px rgba(2,6,23,0.06)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    background: meta.bg,
                    color: meta.color,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {meta.label}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", fontSize: "0.92rem", marginBottom: "4px" }}>
                    {log.targetName || log.targetEmail || log.targetId || "-"}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                    {log.details}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "4px" }}>
                    By <strong>{log.performedBy}</strong> ({log.performedByRole}) &bull;{" "}
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
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
