import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

export default function Apply() {
  const [params] = useSearchParams();
  const job = params.get("job") || "";
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // "error" | "success"
  const [resumePath, setResumePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [contact, setContact] = useState("");
  const fileInputRef = useRef();
  const nav = useNavigate();

  useEffect(() => {
    document.title = job ? `Apply - ${job}` : "Apply";
  }, [job]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsgType("");
    setMsg("Submitting...");
    const form = new FormData(e.target);
    // include pre-uploaded resume path when available
    if (resumePath) form.append("resumePath", resumePath);
    const api = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    // client-side contact validation
    if (!contact || contact.length !== 10) {
      setMsgType("error");
      setMsg("Contact must be 10 digits");
      return;
    }
    try {
      const res = await fetch(api + "/api/apply", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (data.ok) {
        setMsgType("success");
        setMsg("Application submitted successfully.");
        e.target.reset();
        setResumePath("");
        if (fileInputRef.current) fileInputRef.current.value = null;
      } else setMsg(data.error || "Submission failed");
    } catch (err) {
      setMsgType("error");
      setMsg("Server error - ensure backend is running");
    }
  }

  function handleCancel(e) {
    // reset form and navigate back to jobs
    if (fileInputRef.current) fileInputRef.current.value = null;
    setResumePath("");
    setMsg("");
    nav("/jobs");
  }

  // compute age from DOB
  function handleDobChange(e) {
    const v = e.target.value;
    if (!v) return;
    const dobDate = new Date(v);
    const now = new Date();
    let age = now.getFullYear() - dobDate.getFullYear();
    const m = now.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dobDate.getDate())) age--;
    const ageInput = document.querySelector('input[name="age"]');
    if (ageInput) ageInput.value = age;
  }

  // handle resume file selection and pre-upload
  async function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setMsg("");
    setMsgType("");
    if (!f) {
      setResumePath("");
      return;
    }
    // attempt upload
    const api = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    const fd = new FormData();
    fd.append("resume", f);
    setUploading(true);
    try {
      const res = await fetch(api + "/api/apply/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.ok && data.path) {
        setResumePath(data.path);
        setMsgType("success");
        setMsg("Resume uploaded");
      } else {
        setResumePath("");
        setMsgType("error");
        setMsg(data.error || "Upload failed");
      }
    } catch (err) {
      setResumePath("");
      setMsgType("error");
      setMsg("Network/upload failed");
    }
    setUploading(false);
  }

  function handleContactChange(e) {
    const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
    setContact(digits);
  }

  return (
    <div className="apply-card">
      <h2>Apply{job ? ` — ${job}` : ""}</h2>
      <form onSubmit={onSubmit}>
        <input name="jobTitle" defaultValue={job} hidden />
        {job ? (
          <div className="row">
            <label>Selected Job</label>
            <input value={job} disabled />
          </div>
        ) : null}
        <div className="row">
          <label>Name</label>
          <input name="name" required />
        </div>
        <div className="row">
          <label>
            Age <span style={{ color: "red" }}>*</span>
          </label>
          <input name="age" type="number" required readOnly />
        </div>
        <div className="row">
          <label>
            D.O.B <span style={{ color: "red" }}>*</span>
          </label>
          <input name="dob" type="date" onChange={handleDobChange} required />
        </div>
        <div className="row">
          <label>
            Address <span style={{ color: "red" }}>*</span>
          </label>
          <textarea name="address" required />
        </div>
        <div className="row">
          <label>
            Contact <span style={{ color: "red" }}>*</span>
          </label>
          <input
            name="contact"
            value={contact}
            onChange={handleContactChange}
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            required
          />
          {contact && contact.length !== 10 && (
            <div className="small" style={{ color: "red" }}>
              Contact must be 10 digits
            </div>
          )}
        </div>
        <div className="row">
          <label>
            Resume <span style={{ color: "red" }}>*</span>
          </label>
          <input
            ref={fileInputRef}
            name="resume"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
          />
        </div>
        <div className="row d-flex align-items-center gap-2">
          <button
            className="btn btn-success btn-lg"
            type="submit"
            disabled={uploading || !resumePath || contact.length !== 10}
          >
            {uploading ? "Uploading..." : "Submit Application"}
          </button>
          <button
            className="btn btn-secondary btn-lg"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
      {msg && (
        <div
          className="msg"
          style={{ color: msgType === "error" ? "red" : "green" }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
