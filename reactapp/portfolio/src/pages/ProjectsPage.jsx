// pages/ProjectsPage.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";

const ProjectsPage = () => {
  const [filter, setFilter] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState([]);
  const startX = useRef(0);

  // Image database
  const imageDatabase = [
    {
      filename: "studio-angola-01.jpg",
      category: "studio",
      country: "angola",
      title: "Radio Studio Build",
      desc: "Full broadcast setup with IceCast integration"
    },
    {
      filename: "studio-angola-02.jpg",
      category: "studio",
      country: "angola",
      title: "Angola Studio",
      desc: "Professional audio installation and acoustic treatment"
    },
    {
      filename: "network-nigeria-01.jpg",
      category: "network",
      country: "nigeria",
      title: "Enterprise Network",
      desc: "Structured cabling + routing for corporate campus"
    },
    {
      filename: "network-ghana-01.jpg",
      category: "network",
      country: "ghana",
      title: "Ghana Network",
      desc: "Fiber optic backbone deployment"
    },
    {
      filename: "telecom-angola-01.jpg",
      category: "telecom",
      country: "angola",
      title: "Microwave Link",
      desc: "Long distance communication for remote areas"
    },
    {
      filename: "studio-mozambique-01.jpg",
      category: "studio",
      country: "mozambique",
      title: "Maputo Studio",
      desc: "Digital broadcast center with ShoutCast"
    },
    {
      filename: "network-kenya-01.jpg",
      category: "network",
      country: "kenya",
      title: "Nairobi Data Center",
      desc: "High availability network infrastructure"
    },
    {
      filename: "telecom-southafrica-01.jpg",
      category: "telecom",
      country: "southafrica",
      title: "Satellite Uplink",
      desc: "Teleport facility with redundant links"
    },
    {
      filename: "studio-brazil-01.jpg",
      category: "studio",
      country: "brazil",
      title: "São Paulo Studio",
      desc: "24/7 broadcast operations center"
    },
    {
      filename: "network-angola-01.jpg",
      category: "network",
      country: "angola",
      title: "Luanda Metro Network",
      desc: "City-wide fiber optic ring"
    },
    {
      filename: "studio-angola-01.jpg",
      category: "studio",
      country: "angola",
      title: "Radio Studio Build",
      desc: "Full broadcast setup with IceCast integration"
    },
    {
      filename: "studio-angola-02.jpg",
      category: "studio",
      country: "angola",
      title: "Angola Studio",
      desc: "Professional audio installation and acoustic treatment"
    },
    {
      filename: "network-nigeria-01.jpg",
      category: "network",
      country: "nigeria",
      title: "Enterprise Network",
      desc: "Structured cabling + routing for corporate campus"
    },
    {
      filename: "network-ghana-01.jpg",
      category: "network",
      country: "ghana",
      title: "Ghana Network",
      desc: "Fiber optic backbone deployment"
    },
    {
      filename: "telecom-angola-01.jpg",
      category: "telecom",
      country: "angola",
      title: "Microwave Link",
      desc: "Long distance communication for remote areas"
    },
    {
      filename: "studio-mozambique-01.jpg",
      category: "studio",
      country: "mozambique",
      title: "Maputo Studio",
      desc: "Digital broadcast center with ShoutCast"
    },
    {
      filename: "network-kenya-01.jpg",
      category: "network",
      country: "kenya",
      title: "Nairobi Data Center",
      desc: "High availability network infrastructure"
    },
    {
      filename: "telecom-southafrica-01.jpg",
      category: "telecom",
      country: "southafrica",
      title: "Satellite Uplink",
      desc: "Teleport facility with redundant links"
    },
    {
      filename: "studio-brazil-01.jpg",
      category: "studio",
      country: "brazil",
      title: "São Paulo Studio",
      desc: "24/7 broadcast operations center"
    },
    {
      filename: "network-angola-01.jpg",
      category: "network",
      country: "angola",
      title: "Luanda Metro Network",
      desc: "City-wide fiber optic ring"
    }
  ];

  useEffect(() => {
    updateGalleryImages("all");
  }, []);

  const updateGalleryImages = useCallback((selectedFilter) => {
    const filtered =
      selectedFilter === "all"
        ? imageDatabase
        : imageDatabase.filter((img) => img.category === selectedFilter);
    setCurrentImages(filtered);
  }, []);

  const groupByCountry = useCallback((images, selectedFilter) => {
    const groups = {};

    images.forEach((img) => {
      if (selectedFilter !== "all" && img.category !== selectedFilter) return;

      if (!groups[img.country]) {
        groups[img.country] = [];
      }
      groups[img.country].push(img);
    });

    return groups;
  }, []);

  const filterProjects = useCallback(
    (category) => {
      setFilter(category);
      updateGalleryImages(category);
    },
    [updateGalleryImages]
  );

  const openLightbox = useCallback((index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "auto";
  }, []);

  const nextImage = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % currentImages.length);
    },
    [currentImages.length]
  );

  const prevImage = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setCurrentIndex(
        (prev) => (prev - 1 + currentImages.length) % currentImages.length
      );
    },
    [currentImages.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") closeLightbox();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage, closeLightbox]);

  // Touch swipe
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    if (endX - startX.current > 50) prevImage();
    if (startX.current - endX > 50) nextImage();
  };

  const groupedImages = groupByCountry(currentImages, filter);
  const currentImageData = currentImages[currentIndex];

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
          onClick={() => filterProjects("all")}
        >
          All
        </button>
        <button
          className={filter === "studio" ? "active" : ""}
          onClick={() => filterProjects("studio")}
        >
          Studios
        </button>
        <button
          className={filter === "network" ? "active" : ""}
          onClick={() => filterProjects("network")}
        >
          Networking
        </button>
        <button
          className={filter === "telecom" ? "active" : ""}
          onClick={() => filterProjects("telecom")}
        >
          Telecom
        </button>
      </div>

      <div className="gallery">
        {Object.entries(groupedImages).map(([country, images]) => (
          <div key={country} className="country-section">
            <h2 className="country-title">{country.toUpperCase()}</h2>
            <div className="country-grid">
              {images.map((img, idx) => {
                const globalIndex = currentImages.findIndex(
                  (i) => i.filename === img.filename
                );
                return (
                  <div
                    key={img.filename}
                    className="project-card"
                    onClick={() => openLightbox(globalIndex)}
                  >
                    <img src={`/api/placeholder/400/300`} alt={img.title} />
                    <div className="overlay">
                      <h3>{img.title}</h3>
                      <p>{img.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {currentImages.length === 0 && (
          <div className="gallery-empty">
            <div>📷</div>
            <p>No projects found in this category</p>
          </div>
        )}
      </div>

      {lightboxOpen && currentImageData && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="nav-btn prev" onClick={prevImage}>
            ❮
          </button>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`/api/placeholder/800/600`}
              alt={currentImageData.title}
            />
            <div className="image-info">
              <h3>{currentImageData.title}</h3>
              <p>{currentImageData.desc}</p>
              <span className="image-category">
                {currentImageData.category.toUpperCase()} ·{" "}
                {currentImageData.country.toUpperCase()}
              </span>
            </div>
            <div className="thumb-strip">
              {currentImages.map((img, index) => (
                <img
                  key={img.filename}
                  src={`/api/placeholder/80/60`}
                  className={`thumb ${index === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(index)}
                  alt={`Thumbnail ${index + 1}`}
                />
              ))}
            </div>
          </div>
          <button className="nav-btn next" onClick={nextImage}>
            ❯
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
