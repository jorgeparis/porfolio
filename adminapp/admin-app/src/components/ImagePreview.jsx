import React, { useState, useEffect } from 'react';

function ImagePreview({ files, activeIndex }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (files.length > 0 && files[activeIndex]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(files[activeIndex]);
    } else {
      setPreviewUrl(null);
    }
  }, [files, activeIndex]);

  if (!previewUrl) {
    return (
      <div
        style={{
          height: '500px',
          background: '#0d1324',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#aaa'
        }}
      >
        <div className="placeholder">
          <span>🖼️</span>
          <p>No Image Selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-image" style={{ height: '500px', background: '#0d1324' }}>
      <img src={previewUrl} alt="Preview" />
    </div>
  );
}

export default ImagePreview;