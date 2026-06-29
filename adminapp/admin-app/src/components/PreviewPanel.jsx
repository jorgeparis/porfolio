import React, { useEffect, useState } from "react";
import ImagePreview from "./ImagePreview";

function PreviewPanel({
  selectedFiles,
  activeIndex,
  title,
  category,
  country
}) {
  const [backendStatus, setBackendStatus] = useState("checking");
  const [backendVersion, setBackendVersion] = useState("");
  const [connectionError, setConnectionError] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [apiUrl, setApiUrl] = useState("");

  const getCategoryLabel = (cat) => {
    const labels = {
      studio: "Studio",
      network: "Network",
      telecom: "Telecom",
      broadcast: "Broadcast"
    };
    return labels[cat] || cat;
  };

  // Check backend health
  const checkBackendHealth = async () => {
    setIsChecking(true);
    setConnectionError(null);

    // Use the full URL with port
    const url = "http://localhost:8000";
    setApiUrl(url);

    console.log(`[Health Check] Checking backend at: ${url}/health`);

    try {
      const response = await fetch(`${url}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
        // Don't use mode: 'no-cors' as it will block reading the response
      });

      console.log("[Health Check] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[Health Check] Response data:", data);

        if (data.status === "healthy") {
          setBackendStatus("online");
          setBackendVersion(data.version || "1.0.0");
          setConnectionError(null);
        } else {
          setBackendStatus("offline");
          setConnectionError("Backend returned unexpected status");
        }
      } else {
        setBackendStatus("offline");
        setConnectionError(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error("[Health Check] Error:", error);
      setBackendStatus("offline");

      if (error.message.includes("Failed to fetch")) {
        setConnectionError(
          "Cannot reach backend. Make sure it's running on http://localhost:8000"
        );
      } else if (error.message.includes("NetworkError")) {
        setConnectionError("Network error - check your connection");
      } else {
        setConnectionError(error.message || "Failed to connect to backend");
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Check health on component mount
  useEffect(() => {
    checkBackendHealth();

    // Set up periodic health check (every 30 seconds)
    const interval = setInterval(checkBackendHealth, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Get status badge configuration
  const getStatusBadge = () => {
    if (isChecking) {
      return {
        label: "Checking Backend...",
        className: "badge badge-checking"
      };
    }

    if (backendStatus === "online") {
      return {
        label: `Backend Online v${backendVersion}`,
        className: "badge badge-online"
      };
    }

    return {
      label: "Backend Offline",
      className: "badge badge-offline"
    };
  };

  const status = getStatusBadge();

  // Manual refresh handler
  const handleRefresh = () => {
    checkBackendHealth();
  };

  return (
    <div className="card preview-panel">
      <div className="preview-header">
        <h2 className="preview-title">Live Preview</h2>
        <div
          className={`badge ${status.className}`}
          onClick={handleRefresh}
          style={{ cursor: "pointer" }}
          title={`API: ${apiUrl}`}
        >
          {status.label}
          {backendStatus === "offline" && !isChecking && (
            <span style={{ marginLeft: "8px", fontSize: "12px" }}>
              (Click to retry)
            </span>
          )}
        </div>
      </div>

      {/* Debug Info - shows API URL and status */}
      <div
        className="debug-info"
        style={{
          padding: "6px 20px",
          backgroundColor: "#f9fafb",
          fontSize: "12px",
          color: "#6b7280",
          borderBottom: "1px solid #e5e7eb",
          fontFamily: "monospace",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap"
        }}
      >
        <span>🔗 API: {apiUrl || "http://localhost:8000"}</span>
        <span>📡 Status: {backendStatus}</span>
        {connectionError && (
          <span style={{ color: "#ef4444" }}>Error: {connectionError}</span>
        )}
        {backendStatus === "online" && (
          <span style={{ color: "#10b981" }}>Connected</span>
        )}
      </div>

      {/* Connection Error Message */}
      {backendStatus === "offline" && connectionError && (
        <div className="connection-error">
          <span className="error-icon"></span>
          <span className="error-message">{connectionError}</span>
          <button className="retry-btn" onClick={handleRefresh}>
            Retry Now
          </button>
        </div>
      )}

      {/* Backend Status Info */}
      {backendStatus === "online" && (
        <div className="backend-info">
          <span className="info-icon">🟢</span>
          <span className="info-text">Backend connected successfully</span>
          <span
            className="info-text"
            style={{ marginLeft: "auto", opacity: 0.7 }}
          >
            Updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}

      <ImagePreview files={selectedFiles} activeIndex={activeIndex} />

      <div className="preview-info">
        <div className="project-title">
          {title.trim() || "Your Project Title"}
        </div>
        <div className="meta">
          <div className="pill">{getCategoryLabel(category)}</div>
          <div className="pill">{country.trim() || "Country"}</div>
          {backendStatus === "online" && (
            <div className="pill pill-online">
              <span className="status-dot"></span> Live
            </div>
          )}
          {backendStatus === "offline" && (
            <div className="pill pill-offline">
              <span className="status-dot"></span> Offline
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewPanel;
