import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeIndicatorStyle, setActiveIndicatorStyle] = useState({});
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Update active indicator position on desktop
  useEffect(() => {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink && window.innerWidth > 768) {
      const { offsetLeft, offsetWidth } = activeLink;
      setActiveIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [location]);

  const navLinks = [
    { path: "/", label: "Home", icon: "" },
    { path: "/radio", label: "Radio", icon: "" },
    { path: "/projects", label: "Projects", icon: "" }
  ];

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="logo-text">
            Jorge<span>Stream</span>
          </div>
        </Link>

        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-links ${mobileMenuOpen ? "active" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${
                location.pathname === link.path ? "active" : ""
              }`}
            >
              <span className="nav-link-icon">{link.icon}</span>
              <span className="nav-link-text">{link.label}</span>
            </Link>
          ))}
          <div 
            className="active-indicator" 
            style={activeIndicatorStyle}
          />
        </div>

        <div className="nav-actions">
          <button className="theme-toggle" aria-label="Toggle theme">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3V4M12 20V21M21 12H20M4 12H3M18.364 5.636L17.657 6.343M6.343 17.657L5.636 18.364M18.364 18.364L17.657 17.657M6.343 6.343L5.636 5.636" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;