import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "./assets/logo.png";
import AnimatedRoutes from "./components/AnimatedRoutes";

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => (document.body.style.overflow = "auto");
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
      <nav className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link to="/" className="brand d-flex align-items-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 12L12 3l9 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 21V12h6v9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ marginLeft: 8 }}>A M Manpower Service</span>
          </Link>

          <div className="navlinks d-none d-md-flex">
            <Link to="/">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M3 11.5L12 4l9 7.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 21V12h14v9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Home</span>
            </Link>
            <Link to="/about">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M12 8v4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="0.5" fill="currentColor" />
              </svg>
              <span>About</span>
            </Link>
            <Link to="/jobs">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <rect
                  x="3"
                  y="7"
                  width="18"
                  height="13"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M16 3h-8v4h8V3z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
              <span>Jobs</span>
            </Link>
            <Link to="/location">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M12 21s6-4.5 6-10a6 6 0 1 0-12 0c0 5.5 6 10 6 10z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="11" r="1.5" fill="currentColor" />
              </svg>
              <span>Location</span>
            </Link>
          </div>

          <div className="d-md-none d-flex align-items-center">
            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((s) => !s)}
              className={`hamburger-btn btn btn-light p-2 rounded ${mobileOpen ? "open" : ""}`}
            >
              <span className="bar" aria-hidden></span>
              <span className="bar" aria-hidden></span>
              <span className="bar" aria-hidden></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`mobile-drawer ${mobileOpen ? "open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileOpen(false)}
        ></div>
        <aside className={`mobile-drawer-panel bg-light`}>
          <div className="p-3 d-flex align-items-center justify-content-between border-bottom">
            <div className="font-bold">Menu</div>
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="btn btn-light p-2"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <nav className="p-3 d-flex flex-column gap-2">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="nav-link py-2"
            >
              Home
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className="nav-link py-2"
            >
              About
            </Link>
            <Link
              to="/jobs"
              onClick={() => setMobileOpen(false)}
              className="nav-link py-2"
            >
              Jobs
            </Link>
            <Link
              to="/location"
              onClick={() => setMobileOpen(false)}
              className="nav-link py-2"
            >
              Location
            </Link>
            <hr />
          </nav>
        </aside>
      </div>

      <main className="container main">
        <AnimatedRoutes />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <div className="brand small">AM Manpower Service</div>
            <div className="muted">
              We supply skilled manpower for industry and homes
            </div>
          </div>
          <div className="footer-actions">
            <a href="tel:9025700639" className="btn ghost">
              Call
            </a>
            <a
              href="https://wa.me/919025700639"
              target="_blank"
              rel="noreferrer"
              className="btn primary"
            >
              WhatsApp
            </a>
            <a
              href="mailto:hr.ammmanpowerservice@gmail.com"
              className="btn ghost"
            >
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
