// components/MonitorPanel.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

function MonitorPanel({
  connectionStatus,
  serverDisplay,
  protocol,
  codecDisplay,
  listeners,
  dropped,
  latency,
  audioLevel,
  waveformData,
  timer,
  onConnect,
  onTestConnection
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [peakLevel, setPeakLevel] = useState(0);
  const [peakHold, setPeakHold] = useState(0);
  const [averageLevel, setAverageLevel] = useState(0);
  const peakHoldTimeoutRef = useRef(null);

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

  // Format timer for better display
  const formattedTimer = useMemo(() => {
    if (timer === "00:00:00") return timer;
    const [hours, minutes, seconds] = timer.split(":");
    if (hours === "00") return `${minutes}:${seconds}`;
    return timer;
  }, [timer]);

  // Get status color for VU meter
  const getVuColor = useCallback((level) => {
    if (level > 0.8) return "var(--red)";
    if (level > 0.6) return "var(--yellow)";
    return "var(--green)";
  }, []);

  // Draw waveform with better performance and styling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = 80;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(0, 255, 136, 0.1)");
    gradient.addColorStop(1, "rgba(0, 255, 136, 0.05)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const mid = height / 2;
    
    // Draw grid lines
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 0.5;
    for (let y = 0; y <= height; y += height / 4) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#00ff88";

    for (let i = 0; i < width; i++) {
      const index = Math.floor((i / width) * waveformData.length);
      const sample = (waveformData[index] || 0) / 255;
      const y = mid + sample * (height / 2);
      
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

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [waveformData]);

  // Update VU meters with peak hold and smoothing
  useEffect(() => {
    const vuL = document.getElementById("vu-l");
    const vuR = document.getElementById("vu-r");
    const dbL = document.getElementById("db-l");
    const dbR = document.getElementById("db-r");

    if (!vuL || !vuR) return;

    // Smooth level transition
    const targetLevel = audioLevel * 100;
    const currentLevel = parseFloat(vuL.style.width) || 0;
    const smoothLevel = currentLevel + (targetLevel - currentLevel) * 0.3;
    
    const levelPercent = Math.min(100, Math.max(0, smoothLevel));
    vuL.style.width = `${levelPercent}%`;
    vuR.style.width = `${levelPercent}%`;
    
    // Update color based on level
    const color = getVuColor(levelPercent / 100);
    vuL.style.backgroundColor = color;
    vuR.style.backgroundColor = color;
    
    // Calculate dB value
    const dbValue = Math.max(-60, Math.min(0, (audioLevel * 30 - 30)));
    const dbDisplay = dbValue.toFixed(1);
    
    if (dbL && dbR) {
      dbL.textContent = `${dbDisplay} dB`;
      dbR.textContent = `${dbDisplay} dB`;
      
      // Color code dB text
      const dbColor = dbValue > -6 ? "var(--red)" : dbValue > -20 ? "var(--yellow)" : "var(--green)";
      dbL.style.color = dbColor;
      dbR.style.color = dbColor;
    }
    
    // Update peak level
    const newPeak = Math.max(peakLevel, audioLevel);
    setPeakLevel(newPeak);
    
    // Peak hold for 2 seconds
    if (audioLevel > peakHold) {
      setPeakHold(audioLevel);
      if (peakHoldTimeoutRef.current) clearTimeout(peakHoldTimeoutRef.current);
      peakHoldTimeoutRef.current = setTimeout(() => {
        setPeakHold(0);
      }, 2000);
    }
    
    // Calculate rolling average
    setAverageLevel(prev => prev * 0.9 + audioLevel * 0.1);
    
  }, [audioLevel, peakLevel, peakHold, getVuColor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (peakHoldTimeoutRef.current) {
        clearTimeout(peakHoldTimeoutRef.current);
      }
    };
  }, []);

  // Format listener count
  const formattedListeners = useMemo(() => {
    if (listeners === "—") return listeners;
    const num = parseInt(listeners);
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return listeners;
  }, [listeners]);

  const currentStatus = statusConfig[connectionStatus] || statusConfig.idle;

  return (
    <div className="card meter-card">
      <div className="card-header">
        <div className="card-title">
          <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
            <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a.75.75 0 0 0-.75.75v2.5l1.75 1.75.53-.53-1.53-1.53V6.25A.75.75 0 0 0 8 5.5z" />
          </svg>
          Broadcast Monitor
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
              <span className="status-key">Listeners</span>
              <span className="status-val status-listeners">
                {formattedListeners}
                {listeners !== "—" && (
                  <span className="listener-unit"> listeners</span>
                )}
              </span>
            </div>
            <div className="status-row">
              <span className="status-key">Dropped</span>
              <span className="status-val">
                {dropped}
                {dropped !== "—" && (
                  <span className="dropped-percent">
                    {' '}({((parseInt(dropped) / (parseInt(listeners) + parseInt(dropped))) * 100).toFixed(1)}%)
                  </span>
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
                  <span className="peak-hold">
                    PEAK {(peakHold * 100).toFixed(0)}%
                  </span>
                  <span className="average-level">
                    AVG {(averageLevel * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="channels">
                <div className="channel">
                  <div className="ch-tag">L</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      id="vu-l"
                      style={{ width: "0%", transition: "width 0.05s linear" }}
                    ></div>
                    {peakHold > 0 && (
                      <div 
                        className="peak-hold-marker"
                        style={{ left: `${peakHold * 100}%` }}
                      ></div>
                    )}
                  </div>
                  <div className="db-val" id="db-l">
                    —
                  </div>
                </div>
                <div className="channel">
                  <div className="ch-tag">R</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      id="vu-r"
                      style={{ width: "0%", transition: "width 0.05s linear" }}
                    ></div>
                    {peakHold > 0 && (
                      <div 
                        className="peak-hold-marker"
                        style={{ left: `${peakHold * 100}%` }}
                      ></div>
                    )}
                  </div>
                  <div className="db-val" id="db-r">
                    —
                  </div>
                </div>
              </div>
              <div className="tick-row">
                <div className="ticks">
                  <span className="tick">-60</span>
                  <span className="tick">-40</span>
                  <span className="tick">-20</span>
                  <span className="tick">-12</span>
                  <span className="tick">-6</span>
                  <span className="tick" style={{ color: "var(--yellow)" }}>
                    -3
                  </span>
                  <span className="tick" style={{ color: "var(--red)" }}>
                    0
                  </span>
                </div>
              </div>
            </div>

            <div className="wave-wrap">
              <div className="wave-label">
                <span>WAVEFORM</span>
                {connectionStatus === "live" && (
                  <span className="live-badge">LIVE</span>
                )}
              </div>
              <div className="wave-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  id="waveform"
                  className="waveform-canvas"
                ></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonitorPanel;