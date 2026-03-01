const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const dotenv = require("dotenv");
const Application = require("../models/Application");
const Admin = require("../models/Admin");
const PendingRegistration = require("../models/PendingRegistration");
const ActivityLog = require("../models/ActivityLog");
const auth = require("../middleware/auth");

dotenv.config({ path: path.join(__dirname, "..", "config.env") });

const authMiddleware = auth.authMiddleware;
const requireSuper = auth.requireSuper;
const requireAdminOrSuper = auth.requireAdminOrSuper;

// POST /api/admin/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
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
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "12h" },
    );
    return res.json({ ok: true, token, role: admin.role });
  } catch (err) {
    console.error("Login error", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/forgot-password - generate reset token and return it (no email)
router.post("/forgot-password", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ error: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    admin.resetToken = token;
    admin.resetTokenExpires = expiresAt;
    await admin.save();

    res.json({ ok: true, token });
  } catch (err) {
    console.error("Forgot password error", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/reset-password - consume token and set new password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: "Token and password required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!admin) return res.status(400).json({ error: "Invalid or expired token" });

    admin.password = password;
    admin.resetToken = undefined;
    admin.resetTokenExpires = undefined;
    await admin.save();

    res.json({ ok: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/register - anyone can submit a registration request
// Stores pending registration with hashed password; super admin must approve
router.post("/register", async (req, res) => {
  const { email, password, role, phone } = req.body;
  const userEmail = (email || "").toString().trim().toLowerCase();
  if (!userEmail || !password || !phone)
    return res.status(400).json({ error: "Email, password and phone required" });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userEmail))
    return res.status(400).json({ error: "Invalid email address" });
  if (!["admin", "supervisor"].includes(role))
    return res.status(400).json({ error: "Invalid role" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    const existsAdmin = await Admin.findOne({
      $or: [{ username: userEmail }, { email: userEmail }],
    });
    if (existsAdmin) return res.status(400).json({ error: "Email already registered" });

    const existsPending = await PendingRegistration.findOne({ email: userEmail });
    if (existsPending)
      return res.status(400).json({ error: "A request with this email is already pending" });

    const pending = new PendingRegistration({
      email: userEmail,
      password,
      role: role || "supervisor",
      phone,
    });
    await pending.save();

    res.json({
      ok: true,
      message:
        "Your registration request has been submitted. Please wait for the Super Admin to approve your request. Once approved, you can log in with your email and password.",
    });
  } catch (err) {
    console.error("Register error", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/pending - super admin sees all pending registrations
router.get("/pending", authMiddleware, requireSuper, async (req, res) => {
  try {
    const items = await PendingRegistration.find({ status: "pending" })
      .select("email phone role createdAt")
      .sort({ createdAt: -1 });
    res.json({ ok: true, items });
  } catch (err) {
    console.error("Pending list error", err.message);
    res.status(500).json({ error: "Unable to fetch pending registrations" });
  }
});

// POST /api/admin/pending/:id/accept - super admin accepts a pending registration
router.post("/pending/:id/accept", authMiddleware, requireSuper, async (req, res) => {
  try {
    const pending = await PendingRegistration.findById(req.params.id);
    if (!pending) return res.status(404).json({ error: "Request not found" });
    if (pending.status !== "pending")
      return res.status(400).json({ error: "Request already processed" });

    const existsAdmin = await Admin.findOne({
      $or: [{ username: pending.email }, { email: pending.email }],
    });
    if (existsAdmin) {
      await PendingRegistration.findByIdAndDelete(req.params.id);
      return res.status(400).json({ error: "Email already registered as admin" });
    }

    // Insert directly to avoid re-hashing the already-hashed password
    await Admin.collection.insertOne({
      username: pending.email,
      email: pending.email,
      password: pending.password,
      role: pending.role,
      phone: pending.phone,
      createdAt: new Date(),
    });

    await PendingRegistration.findByIdAndDelete(req.params.id);

    res.json({ ok: true, message: "Registration accepted. User can now log in." });
  } catch (err) {
    console.error("Accept pending error", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/pending/:id - super admin rejects/deletes a pending registration
router.delete("/pending/:id", authMiddleware, requireSuper, async (req, res) => {
  try {
    const pending = await PendingRegistration.findById(req.params.id);
    if (!pending) return res.status(404).json({ error: "Request not found" });
    await PendingRegistration.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Registration request deleted" });
  } catch (err) {
    console.error("Delete pending error", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Unprotected first-register: allow creating initial super admin if none exist
router.post("/first-register", async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0)
      return res.status(403).json({ error: "Super admin already exists" });
    const { email, password, secret } = req.body;
    const FIRST_SECRET = process.env.FIRST_REGISTER_SECRET;
    if (!FIRST_SECRET || secret !== FIRST_SECRET)
      return res.status(403).json({ error: "Invalid secret" });
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });
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

// GET /api/admin/first-register - check if initial super creation is allowed
router.get("/first-register", async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0)
      return res.status(403).json({ error: "Super admin already exists" });
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

// DELETE /api/admin/users/:id - only super can delete
router.delete("/users/:id", authMiddleware, requireSuper, async (req, res) => {
  try {
    const id = req.params.id;
    const u = await Admin.findById(id);
    if (!u) return res.status(404).json({ error: "User not found" });
    if (u._id.toString() === req.admin.id)
      return res.status(400).json({ error: "Cannot delete yourself" });
    await Admin.findByIdAndDelete(id);

    await ActivityLog.create({
      action: "delete_user",
      performedBy: req.admin.username,
      performedByRole: req.admin.role,
      targetId: u._id.toString(),
      targetName: u.username,
      targetEmail: u.email,
      details: `Deleted ${u.role} account`,
    });

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

// DELETE /api/admin/applications/:id - admin or super
router.delete(
  "/applications/:id",
  authMiddleware,
  requireAdminOrSuper,
  async (req, res) => {
    try {
      const id = req.params.id;
      const app = await Application.findById(id);
      if (!app) return res.status(404).json({ error: "Application not found" });

      await Application.findByIdAndDelete(id);

      await ActivityLog.create({
        action: "delete_application",
        performedBy: req.admin.username,
        performedByRole: req.admin.role,
        targetId: id,
        targetName: app.name,
        details: `Deleted application for job: ${app.jobTitle || "-"}`,
      });

      res.json({ ok: true });
    } catch (err) {
      console.error("Delete application error", err.message);
      res.status(500).json({ error: "Delete failed" });
    }
  },
);

// GET /api/admin/logs - super admin only
router.get("/logs", authMiddleware, requireSuper, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit));
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.max(1, parseInt(limit)));
    const total = await ActivityLog.countDocuments();
    res.json({ ok: true, total, items: logs });
  } catch (err) {
    console.error("Logs error", err.message);
    res.status(500).json({ error: "Unable to fetch logs" });
  }
});

module.exports = router;
