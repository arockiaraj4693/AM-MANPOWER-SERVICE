const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "config.env") });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const Job = require("./models/Job");

// Routes
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/apply", require("./routes/apply"));
app.use("/api/admin", require("./routes/admin"));

const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL || "";

// Safety: handle unhandled rejections so the server doesn't crash silently
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

if (!DB_URL) {
  // no DB configured
} else {
  const maxRetries = parseInt(process.env.DB_RETRY_MAX || "5");
  const retryDelay = parseInt(process.env.DB_RETRY_DELAY_MS || "3000");

  async function connectWithRetry(attempt = 0) {
    try {
      await mongoose.connect(DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      // MongoDB connected

      // Seed jobs if none exist
      try {
        const count = await Job.countDocuments();
        if (count === 0) {
          await Job.insertMany([
            {
              title: "Welder",
              slug: "welder",
              description:
                "Skilled welder for industrial and construction tasks.",
              image:
                "../public/assets/welder.jpg",
            },
            {
              title: "Fitter",
              slug: "fitter",
              description: "Experienced fitter for mechanical assemblies.",
              image:
                "../public/assets/fitter.png",
            },
            {
              title: "Fabricator",
              slug: "fabricator",
              description: "Metal fabricator for bespoke structures and parts.",
              image:
                "../public/assets/fabricator.jpg",
            },
            {
              title: "Helper",
              slug: "helper",
              description: "General helper for site assistance and logistics.",
              image:
                "../public/assets/helper.webp",
            },
            {
              title: "House Keeping",
              slug: "house-keeping",
              description:
                "House keeping staff for residential and commercial properties.",
              image:
                "../public/assets/house keeping.webp",
            },
          ]);
          console.log("Seeded jobs");
        }
      } catch (err) {
        console.error("Seeding error:", err && err.message ? err.message : err);
      }
    } catch (err) {
      console.error(
        `MongoDB connection attempt ${attempt + 1} failed: ${err && err.message ? err.message : err}`,
      );
      if (attempt < maxRetries) {
        setTimeout(() => connectWithRetry(attempt + 1), retryDelay);
      } else {
        console.error(
          "MongoDB connection failed after retries — continuing without DB.",
        );
      }
    }
  }

  connectWithRetry();
}

app.get("/", (req, res) =>
  res.json({ ok: true, message: "AM Manpower backend running" }),
);

// 404 handler - API returns JSON, browsers get a simple HTML page
app.use((req, res) => {
  const message = `Path ${req.originalUrl} not found`;
  if (req.accepts("html")) {
    return res
      .status(404)
      .send(
        `<!doctype html><html><head><meta charset="utf-8"><title>404 Not Found</title></head><body style="font-family:Arial,Helvetica,sans-serif;padding:32px;"><h1>404 — Not Found</h1><p>${message}</p></body></html>`,
      );
  }
  if (req.accepts("json"))
    return res.status(404).json({ error: "Not found", path: req.originalUrl });
  res.status(404).type("txt").send(message);
});

// Express error handler (must have 4 args)
app.use((err, req, res, next) => {
  console.error("Express error:", err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  const message = "Server error";
  if (req.accepts("html"))
    return res
      .status(500)
      .send(
        `<!doctype html><html><head><meta charset=\"utf-8\"><title>500 Server Error</title></head><body style=\"font-family:Arial,Helvetica,sans-serif;padding:32px;\"><h1>500 — Server Error</h1><p>${message}</p></body></html>`,
      );
  if (req.accepts("json")) return res.status(500).json({ error: message });
  res.status(500).type("txt").send(message);
});

// Start HTTP server immediately so API responds even if DB is unreachable
// Start server with basic retry on EADDRINUSE and graceful error handlers
function startServer(port, triedPorts = []) {
  const server = app.listen(port);

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      // port in use
      // avoid infinite retry loops
      triedPorts.push(port);
      const nextPort = port + 1;
      if (triedPorts.includes(nextPort)) {
        console.error("No available ports to bind. Exiting.");
        process.exit(1);
      }
      // trying next port
      setTimeout(() => startServer(nextPort, triedPorts), 300);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
}

startServer(PORT);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err && err.stack ? err.stack : err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
