import React from "react";
import welder from "../assets/welder.jpg";
import fitter from "../assets/fitter.png";
import fabricator from "../assets/fabricator.jpg";
import helper from "../assets/helper.webp";
import HouseKeeping from "../assets/house keeping.webp";
import { Link } from "react-router-dom";

const JOBS = [
  {
    title: "Welder",
    slug: "welder",
    desc: "Skilled welder for industrial and construction tasks.",
    img: welder,
  },
  {
    title: "Fitter",
    slug: "fitter",
    desc: "Experienced fitter for mechanical assemblies.",
    img: fitter,
  },
  {
    title: "Fabricator",
    slug: "fabricator",
    desc: "Metal fabricator for bespoke structures and parts.",
    img: fabricator,
  },
  {
    title: "Helper",
    slug: "helper",
    desc: "General helper for site assistance and logistics.",
    img: helper,
  },
  {
    title: "House Keeping",
    slug: "house-keeping",
    desc: "House keeping staff for residential and commercial properties.",
    img: HouseKeeping,
  },
];

export default function Jobs() {
  return (
    <div>
      <h2>Available Jobs</h2>
      <div className="grid">
        {JOBS.map((j) => (
          <div key={j.slug} className="card">
            <img src={j.img} alt={j.title} />
            <div className="card-body">
              <h5>{j.title}</h5>
              <p>{j.desc}</p>
              <Link
                to={`/apply?job=${encodeURIComponent(j.title)}`}
                className="btn btn-lg btn-primary d-flex align-items-center gap-2 shadow-sm"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Apply Now</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
