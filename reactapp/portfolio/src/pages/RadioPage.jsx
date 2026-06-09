import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useRadio } from "../context/RadioContext";
import "./RadioPage.css";

const radioStations = [
  {
    name: "Radio Maria 103.1 MHz",
    src: "https://dreamsiteradiocp2.com/proxy/rmmozambique2?mp=/stream",
    country: "Mozambique",
    genre: "Religious",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "RM ANTENA NACIONAL",
    src: "https://node.stream-africa.com:8443/AntenaNacional",
    country: "Mozambique",
    genre: "News",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Radio Maria Papua New Guinea",
    src: "https://dreamsiteradiocp2.com/proxy/rmpapua2?mp=/stream",
    country: "Papua New Guinea",
    genre: "Religious",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Radio Miramar",
    src: "https://nl.digitalrm.pt:8150/stream",
    country: "Portugal",
    genre: "Variety",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "SUPER RM",
    src: "https://c1.mirror.africa:8443/227",
    country: "Mozambique",
    genre: "Pop",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Cabo Delgado FM",
    src: "https://node.stream-africa.com:8443/CaboDelgadoFM",
    country: "Mozambique",
    genre: "Community",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Manica FM",
    src: "https://node.stream-africa.com:8443/ManicaFM",
    country: "Mozambique",
    genre: "Community",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Maputo Corridor FM",
    src: "https://node.stream-africa.com:8443/MaputoCorridor",
    country: "Mozambique",
    genre: "News",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Radio Mocambique Maputo FM",
    src: "https://node.stream-africa.com:8443/MaputoFM",
    country: "Mozambique",
    genre: "Public",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Nampula FM",
    src: "https://node.stream-africa.com:8443/Nampula",
    country: "Mozambique",
    genre: "Community",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Niassa FM",
    src: "https://node.stream-africa.com:8443/NiassaFM",
    country: "Mozambique",
    genre: "Community",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Power FM Lusaka",
    src: "https://node.stream-africa.com:8443/PowerFMLusaka",
    country: "Zambia",
    genre: "Pop",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "RM Desporto",
    src: "https://node.stream-africa.com:8443/RMDesporto",
    country: "Mozambique",
    genre: "Sports",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Radio Cidade Beira",
    src: "https://node.stream-africa.com:8443/RadioCidadeBeira",
    country: "Mozambique",
    genre: "Urban",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Radio Cidade Maputo",
    src: "https://node.stream-africa.com:8443/RadioCidadeMaputo",
    country: "Mozambique",
    genre: "Urban",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Sofala FM",
    src: "https://node.stream-africa.com:8443/Sofala",
    country: "Mozambique",
    genre: "Community",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Zambezi FM",
    src: "https://node.stream-africa.com:8443/ZambeziFM",
    country: "Mozambique",
    genre: "Community",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Zambezia FM",
    src: "https://node.stream-africa.com:8443/ZambeziaFM",
    country: "Mozambique",
    genre: "Community",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "Tete FM",
    src: "https://node.stream-africa.com:8443/TeteFM",
    country: "Mozambique",
    genre: "Community",
    logo: "https://via.placeholder.com/60x60?text=RM"
  },
  {
    name: "LM RADIO",
    src: "https://cast6.asurahosting.com/proxy/lmradioc/stream",
    country: "Mozambique",
    genre: "Variety",
    logo: "https://via.placeholder.com/60x60?text=RM"
  }
];

