// components/ServerConfig.jsx
import React, { useState, useCallback, useMemo } from "react";
import "./ServerConfig.css";

// Custom hook for form validation
const useFormValidation = (initialValues, validators) => {
  const [errors, setErrors] = useState({});
  
  const validate = useCallback((field, value) => {
    if (validators[field]) {
      const error = validators[field](value);
      setErrors(prev => ({ ...prev, [field]: error }));
      return !error;
    }
    return true;
  }, [validators]);

  const validateAll = useCallback((values) => {
    const newErrors = {};
    Object.keys(validators).forEach(field => {
      const error = validators[field](values[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validators]); // Removed 'values' from dependencies

  return { errors, validate, validateAll, setErrors };
};

// Sub-component for protocol tabs with animations
const ProtocolTabs = ({ protocols, currentProtocol, onChange }) => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="proto-tabs" role="tablist">
      {protocols.map((proto) => (
        <button
          key={proto.id}
          role="tab"
          aria-selected={currentProtocol === proto.id}
          className={`tab ${currentProtocol === proto.id ? "active" : ""}`}
          onClick={() => onChange(proto.id)}
          onMouseEnter={() => setHoveredId(proto.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <span className="tab-indicator" />
          <span className="tab-icon">{proto.icon}</span>
          <span className="tab-text">{proto.name}</span>
          {hoveredId === proto.id && (
            <span className="tab-tooltip">{proto.description}</span>
          )}
        </button>
      ))}
    </div>
  );
};

// Sub-component for codec selection with icons and quality indicators
const CodecSelector = ({ codecs, bitrates, selectedCodec, selectedBitrate, onSelect }) => {
  const codecInfo = {
    "MP3": { icon: "", quality: "Compatible", bitrates: ["64k", "128k", "192k", "320k"] },
    "AAC+": { icon: "", quality: "Eficiente", bitrates: ["32k", "64k", "96k", "128k"] },
    "OGG": { icon: "", quality: "Alta qualidade", bitrates: ["64k", "128k", "192k", "256k"] },
    "OPUS": { icon: "", quality: "Melhor qualidade", bitrates: ["32k", "64k", "96k", "128k", "192k"] }
  };

  // Fallback for selectedCodec
  const currentCodecInfo = codecInfo[selectedCodec] || codecInfo["MP3"];

  return (
    <div className="codec-container">
      <div className="codec-header">
        <span className="codec-label">Áudio Streaming</span>
        <span className="codec-hint">Codec & Qualidade</span>
      </div>
      
      <div className="codec-strip">
        <div className="codec-group">
          <div className="group-label">Codec</div>
          <div className="codec-buttons">
            {codecs.map((codec) => (
              <button
                key={codec}
                className={`codec-chip ${selectedCodec === codec ? "active" : ""}`}
                onClick={() => onSelect("codec", codec)}
              >
                <span className="codec-icon">{codecInfo[codec]?.icon || "🎵"}</span>
                <span className="codec-name">{codec}</span>
                <span className="codec-quality">{codecInfo[codec]?.quality || ""}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        <div className="codec-group">
          <div className="group-label">Bitrate</div>
          <div className="bitrate-buttons">
            {(currentCodecInfo.bitrates || bitrates).map((bitrate) => (
              <button
                key={bitrate}
                className={`bitrate-chip ${selectedBitrate === bitrate ? "active" : ""}`}
                onClick={() => onSelect("bitrate", bitrate)}
              >
                {bitrate}
                {bitrate === "320k" && <span className="bitrate-badge">HD</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="codec-stats">
        <div className="stat">
          <span className="stat-label">Latência esperada:</span>
          <span className="stat-value">
            {selectedBitrate === "320k" ? "~2s" : selectedBitrate === "192k" ? "~1.5s" : "~1s"}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Uso de banda:</span>
          <span className="stat-value">{selectedBitrate}/s</span>
        </div>
      </div>
    </div>
  );
};

// Main component with all improvements
function ServerConfig({
  serverConfig,
  onServerConfigChange,
  protocol,
  onProtocolChange,
  codecConfig,
  onCodecConfigChange
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const protocols = useMemo(() => [
    { 
      id: "icecast", 
      name: "IceCast 2", 
      icon: "",
      description: "Moderno e estável, suporte a múltiplos formatos",
      defaultPort: 8000,
      defaultMount: "/stream"
    },
    { 
      id: "shoutcast1", 
      name: "ShoutCast v1", 
      icon: "",
      description: "Legado, compatível com equipamentos antigos",
      defaultPort: 8000,
      defaultMount: "/"
    },
    { 
      id: "shoutcast2", 
      name: "ShoutCast v2", 
      icon: "",
      description: "Melhorias de estabilidade e recursos avançados",
      defaultPort: 8000,
      defaultMount: "/"
    }
  ], []);

  const codecs = ["MP3", "AAC+", "OGG", "OPUS"];
  const bitrates = ["64k", "128k", "192k", "320k"];

  // Validators
  const validators = useMemo(() => ({
    host: (value) => {
      if (!value) return "Host é obrigatório";
      const urlPattern = /^[a-zA-Z0-9.-]+$/;
      if (!urlPattern.test(value) && !value.includes('.')) return "Host inválido";
      return null;
    },
    port: (value) => {
      if (!value) return "Porta é obrigatória";
      const portNum = parseInt(value);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) return "Porta inválida (1-65535)";
      return null;
    },
    password: (value) => {
      if (!value) return "Senha é obrigatória";
      if (value.length < 4) return "Senha deve ter no mínimo 4 caracteres";
      return null;
    }
  }), []);

  const { errors, validate, validateAll } = useFormValidation(serverConfig, validators);

  const updateField = useCallback((field, value) => {
    onServerConfigChange((prev) => ({ ...prev, [field]: value }));
    validate(field, value);
  }, [onServerConfigChange, validate]);

  const selectChip = useCallback((type, value) => {
    onCodecConfigChange((prev) => ({ ...prev, [type]: value }));
  }, [onCodecConfigChange]);

  const handleProtocolChange = useCallback((newProtocol) => {
    const protocolConfig = protocols.find(p => p.id === newProtocol);
    if (protocolConfig) {
      updateField("port", protocolConfig.defaultPort.toString());
      if (newProtocol === "icecast") {
        updateField("mount", protocolConfig.defaultMount);
      }
    }
    onProtocolChange(newProtocol);
  }, [protocols, onProtocolChange, updateField]);

  const testConnection = useCallback(async () => {
    // Create a validation object with current values
    const currentValues = {
      host: serverConfig.host,
      port: serverConfig.port,
      password: serverConfig.password
    };
    
    if (!validateAll(currentValues)) return;
    
    setIsTesting(true);
    setTestStatus(null);
    
    // Simulate connection test (replace with actual API call)
    setTimeout(() => {
      setTestStatus({
        success: Math.random() > 0.3,
        message: Math.random() > 0.3 ? "Conexão bem sucedida!" : "Falha na conexão"
      });
      setIsTesting(false);
    }, 1500);
  }, [serverConfig, validateAll]);

  const fillDemoData = useCallback(() => {
    updateField("host", "stream.servidor.com");
    updateField("port", "8000");
    updateField("mount", "/live");
    updateField("username", "source");
    updateField("password", "hackme");
    updateField("station", "Rádio Alpha");
    updateField("genre", "Electronic / Dance");
    updateField("url", "https://radioalpha.com");
  }, [updateField]);

  const currentProtocol = protocols.find(p => p.id === protocol) || protocols[0];
  const currentPassword = serverConfig.password || '';

  // Safely get password strength
  const getPasswordStrength = () => {
    if (!currentPassword) return 0;
    return Math.min((currentPassword.length / 20) * 100, 100);
  };

  const getPasswordColor = () => {
    const strength = getPasswordStrength();
    if (strength < 20) return "#ff4444";
    if (strength < 40) return "#ff8844";
    if (strength < 70) return "#ffaa44";
    return "#44ff44";
  };

  return (
    <div className="card server-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-title">
            <svg viewBox="0 0 16 16" fill="currentColor" width="20" height="20">
              <path d="M2 3h12v3H2zm0 5h12v3H2zm0 5h12v1H2z" />
            </svg>
            Configuração do Servidor
          </div>

        </div>
        <div className="card-subtitle">
          {currentProtocol?.name} • Porta padrão: {currentProtocol?.defaultPort}
        </div>
      </div>

      <div className="card-body">
        <ProtocolTabs 
          protocols={protocols}
          currentProtocol={protocol}
          onChange={handleProtocolChange}
        />

        <div className="fields-grid">
          <div className="field">
            <label>
              Hostname / IP
              {errors.host && <span className="field-error">{errors.host}</span>}
            </label>
            <input
              type="text"
              placeholder="ex: stream.servidor.com"
              value={serverConfig.host || ''}
              onChange={(e) => updateField("host", e.target.value)}
              className={errors.host ? "error" : ""}
            />
          </div>

          <div className="row2">
            <div className="field">
              <label>
                Porta
                {errors.port && <span className="field-error">{errors.port}</span>}
              </label>
              <input
                type="number"
                placeholder={currentProtocol?.defaultPort.toString()}
                value={serverConfig.port || ''}
                onChange={(e) => updateField("port", e.target.value)}
                className={errors.port ? "error" : ""}
              />
            </div>
            <div className="field">
              <label>Mount Point</label>
              <div className="input-with-hint">
                <input
                  type="text"
                  placeholder={currentProtocol?.defaultMount}
                  value={serverConfig.mount || ''}
                  onChange={(e) => updateField("mount", e.target.value)}
                />
                {protocol === "icecast" && (
                  <span className="input-hint">Opcional para IceCast</span>
                )}
              </div>
            </div>
          </div>

          <div className="field">
            <label>Username</label>
            <input
              type="text"
              placeholder="source"
              value={serverConfig.username || ''}
              onChange={(e) => updateField("username", e.target.value)}
            />
          </div>

          <div className="field">
            <label>
              Password
              {errors.password && <span className="field-error">{errors.password}</span>}
            </label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => updateField("password", e.target.value)}
                className={errors.password ? "error" : ""}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <div className="password-strength">
              <div 
                className="strength-bar" 
                style={{
                  width: `${getPasswordStrength()}%`,
                  backgroundColor: getPasswordColor()
                }} 
              />
            </div>
          </div>

          <div className="sep" />

          <div className="field">
            <label>Nome da Estação</label>
            <input
              type="text"
              placeholder="Rádio Alpha"
              value={serverConfig.station || ''}
              onChange={(e) => updateField("station", e.target.value)}
              maxLength="50"
            />
          </div>

          <div className="row2">
            <div className="field">
              <label>Género</label>
              <input
                type="text"
                placeholder="House / Techno / Pop"
                value={serverConfig.genre || ''}
                onChange={(e) => updateField("genre", e.target.value)}
                list="genres"
              />
              <datalist id="genres">
                <option>Pop / Rock</option>
                <option>Electronic / Dance</option>
                <option>Hip Hop / R&B</option>
                <option>Jazz / Blues</option>
                <option>Classical</option>
                <option>News / Talk</option>
              </datalist>
            </div>
            <div className="field">
              <label>URL Público</label>
              <input
                type="url"
                placeholder="https://..."
                value={serverConfig.url || ''}
                onChange={(e) => updateField("url", e.target.value)}
              />
            </div>
          </div>

          <CodecSelector
            codecs={codecs}
            bitrates={bitrates}
            selectedCodec={codecConfig?.codec || "MP3"}
            selectedBitrate={codecConfig?.bitrate || "128k"}
            onSelect={selectChip}
          />

          <div className="advanced-toggle">
            <button 
              className="toggle-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              {showAdvanced ? "▼" : "▶"} Configurações Avançadas
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-settings">
              <div className="field">
                <label>Buffer Size (ms)</label>
                <input type="range" min="100" max="5000" step="100" defaultValue="1000" />
                <span className="range-value">1000ms</span>
              </div>
              <div className="field">
                <label>
                  <input type="checkbox" /> Auto-reconectar
                </label>
              </div>
              <div className="field">
                <label>
                  <input type="checkbox" /> Log de conexão
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServerConfig;