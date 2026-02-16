import React from "react";

export default function Home() {
  return (
    <div>
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-inner container">
          <h1 className="hero-title">
            <span className="word-1">Welcome to</span>{" "}
            <span className="word-2 accent">AM Manpower Service</span>
          </h1>
          <p className="hero-sub">
            Trusted manpower supply for industry and homes — Fitter, Welder,
            Fabricator, Helper, House Keeping
          </p>
          <div className="hero-ctas">
            <a className="btn primary" href="/jobs">
              View Jobs
            </a>
            {/* <a className="btn ghost" href="/apply">
              Apply Now
            </a> */}
          </div>
          <div className="hero-deco" aria-hidden="true"></div>
        </div>
      </section>

      <section className="container why-section">
        <h2 className="section-title">Why choose AM Manpower?</h2>
        <div className="features grid">
          <div className="feature-card">
            <div className="icon">👷</div>
            <h5>Skilled Staff</h5>
            <p>
              Trained fitters, welders and fabricators ready for deployment.
            </p>
          </div>
          <div className="feature-card">
            <div className="icon">✅</div>
            <h5>Verified</h5>
            <p>Background-checked and reliable workers you can trust.</p>
          </div>
          <div className="feature-card">
            <div className="icon">⚡</div>
            <h5>Quick Deployment</h5>
            <p>Fast onboarding and timely manpower supply to meet schedules.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
