// pages/ProjectsPage.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import projectService from "../services/projectService";
import "../styles/projects.css";

// ─── Pure helpers (outside component — no deps on React state) ───────────────

const FILTERS = [
  { value: "all", label: "All" },
  { value: "studio", label: "Studios" },
  { value: "network", label: "Networking" },
  { value: "telecom", label: "Telecom" }
];

/**
 * Resolve the best available URL from an image object.
 * Priority: full_url → file_path → url → placeholder
 */
const resolveImageUrl = (image, fallback = "/api/placeholder/400/300") => {
  if (!image) return fallback;
  if (image.full_url) return image.full_url;
  if (image.file_path) return projectService.getImageUrl(image.file_path);
  if (image.url) return projectService.getImageUrl(image.url);
  return fallback;
};

/**
 * Return all images for a project, always as an array.
 */
const getAllImagesFromProject = (project) => {
  if (project.images && project.images.length > 0) return project.images;
  if (project.primary_image) return [project.primary_image];
  return [];
};

/**
 * Return the URL for a project's cover image (primary or first image).
 */
const getProjectCoverUrl = (project) => {
  if (project.primary_image) return resolveImageUrl(project.primary_image);
  const images = getAllImagesFromProject(project);
  return images.length > 0
    ? resolveImageUrl(images[0])
    : "/api/placeholder/400/300";
};

/**
 * Group an array of projects by country, sorted alphabetically.
 */
const groupByCountry = (projects) => {
  const groups = {};
  projects.forEach((project) => {
    const key = (project.country || "unknown").toUpperCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(project);
  });

  return Object.keys(groups)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = groups[key];
      return sorted;
    }, {});
};

// ─── Shared shell ─────────────────────────────────────────────────────────────

