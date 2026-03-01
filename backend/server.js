// ====== ENV MUST LOAD FIRST ======
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

// ====== CORE IMPORTS ======
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

// ====== APP INIT ======
const app = express();

// Security headers
app.use(helmet());

// CORS - restrict to known origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://ammanpowerservice.vercel.app",
  process.env.FRONTEND_BASE,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

// Sanitize MongoDB query injection
app.use(mongoSanitize());

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/admin/login", authLimiter);
app.use("/api/admin/forgot-password", authLimiter);
app.use("/api/admin/reset-password", authLimiter);
app.use("/api/admin/register", authLimiter);
app.use("/api/admin/first-register", authLimiter);

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", generalLimiter);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ====== MODELS ======
const Job = require("./models/Job");

// ====== ROUTES ======
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/apply", require("./routes/apply"));
app.use("/api/admin", require("./routes/admin"));

// ====== BASIC HEALTH CHECK ======
app.get("/", (req, res) => {
  res.json({ ok: true, message: "AM Manpower backend running" });
});

// ====== CONFIG ======
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL;

// ====== GLOBAL ERROR SAFETY ======
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// ====== DATABASE CONNECTION ======
async function connectDB() {
  if (!DB_URL) {
    console.warn("DB_URL not set. Running without database.");
    return;
  }

  try {
    await mongoose.connect(DB_URL);
    console.log("MongoDB connected");

    const count = await Job.countDocuments();
    if (count === 0) {
      await Job.insertMany([
        {
          title: "Welder",
          slug: "welder",
          description: "Skilled welder for industrial and construction tasks.",
          image: "/assets/welder.jpg",
        },
        {
          title: "Fitter",
          slug: "fitter",
          description: "Experienced fitter for mechanical assemblies.",
          image: "/assets/fitter.png",
        },
        {
          title: "Fabricator",
          slug: "fabricator",
          description: "Metal fabricator for bespoke structures and parts.",
          image: "/assets/fabricator.jpg",
        },
        {
          title: "Helper",
          slug: "helper",
          description: "General helper for site assistance and logistics.",
          image: "/assets/helper.webp",
        },
        {
          title: "House Keeping",
          slug: "house-keeping",
          description:
            "House keeping staff for residential and commercial properties.",
          image: "/assets/house-keeping.webp",
        },
      ]);
      console.log("Jobs seeded");
    }
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
}

// ====== 404 HANDLER ======
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// ====== EXPRESS ERROR HANDLER ======
app.use((err, req, res, next) => {
  console.error("Express error:", err.message);
  res.status(500).json({ error: "Server error" });
});

// ====== START SERVER ======
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${port} in use, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
}

// ====== BOOTSTRAP ======
connectDB();
startServer(PORT);
