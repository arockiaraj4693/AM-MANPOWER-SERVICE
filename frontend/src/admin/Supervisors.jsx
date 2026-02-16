import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function getToken() {
  return localStorage.getItem("am_admin_token");
}

export default function Supervisors() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (!getToken()) nav("/admin/login");
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    setError("");
    const api = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    try {
      const res = await fetch(api + "/api/admin/users?role=supervisor", {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (res.status === 401) {
        localStorage.removeItem("am_admin_token");
        nav("/admin/login");
        return;
      }
      const d = await res.json();
      if (!d.ok) return setError(d.error || "Failed");
      setItems(d.items || []);
    } catch (err) {
      setError("Server error");
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="admin-header">
        <h3>Supervisors</h3>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid">
          {items.map((it) => (
            <div key={it._id || it.username} className="card">
              <div className="card-body">
                <h5>{it.username}</h5>
                <small>{it.role}</small>
                <p className="small">
                  Email: <strong>{it.email || "-"}</strong>
                </p>
                <p className="small">
                  Phone: <strong>{it.phone || "-"}</strong>
                </p>
                <div className="actions">
                  {it.phone && (
                    <a
                      className="btn btn-outline-primary me-2"
                      href={"tel:" + it.phone}
                    >
                      Call
                    </a>
                  )}
                  {it.phone && (
                    <a
                      className="btn btn-outline-success me-2"
                      href={"https://wa.me/" + it.phone}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  )}
                  {it.email && (
                    <a
                      className="btn btn-outline-secondary"
                      href={"mailto:" + it.email}
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="msg">{error}</div>}
    </div>
  );
}
