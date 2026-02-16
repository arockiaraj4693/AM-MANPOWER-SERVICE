const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Application = require("../models/Application");
const Admin = require("../models/Admin");
const { sendMail } = require("../utils/mailer");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.fieldname + ext);
  },
});

const upload = multer({ storage });

// Upload-only endpoint: uploads resume and returns its public path
router.post("/upload", upload.single("resume"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const publicPath = "/uploads/" + req.file.filename;
    return res.json({ ok: true, path: publicPath });
  } catch (err) {
    console.error("Upload error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const { name, age, dob, address, contact, jobTitle } = req.body;
    // Validate required fields
    const uploadedFile = req.file;
    // allow pre-uploaded resume path via resumePath
    const resumePathFromBody = req.body.resumePath;
    if (!dob || !address || !age || (!uploadedFile && !resumePathFromBody)) {
      // delete file if uploaded
      if (uploadedFile) {
        try {
          fs.unlinkSync(path.join(uploadsDir, uploadedFile.filename));
        } catch (e) {}
      }
      return res
        .status(400)
        .json({ error: "dob, age, address and resume are required" });
    }

    const ageNum = parseInt(age, 10) || 0;
    // Age restriction: disallow > 42
    if (ageNum > 42) {
      // remove uploaded file
      try {
        fs.unlinkSync(path.join(uploadsDir, uploadedFile.filename));
      } catch (e) {}
      // save minimal record if you want, otherwise reject — here we mark as restricted and do not save
      return res
        .status(403)
        .json({ error: "Age exceeds limit (42). Application restricted." });
    }

    const resume = uploadedFile
      ? "/uploads/" + uploadedFile.filename
      : resumePathFromBody || "";
    const app = new Application({
      name,
      age: ageNum,
      dob,
      address,
      contact,
      jobTitle,
      resume,
      status: "pending",
    });
    await app.save();
    // notify supervisors by email
    try {
      const supervisors = await Admin.find({
        role: "supervisor",
        email: { $exists: true, $ne: "" },
      }).select("email");
      const emails = supervisors.map((s) => s.email).filter(Boolean);
      if (emails.length > 0) {
        const company = "A M MANPOWER SERVICE";
        const backendBase =
          process.env.BACKEND_BASE ||
          `http://localhost:${process.env.PORT || 5000}`;
        const resumeUrl =
          resume && resume.startsWith("/") ? backendBase + resume : resume;
        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.4">
            <h3>${company} — New Application</h3>
            <p><strong>Name:</strong> ${name || "-"}</p>
            <p><strong>Job:</strong> ${jobTitle || "-"}</p>
            <p><strong>Age:</strong> ${ageNum}</p>
            <p><strong>DOB:</strong> ${dob || "-"}</p>
            <p><strong>Contact:</strong> ${contact || "-"}</p>
            <p><strong>Address:</strong> ${address || "-"}</p>
            ${resumeUrl ? `<p><a href="${resumeUrl}">View Resume</a></p>` : ""}
          </div>
        `;
        for (const to of emails) {
          try {
            await sendMail(
              to,
              `${company} — New application from ${name || "applicant"}`,
              html,
            );
          } catch (e) {
            console.error(
              "Notify email failed for",
              to,
              e && e.message ? e.message : e,
            );
          }
        }
      }
    } catch (e) {
      console.error("Supervisor notify error:", e && e.message ? e.message : e);
    }
    res.json({ ok: true, message: "Application submitted" });
  } catch (err) {
    console.error("Apply error:", err.message);
    res.status(500).json({ error: "Unable to submit application" });
  }
});

module.exports = router;
