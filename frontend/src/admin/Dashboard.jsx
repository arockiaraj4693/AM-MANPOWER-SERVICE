import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
      const res = await fetch(api + "/api/admin/applications", {
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

  async function del(id) {
    if (!confirm("Delete application?")) return;
    const api = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    const res = await fetch(api + "/api/admin/applications/" + id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + getToken() },
    });
    const d = await res.json();
    if (d.ok) fetchList();
    else alert(d.error || "Failed");
  }

  function logout() {
    localStorage.removeItem("am_admin_token");
    localStorage.removeItem("am_admin_role");
    nav("/admin/login");
  }

  return (
    <div>
      <div className="admin-header">
        <h3>Applications</h3>
        <div>
          <button
            className="btn btn-primary me-2"
            onClick={() => nav("/admin/admins")}
          >
            Admins
          </button>
          <button
            className="btn btn-secondary me-2"
            onClick={() => nav("/admin/supervisors")}
          >
            Supervisors
          </button>
          <button className="btn btn-outline-danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid">
          {items.map((it) => (
            <div key={it._id} className="card">
              <div className="card-body">
                <h5>{it.name}</h5>
                <small>
                  {it.jobTitle} • {new Date(it.createdAt).toLocaleString()}
                </small>
                <p className="small">{it.address}</p>
                <p className="small">
                  Phone: <strong>{it.contact}</strong>
                </p>
                <div className="actions">
                  <a
                    className="btn"
                    href={"https://wa.me/" + (it.contact || "")}
                    target="_blank"
                  >
                    WhatsApp
                  </a>
                  <a className="btn" href={"tel:" + (it.contact || "")}>
                    Call
                  </a>
                  {it.resume && (
                    <a
                      className="btn"
                      href={
                        (it.resume || "").startsWith("/uploads")
                          ? (import.meta.env.VITE_API_BASE ||
                              "http://localhost:5000") + it.resume
                          : it.resume
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Resume
                    </a>
                  )}
                  {(getRole() === "admin" || getRole() === "super") && (
                    <button
                      className="btn btn-danger"
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
      {error && <div className="msg">{error}</div>}
    </div>
  );
}
