// components/AudioInterface.jsx
import React, { useEffect, useRef, useState } from "react";

function AudioInterface({
  devices,
  selectedDeviceId,
  onSelectDevice,
  onScanDevices,
  onAudioSettingsChange,
  initialSettings = {
    sampleRate: 48000,
    bufferSize: 512,
    channels: "Stereo",
    latency: "normal",
    monitoring: false,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false
  }
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  // Monitor audio input levels when monitoring is enabled
  useEffect(() => {
    if (settings.monitoring && selectedDeviceId) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [settings.monitoring, selectedDeviceId]);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
          sampleRate: settings.sampleRate,
          channelCount:
            settings.channels === "Mono"
              ? 1
              : settings.channels === "Stereo"
              ? 2
              : 6
        }
      });

      mediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: settings.sampleRate
      });

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(dataArray);
        let maxSample = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          maxSample = Math.max(maxSample, Math.abs(v));
        }

        const level = Math.min(100, Math.floor(maxSample * 100));
        setInputLevel(level);

        if (level > peakLevel) {
          setPeakLevel(level);
          setTimeout(() => {
            setPeakLevel((prev) => Math.max(0, prev - 1));
          }, 500);
        }

        animationRef.current = requestAnimationFrame(updateLevel);
      };

      await audioContextRef.current.resume();
      updateLevel();
    } catch (error) {
      console.error("Failed to start monitoring:", error);
    }
  };

  const stopMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    setInputLevel(0);
    setPeakLevel(0);
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (onAudioSettingsChange) {
      onAudioSettingsChange(newSettings);
    }
  };

  const formatBufferSize = (size) => {
    return `${size} samples (${((size / settings.sampleRate) * 1000).toFixed(
      1
    )} ms)`;
  };

  const getLatencyDescription = (latency) => {
    switch (latency) {
      case "low":
        return "~10ms - Best for monitoring";
      case "normal":
        return "~25ms - Balanced";
      case "high":
        return "~50ms - Stable";
      default:
        return "";
    }
  };

  return (
    <div className="card audio-card">
      <div className="card-header">
        <div className="card-title">
          <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
            <path d="M8 1a2 2 0 0 1 2 2v4a2 2 0 0 1-4 0V3a2 2 0 0 1 2-2zm0 11a5 5 0 0 0 5-5H11a3 3 0 0 1-6 0H3a5 5 0 0 0 5 5zm-1 1h2v2H7z" />
          </svg>
          Interface de Áudio
        </div>
        <div className="scan-btn" onClick={onScanDevices}>
          ↻ SCAN
        </div>
      </div>

      <div className="card-body">
        <div className="device-list">
          {devices.length === 0 ? (
            <div className="device-error">
              Permissão de microfone necessária
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className={`device-item ${
                  selectedDeviceId === device.id ? "selected" : ""
                }`}
                onClick={() => onSelectDevice(device.id)}
              >
                <div className="device-icon">
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    width="14"
                    height="14"
                  >
                    <path d="M8 1a2 2 0 0 1 2 2v4a2 2 0 0 1-4 0V3a2 2 0 0 1 2-2zm0 11a5 5 0 0 0 5-5H11a3 3 0 0 1-6 0H3a5 5 0 0 0 5 5zm-1 1h2v2H7z" />
                  </svg>
                </div>
                <div className="device-info">
                  <div className="device-name">{device.name}</div>
                  {device.groupId && (
                    <div className="device-group">
                      Group: {device.groupId.slice(0, 8)}
                    </div>
                  )}
                </div>
                {selectedDeviceId === device.id && (
                  <div className="device-check">✓</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Audio Input Meter */}
        {settings.monitoring && (
          <div className="audio-meter-container">
            <div className="meter-label">Input Level</div>
            <div className="audio-meter">
              <div
                className="meter-level"
                style={{
                  width: `${inputLevel}%`,
                  backgroundColor:
                    inputLevel > 80
                      ? "#f44336"
                      : inputLevel > 60
                      ? "#ff9800"
                      : "#4caf50"
                }}
              />
              <div className="meter-peak" style={{ left: `${peakLevel}%` }} />
            </div>
            <div className="meter-values">
              <span>0 dB</span>
              <span>-6 dB</span>
              <span>-12 dB</span>
              <span>-∞ dB</span>
            </div>
          </div>
        )}

        <div className="sep"></div>

        <div className="settings-grid">
          <div className="row2">
            <div className="field">
              <label>Sample Rate</label>
              <select
                value={settings.sampleRate}
                onChange={(e) =>
                  handleSettingChange("sampleRate", parseInt(e.target.value))
                }
              >
                <option value="44100">44.1 kHz</option>
                <option value="48000">48 kHz</option>
                <option value="88200">88.2 kHz</option>
                <option value="96000">96 kHz</option>
                <option value="192000">192 kHz</option>
              </select>
            </div>
            <div className="field">
              <label>Buffer Size</label>
              <select
                value={settings.bufferSize}
                onChange={(e) =>
                  handleSettingChange("bufferSize", parseInt(e.target.value))
                }
              >
                <option value="128">128 {formatBufferSize(128)}</option>
                <option value="256">256 {formatBufferSize(256)}</option>
                <option value="512">512 {formatBufferSize(512)}</option>
                <option value="1024">1024 {formatBufferSize(1024)}</option>
                <option value="2048">2048 {formatBufferSize(2048)}</option>
                <option value="4096">4096 {formatBufferSize(4096)}</option>
              </select>
            </div>
          </div>

          <div className="row2">
            <div className="field">
              <label>Channels</label>
              <select
                value={settings.channels}
                onChange={(e) =>
                  handleSettingChange("channels", e.target.value)
                }
              >
                <option value="Mono">Mono (1 channel)</option>
                <option value="Stereo">Stereo (2 channels)</option>
                <option value="5.1">5.1 Surround (6 channels)</option>
                <option value="7.1">7.1 Surround (8 channels)</option>
              </select>
            </div>
            <div className="field">
              <label>Latency</label>
              <select
                value={settings.latency}
                onChange={(e) => handleSettingChange("latency", e.target.value)}
              >
                <option value="low">Low {getLatencyDescription("low")}</option>
                <option value="normal">
                  Normal {getLatencyDescription("normal")}
                </option>
                <option value="high">
                  High {getLatencyDescription("high")}
                </option>
              </select>
            </div>
          </div>

          <div className="processing-controls">
            <div className="field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.monitoring}
                  onChange={(e) =>
                    handleSettingChange("monitoring", e.target.checked)
                  }
                />
                <span>Input Monitoring</span>
              </label>
            </div>

            <div className="field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.echoCancellation}
                  onChange={(e) =>
                    handleSettingChange("echoCancellation", e.target.checked)
                  }
                />
                <span>Echo Cancellation</span>
              </label>
            </div>

            <div className="field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.noiseSuppression}
                  onChange={(e) =>
                    handleSettingChange("noiseSuppression", e.target.checked)
                  }
                />
                <span>Noise Suppression</span>
              </label>
            </div>

            <div className="field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoGainControl}
                  onChange={(e) =>
                    handleSettingChange("autoGainControl", e.target.checked)
                  }
                />
                <span>Auto Gain Control</span>
              </label>
            </div>
          </div>
        </div>

        {/* Settings Summary */}
        <div className="settings-summary">
          <div className="summary-item">
            <strong>Latency:</strong> {getLatencyDescription(settings.latency)}
          </div>
          <div className="summary-item">
            <strong>Bitrate:</strong> ~
            {(
              (settings.sampleRate *
                (settings.channels === "Mono" ? 1 : 2) *
                16) /
              1000
            ).toFixed(0)}{" "}
            kbps
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioInterface;
