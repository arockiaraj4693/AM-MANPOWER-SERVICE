import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function getToken() {
  return localStorage.getItem("am_admin_token");
}

export default function Admins() {
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
      const res = await fetch(api + "/api/admin/users", {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (res.status === 401) {
        localStorage.removeItem("am_admin_token");
        nav("/admin/login");
        return;
      }
      const d = await res.json();
      if (!d.ok) return setError(d.error || "Failed");
      // show admins & supers only
      setItems((d.items || []).filter((u) => u.role !== "supervisor"));
    } catch (err) {
      setError("Server error");
    }
    setLoading(false);
  }

  async function del(id) {
    if (!confirm("Delete user?")) return;
    const api = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    try {
      const res = await fetch(api + "/api/admin/users/" + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      const d = await res.json();
      if (d.ok) fetchList();
      else alert(d.error || "Failed");
    } catch (err) {
      alert("Server error");
    }
  }

  return (
    <div>
      <div className="admin-header d-flex align-items-center justify-content-between">
        <h3>Admins</h3>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => (window.location.href = "/admin/register")}
          >
            New Admin
          </button>
        </div>
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
                  <a
                    className="btn btn-outline-primary"
                    href={`mailto:${it.email || ""}`}
                  >
                    Email
                  </a>
                  {it.phone && (
                    <a
                      className="btn btn-outline-primary"
                      href={`tel:${it.phone}`}
                    >
                      Call
                    </a>
                  )}
                  <button
                    className="btn btn-danger"
                    onClick={() => del(it._id)}
                  >
                    Delete
                  </button>
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
