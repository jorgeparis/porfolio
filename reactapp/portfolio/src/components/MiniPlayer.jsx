import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useRadio } from "../context/RadioContext";
import "./MiniPlayer.css";

function MiniPlayer() {
  const {
    currentStation,
    isPlaying,
    volume,
    audioLevel,
    isLoading,
    playStation,
    setVolume,
    stopPlayback
  } = useRadio();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Auto-hide mini player when no station is playing
  if (!currentStation && !isLoading) {
    return null;
  }

  const getAudioQualityColor = () => {
    if (audioLevel > 0.7) return "#00ff88";
    if (audioLevel > 0.3) return "#ffaa00";
    return "#ff3366";
  };

  return (
    <div
      className={`mini-player ${isExpanded ? "expanded" : ""}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="mini-player-content">
        {/* Station Info */}
        <div className="mini-player-info">
          <div className="mini-player-icon">
            <div
              className="mini-vinyl"
              style={{ animationPlayState: isPlaying ? "running" : "paused" }}
            >
              <div className="mini-vinyl-center"></div>
            </div>
          </div>
          <div className="mini-player-details">
            <div className="mini-station-name">
              {currentStation?.name || "Loading..."}
            </div>
            {isExpanded && currentStation && (
              <div className="mini-station-meta">
                {currentStation.genre} • {currentStation.country}
              </div>
            )}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="mini-player-controls">
          <button
            className="mini-control-btn"
            onClick={() => currentStation && playStation(currentStation)}
            disabled={isLoading}
          >
            {isLoading ? "⏳" : isPlaying ? "⏸" : "▶"}
          </button>

          {isExpanded && (
            <>
              <div className="mini-volume-container">
                <button
                  className="mini-control-btn volume-btn"
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                >
                  🔊
                </button>
                {showVolumeSlider && (
                  <div className="mini-volume-slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="mini-volume-slider"
                      orientation="vertical"
                    />
                  </div>
                )}
              </div>

              <Link to="/radio" className="mini-control-btn open-radio-btn">
                📻
              </Link>
            </>
          )}
        </div>

        {/* Audio Visualizer */}
        <div className="mini-visualizer">
          <div className="mini-visualizer-bars">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="mini-visualizer-bar"
                style={{
                  height: `${
                    Math.sin(Date.now() / 100 + i) * audioLevel * 20 + 3
                  }px`,
                  backgroundColor: getAudioQualityColor()
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiniPlayer;
