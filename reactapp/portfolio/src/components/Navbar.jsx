// Navbar.jsx - Professional Enterprise Version
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeIndicatorStyle, setActiveIndicatorStyle] = useState({});
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isThemeDark, setIsThemeDark] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();

  // Handle scroll with throttle for performance
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Update active indicator position
  useEffect(() => {
    const activeLink = document.querySelector(".nav-link.active");
    if (activeLink && window.innerWidth > 768) {
      const { offsetLeft, offsetWidth } = activeLink;
      setActiveIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth
      });
    }
  }, [location]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsThemeDark(!isThemeDark);
    document.documentElement.classList.toggle("dark-theme");
  }, [isThemeDark]);

  const navLinks = [
    { path: "/", label: "Home", description: "Overview" },
    { path: "/radio", label: "Radio", description: "Live Stream" },
    { path: "/projects", label: "Projects", description: "Portfolio" },
    { path: "/blog", label: "Blog", description: "Articles" }
  ];

  return (
    <nav
      ref={navRef}
      className={`navbar ${scrolled ? "scrolled" : ""}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo" aria-label="Homepage">
          <div className="logo-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="logo-text">
            Jorge<span>Stream</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${
                location.pathname === link.path ||
                (link.path === "/blog" &&
                  location.pathname.startsWith("/blog/"))
                  ? "active"
                  : ""
              }`}
              onMouseEnter={() => setHoveredLink(link.path)}
              onMouseLeave={() => setHoveredLink(null)}
              aria-current={
                location.pathname === link.path ? "page" : undefined
              }
            >
              <span className="nav-link-text">{link.label}</span>
              <span className="nav-link-description">{link.description}</span>
              {hoveredLink === link.path && <span className="nav-link-glow" />}
            </Link>
          ))}
          <div
            className="active-indicator"
            style={activeIndicatorStyle}
            aria-hidden="true"
          />
        </div>

        {/* Nav Actions */}
        <div className="nav-actions">
          <button
            className="theme-toggle"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3V4M12 20V21M21 12H20M4 12H3M18.364 5.636L17.657 6.343M6.343 17.657L5.636 18.364M18.364 18.364L17.657 17.657M6.343 6.343L5.636 5.636"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="12"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="theme-toggle-text">Theme</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Navigation */}
        <div
          className={`nav-links mobile-nav ${mobileMenuOpen ? "active" : ""}`}
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {mobileMenuOpen && (
            <button
              className="mobile-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          <div className="mobile-nav-header">
            <span className="mobile-nav-title">Navigation</span>
          </div>

          {navLinks.map((link, index) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${
                location.pathname === link.path ||
                (link.path === "/blog" &&
                  location.pathname.startsWith("/blog/"))
                  ? "active"
                  : ""
              }`}
              style={{ animationDelay: `${index * 0.06}s` }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-link-text">{link.label}</span>
              <span className="nav-link-description">{link.description}</span>
              {location.pathname === link.path && (
                <span className="mobile-active-indicator" />
              )}
            </Link>
          ))}

          <div className="mobile-nav-footer">
            <button className="mobile-theme-toggle" onClick={toggleTheme}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3V4M12 20V21M21 12H20M4 12H3M18.364 5.636L17.657 6.343M6.343 17.657L5.636 18.364M18.364 18.364L17.657 17.657M6.343 6.343L5.636 5.636"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span>Toggle Theme</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
