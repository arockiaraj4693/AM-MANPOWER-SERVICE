const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const path = require("path");
const dotenv = require("dotenv");
const Application = require("../models/Application");
const Admin = require("../models/Admin");
const Otp = require("../models/Otp");
const { sendMail } = require("../utils/mailer");
const auth = require("../middleware/auth");
const authMiddleware = auth.authMiddleware;
const requireSuper = auth.requireSuper;
const requireAdminOrSuper = auth.requireAdminOrSuper;
const requireAtLeastSupervisor = auth.requireAtLeastSupervisor;

dotenv.config({ path: path.join(__dirname, "..", "config.env") });

// POST /api/admin/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER || "";
  const adminPass = process.env.ADMIN_PASS || "";
  const isSuper = (process.env.ADMIN_IS_SUPER || "false") === "true";
  if (!username || !password)
    return res.status(400).json({ error: "username and password required" });
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const payload = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    };
    const token = jwt.sign(
      payload,
      process.env.ADMIN_JWT_SECRET || "changeme",
      { expiresIn: "12h" },
    );
    return res.json({ ok: true, token, role: admin.role });
  } catch (err) {
    console.error("Login error", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Request OTP for registration or reset
router.post("/otp/request", async (req, res) => {
  try {
    const { email, purpose = "register" } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    const o = new Otp({ email, code, purpose, expiresAt });
    await o.save();
    // send HTML email
    const company = "A M MANPOWER SERVICE";
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.4">
        <h2>${company}</h2>
        <p>Your OTP for ${purpose} is:</p>
        <p style="font-size:20px;font-weight:bold">${code}</p>
        <p>This OTP will expire in 15 minutes.</p>
      </div>
    `;
    await sendMail(email, `${company} — Your OTP`, html);
    res.json({ ok: true, message: "OTP sent" });
  } catch (err) {
    console.error("OTP request error", err && err.message ? err.message : err);
    res.status(500).json({ error: "Unable to send OTP" });
  }
});

// Verify OTP
router.post("/otp/verify", async (req, res) => {
  try {
    const { email, code, purpose = "register" } = req.body;
    if (!email || !code)
      return res.status(400).json({ error: "email and code required" });
    const o = await Otp.findOne({ email, code, purpose }).sort({
      createdAt: -1,
    });
    if (!o) return res.status(400).json({ error: "Invalid code" });
    if (o.expiresAt && o.expiresAt < new Date())
      return res.status(400).json({ error: "OTP expired" });
    o.verified = true;
    await o.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("OTP verify error", err && err.message ? err.message : err);
    res.status(500).json({ error: "Unable to verify" });
  }
});

// Forgot password - send reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });
    const token = Math.random().toString(36).slice(2, 12);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    const o = new Otp({ email, purpose: "reset", token, expiresAt });
    await o.save();
    const company = "A M MANPOWER SERVICE";
    const resetLink = `${process.env.FRONTEND_BASE || "http://localhost:3000"}/admin/reset-password?token=${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.4">
        <h2>${company}</h2>
        <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
        <p><a href="${resetLink}">Reset password</a></p>
      </div>
    `;
    await sendMail(email, `${company} — Reset password`, html);
    res.json({ ok: true, message: "Reset link sent" });
  } catch (err) {
    console.error(
      "Forgot password error",
      err && err.message ? err.message : err,
    );
    res.status(500).json({ error: "Unable to send reset link" });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: "token and password required" });
    const o = await Otp.findOne({ token, purpose: "reset" }).sort({
      createdAt: -1,
    });
    if (!o) return res.status(400).json({ error: "Invalid token" });
    if (o.expiresAt && o.expiresAt < new Date())
      return res.status(400).json({ error: "Token expired" });
    const admin = await Admin.findOne({ email: o.email });
    if (!admin) return res.status(404).json({ error: "User not found" });
    admin.password = password;
    await admin.save();
    res.json({ ok: true, message: "Password reset" });
  } catch (err) {
    console.error(
      "Reset password error",
      err && err.message ? err.message : err,
    );
    res.status(500).json({ error: "Unable to reset" });
  }
});

// POST /api/admin/register
// - Super users can invite an admin/supervisor by email+phone+role
// - Instead of sending an OTP code, send a timed tokenized link to set password
router.post("/register", authMiddleware, requireSuper, async (req, res) => {
  const { username, role, email, phone } = req.body;
  const userEmail = (email || username || "").toString().trim();
  if (!userEmail || !phone)
    return res.status(400).json({ error: "email and phone required" });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userEmail))
    return res.status(400).json({ error: "Invalid email address" });
  if (!["super", "admin", "supervisor"].includes(role))
    return res.status(400).json({ error: "Invalid role" });

  try {
    const exists = await Admin.findOne({
      $or: [{ username: userEmail }, { email: userEmail }],
    });
    if (exists) return res.status(400).json({ error: "User exists" });

    // remove any previous register tokens/codes for this email
    await Otp.deleteMany({ email: userEmail, purpose: "register" });

    // create a tokenized Otp entry with meta payload
    const crypto = require("crypto");
    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    const meta = {
      username: userEmail,
      email: userEmail,
      role,
      phone,
    };
    const o = new Otp({
      email: userEmail,
      token,
      purpose: "register",
      expiresAt,
      meta,
    });
    await o.save();

    const company = "A M MANPOWER SERVICE";
    const frontend = process.env.FRONTEND_BASE || "http://localhost:3000";
    const link = `${frontend}/admin/complete-registration?token=${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.4">
        <h2>${company}</h2>
        <p>You have been invited to join as <strong>${role}</strong>. Click the link below to set your password and complete registration. The link is valid for 15 minutes.</p>
        <p><a href="${link}">Complete registration</a></p>
      </div>
    `;
    await sendMail(userEmail, `${company} — Complete your account`, html);
    return res.json({ ok: true, message: "Invite sent" });
  } catch (err) {
    console.error("Register error", err && err.message ? err.message : err);
    res.status(500).json({ error: "Server error" });
  }
});

// Confirm registration using tokenized link (public)
// Expects { token, password }
router.post("/register/confirm", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: "token and password required" });
    const o = await Otp.findOne({ token, purpose: "register" }).sort({
      createdAt: -1,
    });
    if (!o) return res.status(400).json({ error: "Invalid or used token" });
    if (o.expiresAt && o.expiresAt < new Date())
      return res.status(400).json({ error: "Token expired" });

    const meta = o.meta || {};
    const userEmail = meta.email;
    if (!userEmail)
      return res.status(400).json({ error: "Invalid token meta" });
    const exists = await Admin.findOne({
      $or: [{ username: userEmail }, { email: userEmail }],
    });
    if (exists) return res.status(400).json({ error: "User exists" });

    const a = new Admin({
      username: userEmail,
      email: userEmail,
      password,
      role: meta.role || "supervisor",
      phone: meta.phone,
    });
    await a.save();

    // remove any register tokens for this email (cleanup)
    await Otp.deleteMany({ email: userEmail, purpose: "register" });

    // notify created user
    try {
      const company = "A M MANPOWER SERVICE";
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.4">
          <h2>${company}</h2>
          <p>Your account has been created with role <strong>${a.role}</strong>.</p>
          <p>Username: ${a.email}</p>
        </div>
      `;
      await sendMail(a.email, `${company} — Account created`, html);
    } catch (e) {
      console.error("Post-create mail failed", e && e.message ? e.message : e);
    }
    res.json({ ok: true, user: { username: a.username, role: a.role } });
  } catch (err) {
    console.log(
      "Register confirm error",
      err && err.message ? err.message : err,
    );
    res.status(500).json({ error: "Unable to confirm registration" });
  }
});

// Unprotected first-register: allow creating initial super admin if none exist
router.post("/first-register", async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0)
      return res
        .status(403)
        .json({ error: "Use admin/register (super only) to add users" });
    const { email, password, secret } = req.body;
    const FIRST_SECRET = process.env.FIRST_REGISTER_SECRET || "@King";
    if (secret !== FIRST_SECRET)
      return res.status(403).json({ error: "Invalid secret" });
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ error: "User exists" });
    const a = new Admin({ username: email, email, password, role: "super" });
    await a.save();
    res.json({ ok: true, message: "Super admin created" });
  } catch (err) {
    console.error("First register error", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/first-register - check availability for initial super creation
router.get("/first-register", async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0)
      return res
        .status(403)
        .json({ error: "Use admin/register (super only) to add users" });
    return res.json({ ok: true, message: "No admins yet" });
  } catch (err) {
    console.error("First register check error", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/users - list users, optional ?role=supervisor
router.get("/users", authMiddleware, requireAdminOrSuper, async (req, res) => {
  try {
    const { role } = req.query;
    const q = {};
    if (role) q.role = role;
    const items = await Admin.find(q).select(
      "username role email phone createdAt",
    );
    res.json({ ok: true, items });
  } catch (err) {
    console.error("Admin users error", err.message);
    res.status(500).json({ error: "Unable to fetch users" });
  }
});

// DELETE /api/admin/users/:id - only super can delete; supervisors cannot be deleted
router.delete("/users/:id", authMiddleware, requireSuper, async (req, res) => {
  try {
    const id = req.params.id;
    const u = await Admin.findById(id);
    if (!u) return res.status(404).json({ error: "User not found" });
    if (u.role === "supervisor")
      return res.status(403).json({ error: "Supervisors cannot be deleted" });
    await Admin.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete user error", err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

// GET /api/admin/applications - list with filters, sort, paging
router.get("/applications", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      jobTitle,
      contact,
      sort = "-createdAt",
      page = 1,
      limit = 50,
    } = req.query;
    const q = {};
    if (name) q.name = new RegExp(name, "i");
    if (jobTitle) q.jobTitle = new RegExp(jobTitle, "i");
    if (contact) q.contact = new RegExp(contact, "i");
    const skip =
      (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit));
    const docs = await Application.find(q)
      .sort(sort)
      .skip(skip)
      .limit(Math.max(1, parseInt(limit)));
    const total = await Application.countDocuments(q);
    res.json({ ok: true, total, items: docs, role: req.admin.role });
  } catch (err) {
    console.error("Admin applications error:", err.message);
    res.status(500).json({ error: "Unable to fetch" });
  }
});

// DELETE /api/admin/applications/:id - super only
// DELETE /api/admin/applications/:id - admin or super allowed (supervisor not)
router.delete(
  "/applications/:id",
  authMiddleware,
  requireAdminOrSuper,
  async (req, res) => {
    try {
      const id = req.params.id;
      await Application.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Delete failed" });
    }
  },
);

module.exports = router;
