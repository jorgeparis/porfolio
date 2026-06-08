// components/ServerConfig.jsx
import React from "react";

function ServerConfig({
  serverConfig,
  onServerConfigChange,
  protocol,
  onProtocolChange,
  codecConfig,
  onCodecConfigChange
}) {
  const protocols = [
    { id: "icecast", name: "IceCast 2" },
    { id: "shoutcast1", name: "ShoutCast v1" },
    { id: "shoutcast2", name: "ShoutCast v2" }
  ];

  const codecs = ["MP3", "AAC+", "OGG", "OPUS"];
  const bitrates = ["64k", "128k", "192k", "320k"];

  const updateField = (field, value) => {
    onServerConfigChange((prev) => ({ ...prev, [field]: value }));
  };

  const selectChip = (type, value) => {
    onCodecConfigChange((prev) => ({ ...prev, [type]: value }));
  };

  return (
    <div className="card server-card">
      <div className="card-header">
        <div className="card-title">
          <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
            <path d="M2 3h12v3H2zm0 5h12v3H2zm0 5h12v1H2z" />
          </svg>
          Configuração do Servidor
        </div>
        <div className="card-subtitle">ICECAST / SHOUTCAST</div>
      </div>

      <div className="card-body">
        <div className="proto-tabs">
          {protocols.map((proto) => (
            <div
              key={proto.id}
              className={`tab ${protocol === proto.id ? "active" : ""}`}
              onClick={() => onProtocolChange(proto.id)}
            >
              {proto.name}
            </div>
          ))}
        </div>

        <div className="field">
          <label>Hostname / IP</label>
          <input
            type="text"
            placeholder="stream.servidor.com"
            value={serverConfig.host}
            onChange={(e) => updateField("host", e.target.value)}
          />
        </div>

        <div className="row2">
          <div className="field">
            <label>Porta</label>
            <input
              type="number"
              placeholder="8000"
              value={serverConfig.port}
              onChange={(e) => updateField("port", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Mount Point</label>
            <input
              type="text"
              placeholder="/live"
              value={serverConfig.mount}
              onChange={(e) => updateField("mount", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Username</label>
          <input
            type="text"
            placeholder="source"
            value={serverConfig.username}
            onChange={(e) => updateField("username", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={serverConfig.password}
            onChange={(e) => updateField("password", e.target.value)}
          />
        </div>

        <div className="sep"></div>

        <div className="field">
          <label>Nome da Estação</label>
          <input
            type="text"
            placeholder="Radio Alpha"
            value={serverConfig.station}
            onChange={(e) => updateField("station", e.target.value)}
          />
        </div>

        <div className="row2">
          <div className="field">
            <label>Género</label>
            <input
              type="text"
              placeholder="House / Techno"
              value={serverConfig.genre}
              onChange={(e) => updateField("genre", e.target.value)}
            />
          </div>
          <div className="field">
            <label>URL Público</label>
            <input
              type="text"
              placeholder="https://..."
              value={serverConfig.url}
              onChange={(e) => updateField("url", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Codec / Bitrate</label>
        </div>
        <div className="codec-strip">
          {codecs.map((codec) => (
            <div
              key={codec}
              className={`codec-chip ${
                codecConfig.codec === codec ? "active" : ""
              }`}
              onClick={() => selectChip("codec", codec)}
            >
              {codec}
            </div>
          ))}
          <div className="separator"></div>
          {bitrates.map((bitrate) => (
            <div
              key={bitrate}
              className={`codec-chip ${
                codecConfig.bitrate === bitrate ? "active" : ""
              }`}
              onClick={() => selectChip("bitrate", bitrate)}
            >
              {bitrate}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ServerConfig;
