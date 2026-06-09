import React from "react";
import ImagePreview from "./ImagePreview";

function PreviewPanel({
  selectedFiles,
  activeIndex,
  title,
  category,
  country
}) {
  const getCategoryLabel = (cat) => {
    const labels = {
      studio: "Studio",
      network: "Network",
      telecom: "Telecom",
      broadcast: "Broadcast"
    };
    return labels[cat] || cat;
  };

  return (
    <div className="card preview-panel">
      <div className="preview-header">
        <h2 className="preview-title">Live Preview</h2>
        <div className="badge">Firebase Connected</div>
      </div>

      <ImagePreview files={selectedFiles} activeIndex={activeIndex} />

      <div className="preview-info">
        <div className="project-title">
          {title.trim() || "Your Project Title"}
        </div>
        <div className="meta">
          <div className="pill">{getCategoryLabel(category)}</div>
          <div className="pill">{country.trim() || "Country"}</div>
        </div>
      </div>
    </div>
  );
}

export default PreviewPanel;
