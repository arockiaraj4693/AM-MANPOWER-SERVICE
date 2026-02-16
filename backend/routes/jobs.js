const express = require("express");
const router = express.Router();
const Job = require("../models/Job");

// GET /api/jobs - list jobs (fallback to static if DB not ready)
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ title: 1 });
    if (!jobs || jobs.length === 0) {
      return res.json([
        {
          title: "Welder",
          slug: "welder",
          description: "Skilled welder",
          image:
            "https://images.unsplash.com/photo-1581092918363-1b7fb9b8f9b0?auto=format&fit=crop&w=800&q=60",
        },
        {
          title: "Fitter",
          slug: "fitter",
          description: "Experienced fitter",
          image:
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=60",
        },
      ]);
    }
    res.json(jobs);
  } catch (err) {
    console.error("Jobs error:", err.message);
    res.status(500).json({ error: "Unable to fetch jobs" });
  }
});

// GET /api/jobs/:slug - single job
router.get("/:slug", async (req, res) => {
  try {
    const job = await Job.findOne({ slug: req.params.slug });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