const PageShell = ({ children }) => (
  <div className="projects-page">
    <Navbar />
    {children}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ProjectsPage = () => {
  const [filter, setFilter] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentProjects, setCurrentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const touchStartX = useRef(0);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projects = await projectService.getGalleryProjects(filter);
      setCurrentProjects(projects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Lightbox helpers ─────────────────────────────────────────────────────────

  const openLightbox = useCallback(
    (projectId) => {
      const index = currentProjects.findIndex((p) => p.id === projectId);
      if (index !== -1) {
        setCurrentProjectIndex(index);
        setCurrentImageIndex(0);
        setLightboxOpen(true);
        document.body.style.overflow = "hidden";
      }
    },
    [currentProjects]
  );

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "auto";
  }, []);

  // Navigate between projects
  const nextProject = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setCurrentProjectIndex((prev) => (prev + 1) % currentProjects.length);
      setCurrentImageIndex(0);
    },
    [currentProjects.length]
  );

  const prevProject = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setCurrentProjectIndex(
        (prev) => (prev - 1 + currentProjects.length) % currentProjects.length
      );
      setCurrentImageIndex(0);
    },
    [currentProjects.length]
  );

  // Navigate between images within a project
  const nextImage = useCallback((e, totalImages) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  }, []);

  const prevImage = useCallback((e, totalImages) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, []);

  // ── Keyboard navigation ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      const images = currentProjects[currentProjectIndex]
        ? getAllImagesFromProject(currentProjects[currentProjectIndex])
        : [];

      switch (e.key) {
        case "ArrowRight":
          // If multiple images in project, navigate images; otherwise change project
          images.length > 1 ? nextImage(e, images.length) : nextProject(e);
          break;
        case "ArrowLeft":
          images.length > 1 ? prevImage(e, images.length) : prevProject(e);
          break;
        case "Escape":
          closeLightbox();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    lightboxOpen,
    currentProjectIndex,
    currentProjects,
    nextProject,
    prevProject,
    nextImage,
    prevImage,
    closeLightbox
  ]);

  // ── Ensure body overflow is reset on unmount ─────────────────────────────────

  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // ── Touch swipe ──────────────────────────────────────────────────────────────

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) > 50) {
        const images = currentProjects[currentProjectIndex]
          ? getAllImagesFromProject(currentProjects[currentProjectIndex])
          : [];
        if (images.length > 1) {
          diff > 0 ? prevImage(e, images.length) : nextImage(e, images.length);
        } else {
          diff > 0 ? prevProject(e) : nextProject(e);
        }
      }
    },
    [
      currentProjectIndex,
      currentProjects,
      nextImage,
      prevImage,
      nextProject,
      prevProject
    ]
  );

  // ── Derived values ────────────────────────────────────────────────────────────

  const groupedProjects = groupByCountry(currentProjects);
  const currentProject = currentProjects[currentProjectIndex];
  const currentProjectImages = currentProject
    ? getAllImagesFromProject(currentProject)
    : [];
  const activeImage = currentProjectImages[currentImageIndex];

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageShell>
        <div className="loading-container">
          <div className="loader" />
          <p>Loading projects...</p>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Projects</h3>
          <p>{error}</p>
          <p className="error-hint">
            Make sure the backend server is running on http://localhost:8000
          </p>
          <button onClick={fetchProjects} className="retry-btn">
            Retry
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="projects-header">
        <h1>PROJECTS</h1>
        <p>Studio Installations · Networking · Telecommunications</p>
      </section>

      {/* ── Filters ── */}
      <div className="filters">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Gallery ── */}
      <div className="gallery">
        {Object.keys(groupedProjects).length === 0 ? (
          <div className="gallery-empty">
            <div>📷</div>
            <p>No projects found in this category</p>
            <button onClick={fetchProjects} className="retry-btn">
              Refresh
            </button>
          </div>
        ) : (
          Object.entries(groupedProjects).map(([country, projects]) => (
            <div key={country} className="country-section">
              <h2 className="country-title">{country}</h2>
              <div className="country-grid">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="project-card"
                    onClick={() => openLightbox(project.id)}
                  >
                    <img
                      src={getProjectCoverUrl(project)}
                      alt={project.title || "Project"}
                      onError={(e) => {
                        e.target.src = "/api/placeholder/400/300";
                      }}
                    />
                    <div className="overlay">
                      <h3>{project.title || "Untitled Project"}</h3>
                      <p>{project.description || "No description available"}</p>
                      {project.category && (
                        <span className="project-category">
                          {project.category.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && currentProject && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="nav-btn prev" onClick={prevProject}>
            ❮
          </button>

          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {currentProjectImages.length > 0 ? (
              <>
                {/* Main image */}
                <img
                  src={resolveImageUrl(activeImage, "/api/placeholder/800/600")}
                  alt={`${currentProject.title || "Project"} – image ${
                    currentImageIndex + 1
                  } of ${currentProjectImages.length}`}
                  onError={(e) => {
                    e.target.src = "/api/placeholder/800/600";
                  }}
                />

                {/* Per-image navigation (only when project has multiple images) */}
                {currentProjectImages.length > 1 && (
                  <div className="image-nav">
                    <button
                      className="image-nav-btn"
                      onClick={(e) => prevImage(e, currentProjectImages.length)}
                    >
                      ‹
                    </button>
                    <span className="image-counter">
                      {currentImageIndex + 1} / {currentProjectImages.length}
                    </span>
                    <button
                      className="image-nav-btn"
                      onClick={(e) => nextImage(e, currentProjectImages.length)}
                    >
                      ›
                    </button>
                  </div>
                )}

                {/* Info */}
                <div className="image-info">
                  <h3>{currentProject.title || "Untitled Project"}</h3>
                  <p>
                    {currentProject.description || "No description available"}
                  </p>
                  <span className="image-category">
                    {currentProject.category?.toUpperCase() || "PROJECT"} ·{" "}
                    {currentProject.country?.toUpperCase() || "UNKNOWN"}
                  </span>
                  {currentProjectImages.length > 1 && (
                    <span className="image-count">
                      {currentProjectImages.length} images
                    </span>
                  )}
                </div>

                {/* Thumbnail strip */}
                {currentProjectImages.length > 1 && (
                  <div className="thumb-strip">
                    {currentProjectImages.map((image, index) => (
                      <img
                        key={image.id ?? index}
                        src={resolveImageUrl(image)}
                        className={`thumb ${
                          index === currentImageIndex ? "active" : ""
                        }`}
                        alt={`${
                          currentProject.title || "Project"
                        } – thumbnail ${index + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="lightbox-no-image">
                <p>No images available for this project.</p>
              </div>
            )}
          </div>

          <button className="nav-btn next" onClick={nextProject}>
            ❯
          </button>
        </div>
      )}
    </PageShell>
  );
};

export default ProjectsPage;
