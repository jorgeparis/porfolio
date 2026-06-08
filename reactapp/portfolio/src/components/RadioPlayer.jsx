import React, { useCallback, useEffect, useRef, useState } from "react";
import "./RadioPlayer.css";

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

function RadioPlayer() {
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [favorites, setFavorites] = useState([]);
  const [recentStations, setRecentStations] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const playPromiseRef = useRef(null);

  // Get unique genres and countries
  const genres = ["All", ...new Set(radioStations.map((s) => s.genre))];
  const countries = ["All", ...new Set(radioStations.map((s) => s.country))];

  // Filter stations
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

  // Load favorites and recent from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("radioFavorites");
    const savedRecent = localStorage.getItem("radioRecent");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedRecent) setRecentStations(JSON.parse(savedRecent));
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("radioFavorites", JSON.stringify(favorites));
  }, [favorites]);

  // Save recent to localStorage
  useEffect(() => {
    localStorage.setItem(
      "radioRecent",
      JSON.stringify(recentStations.slice(0, 10))
    );
  }, [recentStations]);

  // Setup audio analyser for visualization
  const setupAnalyser = useCallback(() => {
    if (!audioRef.current) return;

    try {
      // Close existing context
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioRef.current);

      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.fftSize = 256;

      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVisualizer = () => {
        if (!analyserRef.current || !audioRef.current) {
          return;
        }
        try {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255);
          animationRef.current = requestAnimationFrame(updateVisualizer);
        } catch (err) {
          console.warn("Visualizer update error:", err);
        }
      };

      updateVisualizer();
      audioContext
        .resume()
        .catch((err) => console.warn("AudioContext resume error:", err));
    } catch (err) {
      console.warn("Analyser setup error:", err);
    }
  }, []);

  // Stop playback and cleanup
  const stopPlayback = useCallback(async () => {
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (err) {
        // Ignore promise errors
      }
      playPromiseRef.current = null;
    }

    if (audioRef.current) {
      try {
        await audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      } catch (err) {
        console.warn("Pause error:", err);
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (err) {
        console.warn("Disconnect error:", err);
      }
      analyserRef.current = null;
    }

    setIsPlaying(false);
    setAudioLevel(0);
  }, []);

  // Play station
  const playStation = useCallback(
    async (station) => {
      if (!audioRef.current) return;

      // If same station and playing, pause
      if (currentStation?.src === station.src && isPlaying) {
        await stopPlayback();
        setCurrentStation(null);
        return;
      }

      // Stop current playback
      await stopPlayback();

      setError(null);
      setIsLoading(true);
      setCurrentStation(station);

      try {
        const audio = audioRef.current;
        audio.src = station.src;
        audio.volume = volume / 100;
        audio.crossOrigin = "anonymous"; // Try to handle CORS

        // Load the media
        audio.load();

        // Wait for canplay through event
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Load timeout")),
            10000
          );

          const canPlayHandler = () => {
            clearTimeout(timeout);
            audio.removeEventListener("canplaythrough", canPlayHandler);
            audio.removeEventListener("error", errorHandler);
            resolve();
          };

          const errorHandler = (e) => {
            clearTimeout(timeout);
            audio.removeEventListener("canplaythrough", canPlayHandler);
            audio.removeEventListener("error", errorHandler);
            reject(
              new Error(
                `Failed to load: ${audio.error?.message || "Unknown error"}`
              )
            );
          };

          audio.addEventListener("canplaythrough", canPlayHandler);
          audio.addEventListener("error", errorHandler);
        });

        // Start playing with promise handling
        const playPromise = audio.play();
        playPromiseRef.current = playPromise;

        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setupAnalyser();

          // Update recent stations
          setRecentStations((prev) => {
            const filtered = prev.filter((s) => s.src !== station.src);
            return [station, ...filtered].slice(0, 10);
          });
        }
      } catch (err) {
        console.error("Playback error:", err);
        setError(
          `Unable to play "${station.name}". The station might be offline or not accessible.`
        );
        setIsPlaying(false);
        setCurrentStation(null);

        // Clear the audio source on error
        if (audioRef.current) {
          audioRef.current.src = "";
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentStation, isPlaying, volume, stopPlayback, setupAnalyser]
  );

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  // Toggle favorite
  const toggleFavorite = useCallback((station) => {
    setFavorites((prev) => {
      const isFavorite = prev.some((s) => s.src === station.src);
      if (isFavorite) {
        return prev.filter((s) => s.src !== station.src);
      } else {
        return [...prev, station];
      }
    });
  }, []);

  // Get audio quality color
  const getAudioQualityColor = () => {
    if (audioLevel > 0.7) return "#00ff88";
    if (audioLevel > 0.3) return "#ffaa00";
    return "#ff3366";
  };

  return (
    <div className="radio-player">
      <audio ref={audioRef} />

      {/* Now Playing Bar */}
      {currentStation && (
        <div className="now-playing-bar">
          <div className="now-playing-info">
            <div className="station-art">
              <div
                className="vinyl-record"
                style={{ animationPlayState: isPlaying ? "running" : "paused" }}
              >
                <div className="vinyl-center"></div>
              </div>
            </div>
            <div className="station-details">
              <div className="now-playing-label">NOW PLAYING</div>
              <div className="station-name">{currentStation.name}</div>
              <div className="station-meta">
                <span className="station-genre">{currentStation.genre}</span>
                <span className="station-country">
                  {currentStation.country}
                </span>
              </div>
            </div>
          </div>

          <div className="player-controls">
            <button
              className={`control-btn ${isPlaying ? "pause" : "play"}`}
              onClick={() => playStation(currentStation)}
              disabled={isLoading}
            >
              {isLoading ? "⏳" : isPlaying ? "⏸" : "▶"}
            </button>
            <div className="volume-control">
              <span className="volume-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="volume-slider"
              />
            </div>
          </div>

          <div className="audio-visualizer">
            <div className="visualizer-bars">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="visualizer-bar"
                  style={{
                    height: `${
                      Math.sin(Date.now() / 100 + i) * audioLevel * 30 + 5
                    }px`,
                    backgroundColor: getAudioQualityColor()
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="radio-content">
        {/* Sidebar */}
        <div className="radio-sidebar">
          <div className="sidebar-section">
            <h3>🎵 Favorites</h3>
            <div className="station-list">
              {favorites.length === 0 ? (
                <p className="empty-message">
                  No favorites yet. Click the ♥ button to add stations.
                </p>
              ) : (
                favorites.map((station) => (
                  <div key={station.src} className="station-item favorite-item">
                    <button
                      className={`play-station-btn ${
                        currentStation?.src === station.src && isPlaying
                          ? "playing"
                          : ""
                      }`}
                      onClick={() => playStation(station)}
                      disabled={isLoading}
                    >
                      {currentStation?.src === station.src && isPlaying
                        ? "⏸"
                        : "▶"}
                    </button>
                    <div className="station-info">
                      <div className="station-name">{station.name}</div>
                      <div className="station-meta-small">
                        {station.genre} • {station.country}
                      </div>
                    </div>
                    <button
                      className="favorite-btn active"
                      onClick={() => toggleFavorite(station)}
                    >
                      ❤️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>🕒 Recent</h3>
            <div className="station-list">
              {recentStations.length === 0 ? (
                <p className="empty-message">
                  No recent stations. Play some music!
                </p>
              ) : (
                recentStations.map((station) => (
                  <div key={station.src} className="station-item recent-item">
                    <button
                      className={`play-station-btn ${
                        currentStation?.src === station.src && isPlaying
                          ? "playing"
                          : ""
                      }`}
                      onClick={() => playStation(station)}
                      disabled={isLoading}
                    >
                      {currentStation?.src === station.src && isPlaying
                        ? "⏸"
                        : "▶"}
                    </button>
                    <div className="station-info">
                      <div className="station-name">{station.name}</div>
                      <div className="station-meta-small">
                        {station.genre} • {station.country}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Station Grid */}
        <div className="radio-main">
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
                      favorites.some((f) => f.src === station.src)
                        ? "active"
                        : ""
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
                      ? "⏳ Loading..."
                      : currentStation?.src === station.src && isPlaying
                      ? "⏸ Pause"
                      : "▶ Play"}
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
    </div>
  );
}

export default RadioPlayer;