// Now Playing Bar Component
const NowPlayingBar = ({ station, isPlaying, onClose }) => {
  if (!station) return null;

  return (
    <div className={`now-playing-bar ${isPlaying ? "active" : ""}`}>
      <div className="now-playing-content">
        <div className="now-playing-info">
          <div className="now-playing-animation">
            {isPlaying && (
              <div className="audio-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <div className="now-playing-details">
            <div className="now-playing-label">NOW PLAYING</div>
            <div className="now-playing-title">{station.name}</div>
            <div className="now-playing-meta">
              <span className="genre-tag-mini">{station.genre}</span>
              <span className="country-tag-mini">{station.country}</span>
            </div>
          </div>
        </div>
        <button className="close-now-playing" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

// Quick Access Section Component
const QuickAccessSection = ({
  title,
  stations,
  onPlayStation,
  currentStation,
  isPlaying,
  type
}) => {
  if (stations.length === 0) return null;

  return (
    <div className="quick-access-section">
      <div className="section-header">
        <h2>{title}</h2>
        <span className="section-count">{stations.length} stations</span>
      </div>
      <div className="quick-access-grid">
        {stations.slice(0, 6).map((station) => (
          <div
            key={station.src}
            className={`quick-access-card ${
              currentStation?.src === station.src && isPlaying ? "active" : ""
            }`}
            onClick={() => onPlayStation(station)}
          >
            <div className="quick-access-icon"></div>
            <div className="quick-access-info">
              <div className="quick-access-name">{station.name}</div>
              <div className="quick-access-genre">{station.genre}</div>
            </div>
            {currentStation?.src === station.src && isPlaying && (
              <div className="playing-badge">LIVE</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function RadioPage() {
  const {
    currentStation,
    isPlaying,
    isLoading,
    error,
    favorites,
    recentStations,
    playStation,
    toggleFavorite,
    stopPlayback
  } = useRadio();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [showNowPlaying, setShowNowPlaying] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Get unique genres and countries
  const genres = useMemo(
    () => ["All", ...new Set(radioStations.map((s) => s.genre))],
    []
  );
  const countries = useMemo(
    () => ["All", ...new Set(radioStations.map((s) => s.country))],
    []
  );

  // Get recent stations (last 5)
  const recentStationsList = useMemo(
    () => recentStations.slice(0, 6),
    [recentStations]
  );

  // Filter stations
  const filteredStations = useMemo(() => {
    let stations = radioStations;

    if (showFavoritesOnly) {
      stations = stations.filter((station) =>
        favorites.some((f) => f.src === station.src)
      );
    }

    return stations.filter((station) => {
      const matchesSearch = station.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesGenre =
        selectedGenre === "All" || station.genre === selectedGenre;
      const matchesCountry =
        selectedCountry === "All" || station.country === selectedCountry;
      return matchesSearch && matchesGenre && matchesCountry;
    });
  }, [
    searchTerm,
    selectedGenre,
    selectedCountry,
    showFavoritesOnly,
    favorites
  ]);

  // Group stations by genre for genre view
  const stationsByGenre = useMemo(() => {
    const grouped = {};
    filteredStations.forEach((station) => {
      if (!grouped[station.genre]) {
        grouped[station.genre] = [];
      }
      grouped[station.genre].push(station);
    });
    return grouped;
  }, [filteredStations]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Escape" && currentStation) {
        stopPlayback();
      }
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        document.querySelector(".search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentStation, stopPlayback]);

  const handlePlayStation = useCallback(
    (station) => {
      playStation(station);
      setShowNowPlaying(true);
    },
    [playStation]
  );

  const handleCloseNowPlaying = useCallback(() => {
    setShowNowPlaying(false);
  }, []);

  return (
    <div className="radio-page">
      <Navbar />

      {/* Now Playing Bar */}
      {showNowPlaying && (
        <NowPlayingBar
          station={currentStation}
          isPlaying={isPlaying}
          onClose={handleCloseNowPlaying}
        />
      )}

      <div className="radio-container">
        <div className="radio-header">
          <div>
            <h1>Radio Stations</h1>
            <p className="radio-subtitle">
              Discover and listen to live radio streams
            </p>
          </div>
          <div className="header-actions">
            <button
              className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              ▦ Grid
            </button>
            <button
              className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Search stations... (Ctrl+F)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-controls">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="filter-select"
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>

            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="filter-select"
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

            <button
              className={`favorite-filter-btn ${
                showFavoritesOnly ? "active" : ""
              }`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              {showFavoritesOnly ? "Showing Favorites" : "Show Favorites"}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{filteredStations.length}</span>
            <span className="stat-label">Available Stations</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{favorites.length}</span>
            <span className="stat-label">Favorites</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{recentStations.length}</span>
            <span className="stat-label">Recently Played</span>
          </div>
          {currentStation && isPlaying && (
            <div className="stat-item now-playing-stat">
              <span className="pulse-dot-small"></span>
              <span className="stat-label">Playing Now</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && <div className="error-message">⚠️ {error}</div>}

        {/* Quick Access Sections */}
        {!showFavoritesOnly &&
          searchTerm === "" &&
          selectedGenre === "All" &&
          selectedCountry === "All" && (
            <>
              {recentStationsList.length > 0 && (
                <QuickAccessSection
                  title="Recently Played"
                  stations={recentStationsList}
                  onPlayStation={handlePlayStation}
                  currentStation={currentStation}
                  isPlaying={isPlaying}
                  type="recent"
                />
              )}

              {favorites.length > 0 && (
                <QuickAccessSection
                  title="Your Favorites"
                  stations={favorites}
                  onPlayStation={handlePlayStation}
                  currentStation={currentStation}
                  isPlaying={isPlaying}
                  type="favorite"
                />
              )}
            </>
          )}

        {/* Main Stations Display */}
        <div className="stations-section">
          <div className="section-header">
            <h2>
              {showFavoritesOnly
                ? " Favorite Stations"
                : searchTerm
                ? ` Search Results for "${searchTerm}"`
                : selectedGenre !== "All"
                ? ` ${selectedGenre} Stations`
                : selectedCountry !== "All"
                ? ` Stations in ${selectedCountry}`
                : "🎧 All Stations"}
            </h2>
            <span className="section-count">
              {filteredStations.length} stations
            </span>
          </div>

          {filteredStations.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon"></div>
              <h3>No stations found</h3>
              <p>Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedGenre("All");
                  setSelectedCountry("All");
                  setShowFavoritesOnly(false);
                }}
                className="reset-filters-btn"
              >
                Reset Filters
              </button>
            </div>
          )}

          {viewMode === "grid" ? (
            <div className="stations-grid">
              {filteredStations.map((station) => (
                <div key={station.src} className="station-card">
                  <div className="station-card-header">
                    <div className="station-icon"></div>
                    <button
                      className={`favorite-btn-card ${
                        favorites.some((f) => f.src === station.src)
                          ? "active"
                          : ""
                      }`}
                      onClick={() => toggleFavorite(station)}
                      aria-label="Toggle favorite"
                    >
                      {favorites.some((f) => f.src === station.src)
                        ? "❤️"
                        : "🤍"}
                    </button>
                  </div>
                  <div className="station-card-body">
                    <h3 className="station-card-name">{station.name}</h3>
                    <div className="station-card-meta">
                      <span className="genre-tag">{station.genre}</span>
                      <span className="country-tag">{station.country}</span>
                    </div>
                  </div>
                  <div className="station-card-footer">
                    <button
                      className={`play-btn ${
                        currentStation?.src === station.src && isPlaying
                          ? "playing"
                          : ""
                      }`}
                      onClick={() => handlePlayStation(station)}
                      disabled={isLoading}
                      aria-label={
                        currentStation?.src === station.src && isPlaying
                          ? "Stop"
                          : "Play"
                      }
                    >
                      {isLoading && currentStation?.src === station.src
                        ? ""
                        : currentStation?.src === station.src && isPlaying
                        ? "⏸"
                        : "▶"}
                    </button>
                    {currentStation?.src === station.src && isPlaying && (
                      <div className="playing-indicator">
                        <span className="pulse-dot"></span>
                        LIVE
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stations-list">
              {filteredStations.map((station) => (
                <div key={station.src} className="station-list-item">
                  <div className="list-item-icon"></div>
                  <div className="list-item-info">
                    <div className="list-item-name">{station.name}</div>
                    <div className="list-item-meta">
                      <span className="genre-tag-small">{station.genre}</span>
                      <span className="country-tag-small">
                        {station.country}
                      </span>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button
                      className={`play-list-btn ${
                        currentStation?.src === station.src && isPlaying
                          ? "playing"
                          : ""
                      }`}
                      onClick={() => handlePlayStation(station)}
                      disabled={isLoading}
                    >
                      {isLoading && currentStation?.src === station.src
                        ? ""
                        : currentStation?.src === station.src && isPlaying
                        ? "⏸"
                        : "▶"}
                    </button>
                    <button
                      className={`favorite-list-btn ${
                        favorites.some((f) => f.src === station.src)
                          ? "active"
                          : ""
                      }`}
                      onClick={() => toggleFavorite(station)}
                    >
                      {favorites.some((f) => f.src === station.src)
                        ? "❤️"
                        : "🤍"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RadioPage;
