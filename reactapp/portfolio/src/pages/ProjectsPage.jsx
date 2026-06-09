// pages/ProjectsPage.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import projectService from "../services/projectService";

const ProjectsPage = () => {
  const [filter, setFilter] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentProjects, setCurrentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const startX = useRef(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const projects = await projectService.getGalleryProjects(filter);
      console.log("Fetched projects:", projects);
      setCurrentProjects(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const groupByCountry = useCallback((projects) => {
    const groups = {};
    projects.forEach((project) => {
      const countryName = (project.country || "unknown").toUpperCase();
      if (!groups[countryName]) {
        groups[countryName] = [];
      }
      groups[countryName].push(project);
    });
    
    // Sort countries alphabetically
    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach(key => {
        sortedGroups[key] = groups[key];
      });
    return sortedGroups;
  }, []);

  const getProjectImageUrl = (project) => {
    // Priority: primary_image -> first image -> placeholder
    if (project.primary_image) {
      if (project.primary_image.full_url) {
        return project.primary_image.full_url;
      }
      if (project.primary_image.url) {
        return project.primary_image.url;
      }
      if (project.primary_image.file_path) {
        return projectService.getImageUrl(project.primary_image.file_path);
      }
    }
    
    if (project.images && project.images.length > 0) {
      const firstImage = project.images[0];
      if (firstImage.full_url) return firstImage.full_url;
      if (firstImage.url) return firstImage.url;
      if (firstImage.file_path) {
        return projectService.getImageUrl(firstImage.file_path);
      }
    }
    
    return "/api/placeholder/400/300";
  };

  const openLightbox = useCallback((index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "auto";
  }, []);

  const nextProject = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % currentProjects.length);
  }, [currentProjects.length]);

  const prevProject = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + currentProjects.length) % currentProjects.length);
  }, [currentProjects.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "ArrowRight") nextProject();
      if (e.key === "ArrowLeft") prevProject();
      if (e.key === "Escape") closeLightbox();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextProject, prevProject, closeLightbox]);

  // Touch swipe
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prevProject();
      else nextProject();
    }
  };

  const groupedProjects = groupByCountry(currentProjects);
  const currentProject = currentProjects[currentIndex];

  if (loading) {
    return (
      <div className="projects-page">
        <Navbar />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="projects-page">
        <Navbar />
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
      </div>
    );
  }

  return (
    <div className="projects-page">
      <Navbar />

      <section className="projects-header">
        <h1>PROJECTS</h1>
        <p>Studio Installations · Networking · Telecommunications</p>
      </section>

      <div className="filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "studio" ? "active" : ""}
          onClick={() => setFilter("studio")}
        >
          Studios
        </button>
        <button
          className={filter === "network" ? "active" : ""}
          onClick={() => setFilter("network")}
        >
          Networking
        </button>
        <button
          className={filter === "telecom" ? "active" : ""}
          onClick={() => setFilter("telecom")}
        >
          Telecom
        </button>
      </div>

      <div className="gallery">
        {Object.keys(groupedProjects).length === 0 && (
          <div className="gallery-empty">
            <div>📷</div>
            <p>No projects found in this category</p>
            <button onClick={fetchProjects} className="retry-btn">
              Refresh
            </button>
          </div>
        )}
        
        {Object.entries(groupedProjects).map(([country, projects]) => (
          <div key={country} className="country-section">
            <h2 className="country-title">{country}</h2>
            <div className="country-grid">
              {projects.map((project) => {
                const globalIndex = currentProjects.findIndex(
                  (p) => p.id === project.id
                );
                const imageUrl = getProjectImageUrl(project);
                
                return (
                  <div
                    key={project.id}
                    className="project-card"
                    onClick={() => openLightbox(globalIndex)}
                  >
                    <img 
                      src={imageUrl} 
                      alt={project.title}
                      onError={(e) => {
                        console.error(`Failed to load image: ${imageUrl}`);
                        e.target.src = "/api/placeholder/400/300";
                      }}
                    />
                    <div className="overlay">
                      <h3>{project.title}</h3>
                      <p>{project.description || "No description available"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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
            {currentProject.images && currentProject.images.length > 0 && (
              <img
                src={currentProject.images[0].full_url || 
                     currentProject.images[0].url || 
                     projectService.getImageUrl(currentProject.images[0].file_path)}
                alt={currentProject.title}
                onError={(e) => {
                  e.target.src = "/api/placeholder/800/600";
                }}
              />
            )}
            <div className="image-info">
              <h3>{currentProject.title}</h3>
              <p>{currentProject.description || "No description available"}</p>
              <span className="image-category">
                {currentProject.category?.toUpperCase() || "PROJECT"} ·{" "}
                {currentProject.country?.toUpperCase() || "UNKNOWN"}
              </span>
            </div>
            {currentProject.images && currentProject.images.length > 1 && (
              <div className="thumb-strip">
                {currentProject.images.map((image, index) => (
                  <img
                    key={image.id}
                    src={image.full_url || image.url || projectService.getImageUrl(image.file_path)}
                    className={`thumb ${index === 0 ? "active" : ""}`}
                    alt={`Thumbnail ${index + 1}`}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <button className="nav-btn next" onClick={nextProject}>
            ❯
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;