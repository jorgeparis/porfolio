// components/MonitorPanel.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

function MonitorPanel({
  connectionStatus = "idle",
  serverDisplay = "—",
  protocol = "icecast",
  codecDisplay = "—",
  listeners = "—",
  dropped = "—",
  latency = "—",
  audioLevel = 0,
  waveformData = [],
  timer = "00:00:00",
  onConnect = () => {},
  onTestConnection = () => {},
  bitrate = 128,
  sampleRate = 44100,
  streamTitle = "",
  streamGenre = ""
}) {
  const canvasRef = useRef(null);
  const spectrumCanvasRef = useRef(null);
  const [peakLevel, setPeakLevel] = useState(0);
  const [peakHold, setPeakHold] = useState(0);
  const [averageLevel, setAverageLevel] = useState(0);
  const [historyLevels, setHistoryLevels] = useState([]);
  const [spectrumData, setSpectrumData] = useState(new Array(64).fill(0));
  const [error, setError] = useState(null);
  const peakHoldTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isMountedRef = useRef(true);

  const statusConfig = {
    idle: {
      dotClass: "idle",
      text: "OFFLINE",
      icon: "▶",
      btnLabel: "CONNECT",
      color: "#6c757d"
    },
    connecting: {
      dotClass: "warning",
      text: "CONNECTING...",
      icon: "⌛",
      btnLabel: "CONNECTING",
      color: "#ffc107"
    },
    live: { 
      dotClass: "live", 
      text: "LIVE", 
      icon: "■", 
      btnLabel: "DISCONNECT",
      color: "#00ff88"
    }
  };

  const protocolName = {
    icecast: "IceCast 2",
    shoutcast1: "ShoutCast v1",
    shoutcast2: "ShoutCast v2"
  }[protocol] || "IceCast 2";

  // Format timer
  const formattedTimer = useMemo(() => {
    try {
      if (timer === "00:00:00") return timer;
      const parts = timer.split(":");
      if (parts.length === 3 && parts[0] === "00") {
        return `${parts[1]}:${parts[2]}`;
      }
      return timer;
    } catch (err) {
      return "00:00:00";
    }
  }, [timer]);

  // Get status color for VU meter
  const getVuColor = useCallback((level) => {
    if (level > 0.85) return "#ff3366";
    if (level > 0.65) return "#ffd93d";
    if (level > 0.4) return "#ffa500";
    return "#00ff88";
  }, []);

  // Safe canvas drawing with error handling
  const drawWaveform = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !waveformData || waveformData.length === 0) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const width = rect.width;
      const height = 120;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Clear with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(0, 255, 136, 0.15)");
      gradient.addColorStop(0.5, "rgba(0, 255, 136, 0.08)");
      gradient.addColorStop(1, "rgba(0, 255, 136, 0.03)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const mid = height / 2;
      
      // Draw grid lines
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 0.5;
      for (let y = 0; y <= height; y += height / 4) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      
      for (let i = 0; i < width; i++) {
        const index = Math.floor((i / width) * waveformData.length);
        const sample = ((waveformData[index] || 0) / 255) * 0.8;
        const y = mid + sample * (height / 2.5);
        
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();
      
      // Draw fill under waveform
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fillStyle = "rgba(0, 255, 136, 0.1)";
      ctx.fill();
    } catch (err) {
      console.warn("Waveform drawing error:", err);
    }
  }, [waveformData]);

  // Draw spectrum analyzer
  const drawSpectrum = useCallback(() => {
    try {
      const canvas = spectrumCanvasRef.current;
      if (!canvas || spectrumData.length === 0) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const width = rect.width;
      const height = 80;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);
      
      const barWidth = width / spectrumData.length;
      
      for (let i = 0; i < spectrumData.length; i++) {
        const barHeight = Math.min(spectrumData[i] * height, height);
        const x = i * barWidth;
        const y = height - barHeight;
        
        const intensity = spectrumData[i];
        let color;
        if (intensity > 0.7) color = "#ff3366";
        else if (intensity > 0.4) color = "#ffd93d";
        else color = "#00ff88";
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }
    } catch (err) {
      console.warn("Spectrum drawing error:", err);
    }
  }, [spectrumData]);

  // Update VU meters
  const updateVUMeters = useCallback(() => {
    try {
      const vuL = document.getElementById("vu-l");
      const vuR = document.getElementById("vu-r");
      const dbL = document.getElementById("db-l");
      const dbR = document.getElementById("db-r");

      if (!vuL || !vuR) return;

      const targetLevel = Math.min(100, Math.max(0, audioLevel * 100));
      const currentLevel = parseFloat(vuL.style.width) || 0;
      const smoothLevel = currentLevel + (targetLevel - currentLevel) * 0.3;
      
      const levelPercent = Math.min(100, Math.max(0, smoothLevel));
      vuL.style.width = `${levelPercent}%`;
      vuR.style.width = `${levelPercent}%`;
      
      const color = getVuColor(levelPercent / 100);
      vuL.style.backgroundColor = color;
      vuR.style.backgroundColor = color;
      
      const dbValue = Math.max(-60, Math.min(0, (audioLevel * 40 - 40)));
      const dbDisplay = dbValue.toFixed(1);
      
      if (dbL && dbR) {
        dbL.textContent = `${dbDisplay} dB`;
        dbR.textContent = `${dbDisplay} dB`;
        
        const dbColor = dbValue > -6 ? "#ff3366" : dbValue > -20 ? "#ffd93d" : "#00ff88";
        dbL.style.color = dbColor;
        dbR.style.color = dbColor;
      }
      
      // Update peak level
      setPeakLevel(prev => Math.max(prev, audioLevel));
      
      // Peak hold
      if (audioLevel > peakHold) {
        setPeakHold(audioLevel);
        if (peakHoldTimeoutRef.current) clearTimeout(peakHoldTimeoutRef.current);
        peakHoldTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) setPeakHold(0);
        }, 2000);
      }
      
      // Rolling average
      setAverageLevel(prev => prev * 0.95 + audioLevel * 0.05);
      
      // History
      setHistoryLevels(prev => {
        const newHistory = [...prev, audioLevel];
        return newHistory.slice(-50);
      });
    } catch (err) {
      console.warn("VU meter update error:", err);
    }
  }, [audioLevel, peakHold, getVuColor]);

  // Generate spectrum data
  useEffect(() => {
    if (!waveformData || waveformData.length === 0) return;
    
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      try {
        const newSpectrum = Array(64).fill(0).map(() => {
          const randomIndex = Math.floor(Math.random() * waveformData.length);
          const value = (waveformData[randomIndex] || 0) / 255;
          return Math.min(1, Math.pow(value, 1.5) * (0.5 + Math.random() * 0.5));
        });
        setSpectrumData(newSpectrum);
      } catch (err) {
        console.warn("Spectrum generation error:", err);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [waveformData]);

  // Drawing effects
  useEffect(() => {
    if (!waveformData || waveformData.length === 0) return;
    
    const draw = () => {
      drawWaveform();
      drawSpectrum();
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawWaveform, drawSpectrum]);

  // VU meter update effect
  useEffect(() => {
    updateVUMeters();
  }, [updateVUMeters]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (peakHoldTimeoutRef.current) {
        clearTimeout(peakHoldTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Format listener count
  const formattedListeners = useMemo(() => {
    if (listeners === "—") return listeners;
    const num = parseInt(listeners);
    if (isNaN(num)) return listeners;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return listeners;
  }, [listeners]);

  const dropPercentage = useMemo(() => {
    if (dropped === "—" || listeners === "—") return null;
    const total = parseInt(listeners) + parseInt(dropped);
    if (isNaN(total) || total === 0) return null;
    return ((parseInt(dropped) / total) * 100).toFixed(1);
  }, [listeners, dropped]);

  const currentStatus = statusConfig[connectionStatus] || statusConfig.idle;

  // Error boundary fallback
  if (error) {
    return (
      <div className="card meter-card" style={{ padding: "20px", textAlign: "center" }}>
        <h3>⚠️ Component Error</h3>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="card meter-card">
      <div className="card-header">
        <div className="card-title">
          <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
            <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a.75.75 0 0 0-.75.75v2.5l1.75 1.75.53-.53-1.53-1.53V6.25A.75.75 0 0 0 8 5.5z" />
          </svg>
          Broadcast Monitor
          {streamTitle && connectionStatus === "live" && (
            <span style={{ marginLeft: "1rem", fontSize: "0.8rem", color: "#00ff88" }}>
              🎵 {streamTitle.substring(0, 40)}
            </span>
          )}
        </div>
        <div className="live-timer">{formattedTimer}</div>
      </div>

      <div className="card-body">
        <div className="meter-inner">
          <div className="status-block">
            <div className="status-row">
              <span className="status-key">Status</span>
              <div className="status-indicator">
                <div 
                  className={`dot ${currentStatus.dotClass}`}
                  style={{ backgroundColor: currentStatus.color }}
                ></div>
                <span>{currentStatus.text}</span>
              </div>
            </div>
            <div className="status-row">
              <span className="status-key">Server</span>
              <span className="status-val">{serverDisplay}</span>
            </div>
            <div className="status-row">
              <span className="status-key">Protocol</span>
              <span className="status-val">{protocolName}</span>
            </div>
            <div className="status-row">
              <span className="status-key">Codec</span>
              <span className="status-val">{codecDisplay}</span>
            </div>
            <div className="status-row">
              <span className="status-key">Bitrate</span>
              <span className="status-val">{bitrate} kbps</span>
            </div>
            <div className="status-row">
              <span className="status-key">Listeners</span>
              <span className="status-val status-listeners">
                {formattedListeners}
                {listeners !== "—" && <span className="listener-unit"> listeners</span>}
              </span>
            </div>
            <div className="status-row">
              <span className="status-key">Dropped</span>
              <span className="status-val">
                {dropped}
                {dropPercentage && (
                  <span className="dropped-percent"> ({dropPercentage}%)</span>
                )}
              </span>
            </div>
            <div className="status-row">
              <span className="status-key">Latency</span>
              <span className="status-val">{latency}</span>
            </div>

            <div className="actions">
              <button 
                className={`btn btn-${connectionStatus === 'live' ? 'danger' : 'primary'}`}
                onClick={onConnect}
                disabled={connectionStatus === "connecting"}
              >
                <span>{currentStatus.icon}</span>
                <span>{currentStatus.btnLabel}</span>
              </button>
            </div>
            <div className="test-btn-wrapper">
              <button 
                className="btn btn-secondary" 
                onClick={onTestConnection}
                disabled={connectionStatus === "live" || connectionStatus === "connecting"}
              >
                TEST CONNECTION
              </button>
            </div>
          </div>

          <div>
            <div className="vu-wrap">
              <div className="vu-label">
                <span>VU METER</span>
                <div className="vu-stats">
                  <span className="peak-hold">PEAK {(peakHold * 100).toFixed(0)}%</span>
                  <span className="average-level">AVG {(averageLevel * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="channels">
                <div className="channel">
                  <div className="ch-tag">L</div>
                  <div className="bar-track">
                    <div className="bar-fill" id="vu-l" style={{ width: "0%" }}></div>
                    {peakHold > 0 && (
                      <div 
                        className="peak-hold-marker"
                        style={{ left: `${peakHold * 100}%` }}
                      ></div>
                    )}
                  </div>
                  <div className="db-val" id="db-l">—</div>
                </div>
                <div className="channel">
                  <div className="ch-tag">R</div>
                  <div className="bar-track">
                    <div className="bar-fill" id="vu-r" style={{ width: "0%" }}></div>
                    {peakHold > 0 && (
                      <div 
                        className="peak-hold-marker"
                        style={{ left: `${peakHold * 100}%` }}
                      ></div>
                    )}
                  </div>
                  <div className="db-val" id="db-r">—</div>
                </div>
              </div>
              <div className="tick-row">
                <div className="ticks">
                  <span className="tick">-60</span>
                  <span className="tick">-40</span>
                  <span className="tick">-20</span>
                  <span className="tick">-12</span>
                  <span className="tick">-6</span>
                  <span className="tick" style={{ color: "#ffd93d" }}>-3</span>
                  <span className="tick" style={{ color: "#ff3366" }}>0</span>
                </div>
              </div>
              
              {/* Mini history graph */}
              <div className="history-graph" style={{ display: "flex", gap: "2px", marginTop: "10px", height: "30px" }}>
                {historyLevels.map((level, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${level * 100}%`,
                      backgroundColor: getVuColor(level),
                      opacity: 0.3 + level * 0.7,
                      transition: "height 0.1s ease"
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="wave-wrap">
              <div className="wave-label">
                <span>WAVEFORM</span>
                {connectionStatus === "live" && (
                  <span className="live-badge" style={{ color: "#ff3366" }}>LIVE</span>
                )}
              </div>
              <div className="wave-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  id="waveform"
                  className="waveform-canvas"
                  style={{ width: "100%", height: "120px" }}
                ></canvas>
              </div>
            </div>

            {/* Spectrum analyzer */}
            <div style={{ marginTop: "1rem" }}>
              <div className="wave-label">
                <span>SPECTRUM ANALYZER</span>
              </div>
              <canvas
                ref={spectrumCanvasRef}
                style={{ width: "100%", height: "80px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "4px" }}
              ></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonitorPanel;