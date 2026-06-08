// components/AudioInterface.jsx
import React from "react";

function AudioInterface({
  devices,
  selectedDeviceId,
  onSelectDevice,
  onScanDevices
}) {
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
              🎤 Permissão de microfone necessária
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
                <div className="device-icon">🎙</div>
                <div className="device-info">
                  <div className="device-name">{device.name}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sep"></div>

        <div className="row2">
          <div className="field">
            <label>Sample Rate</label>
            <select defaultValue="48000">
              <option>44100 Hz</option>
              <option>48000 Hz</option>
              <option>96000 Hz</option>
            </select>
          </div>
          <div className="field">
            <label>Buffer</label>
            <select defaultValue="512">
              <option>256</option>
              <option>512</option>
              <option>1024</option>
              <option>2048</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Canais</label>
          <select defaultValue="Stereo">
            <option>Mono</option>
            <option>Stereo</option>
            <option>5.1 Surround</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default AudioInterface;
