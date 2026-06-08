import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useRadio } from "../context/RadioContext";
import "./RadioPage.css";

const radioStations = [
  {
    name: "Radio Maria 103.1 MHz",
    src: "https://dreamsiteradiocp2.com/proxy/rmmozambique2?mp=/stream",
    country: "Mozambique",
    genre: "Religious"
  },
  {
    name: "RM ANTENA NACIONAL",
    src: "https://node.stream-africa.com:8443/AntenaNacional",
    country: "Mozambique",
    genre: "News"
  },
  {
    name: "Radio Maria Papua New Guinea",
    src: "https://dreamsiteradiocp2.com/proxy/rmpapua2?mp=/stream",
    country: "Papua New Guinea",
    genre: "Religious"
  },
  {
    name: "Radio Miramar",
    src: "https://nl.digitalrm.pt:8150/stream",
    country: "Portugal",
    genre: "Variety"
  },
  {
    name: "SUPER RM",
    src: "https://c1.mirror.africa:8443/227",
    country: "Mozambique",
    genre: "Pop"
  },
  {
    name: "Cabo Delgado FM",
    src: "https://node.stream-africa.com:8443/CaboDelgadoFM",
    country: "Mozambique",
    genre: "Community"
  },
  {
    name: "Manica FM",
    src: "https://node.stream-africa.com:8443/ManicaFM",
    country: "Mozambique",
    genre: "Community"
  },
  {
    name: "Maputo Corridor FM",
    src: "https://node.stream-africa.com:8443/MaputoCorridor",
    country: "Mozambique",
    genre: "News"
  },
  {
    name: "Radio Mocambique Maputo FM",
    src: "https://node.stream-africa.com:8443/MaputoFM",
    country: "Mozambique",
    genre: "Public"
  },
  {
    name: "Nampula FM",
    src: "https://node.stream-africa.com:8443/Nampula",
    country: "Mozambique",
    genre: "Community"
  },
  {
    name: "Niassa FM",
    src: "https://node.stream-africa.com:8443/NiassaFM",
    country: "Mozambique",
    genre: "Community"
  },
  {
    name: "Power FM Lusaka",
    src: "https://node.stream-africa.com:8443/PowerFMLusaka",
    country: "Zambia",
    genre: "Pop"
  },
  {
    name: "RM Desporto",
    src: "https://node.stream-africa.com:8443/RMDesporto",
    country: "Mozambique",
    genre: "Sports"
  },
  {
    name: "Radio Cidade Beira",
    src: "https://node.stream-africa.com:8443/RadioCidadeBeira",
    country: "Mozambique",
    genre: "Urban"
  },
  {
    name: "Radio Cidade Maputo",
    src: "https://node.stream-africa.com:8443/RadioCidadeMaputo",
    country: "Mozambique",
    genre: "Urban"
  },
  {
    name: "Sofala FM",
    src: "https://node.stream-africa.com:8443/Sofala",
    country: "Mozambique",
    genre: "Community"
  },
  {
    name: "Zambezi FM",
    src: "https://node.stream-africa.com:8443/ZambeziFM",
    country: "Mozambique",
    genre: "Community"
  },
  {
    name: "Zambezia FM",
    src: "https://node.stream-africa.com:8443/ZambeziaFM",
    country: "Mozambique",
    genre: "Community"
  },
  {
    name: "Tete FM",
    src: "https://node.stream-africa.com:8443/TeteFM",
    country: "Mozambique",
    genre: "Community"
  },
  {
    name: "LM RADIO",
    src: "https://cast6.asurahosting.com/proxy/lmradioc/stream",
    country: "Mozambique",
    genre: "Variety"
  }
];

function RadioPage() {
  const {
    currentStation,
    isPlaying,
    isLoading,
    error,
    favorites,
    recentStations,
    playStation,
    toggleFavorite
  } = useRadio();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");

  const genres = ["All", ...new Set(radioStations.map((s) => s.genre))];
  const countries = ["All", ...new Set(radioStations.map((s) => s.country))];

  const filteredStations = radioStations.filter((station) => {
    const matchesSearch = station.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesGenre =
      selectedGenre === "All" || station.genre === selectedGenre;
    const matchesCountry =
      selectedCountry === "All" || station.country === selectedCountry;
    return matchesSearch && matchesGenre && matchesCountry;
  });

  return (
    <div className="radio-page">
      <Navbar />
      <div className="radio-container">
        <div className="radio-header">
          <h1>📻 Radio Stations</h1>
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
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
          </div>
          <div className="station-count">
            Found {filteredStations.length} stations
          </div>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="stations-grid">
          {filteredStations.map((station) => (
            <div key={station.src} className="station-card">
              <div className="station-card-header">
                <div className="station-icon">📻</div>
                <button
                  className={`favorite-btn-card ${
                    favorites.some((f) => f.src === station.src) ? "active" : ""
                  }`}
                  onClick={() => toggleFavorite(station)}
                >
                  {favorites.some((f) => f.src === station.src) ? "❤️" : "🤍"}
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
                  onClick={() => playStation(station)}
                  disabled={isLoading}
                >
                  {isLoading && currentStation?.src === station.src
                    ? "⏳"
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
      </div>
    </div>
  );
}

export default RadioPage;
