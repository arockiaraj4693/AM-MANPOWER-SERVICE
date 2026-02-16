import React, { useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Home from "../pages/Home";
import About from "../pages/About";
import Jobs from "../pages/Jobs";
import Location from "../pages/Location";
import Apply from "../pages/Apply";
import AdminLogin from "../admin/Login";
import AdminRegister from "../admin/Register";
import AdminDashboard from "../admin/Dashboard";
import AdminSupervisors from "../admin/Supervisors";
import AdminAdmins from "../admin/Admins";

export default function AnimatedRoutes() {
  const location = useLocation();
  const nodeRef = useRef(null); // 👈 added

  return (
    <TransitionGroup component={null}>
      <CSSTransition
        key={location.pathname}
        classNames="page"
        timeout={450}
        unmountOnExit
        nodeRef={nodeRef} // 👈 added
      >
        <div ref={nodeRef} className="page-wrapper"> {/* 👈 added */}
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/location" element={<Location />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/supervisors" element={<AdminSupervisors />} />
            <Route path="/admin/admins" element={<AdminAdmins />} />
          </Routes>
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
}
