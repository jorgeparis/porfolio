import React, { useEffect, useState } from "react";

function ImageThumbnails({ files, activeIndex, onThumbnailClick }) {
  const [thumbnails, setThumbnails] = useState([]);

  useEffect(() => {
    const loadThumbnails = async () => {
      const thumbnailPromises = Array.from(files).map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target.result);
          };
          reader.readAsDataURL(file);
        });
      });

      const thumbUrls = await Promise.all(thumbnailPromises);
      setThumbnails(thumbUrls);
    };

    if (files.length > 0) {
      loadThumbnails();
    }
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        overflowX: "auto",
        padding: "10px 0",
        marginTop: "10px"
      }}
    >
      {thumbnails.map((thumb, index) => (
        <img
          key={index}
          src={thumb}
          alt={`Thumbnail ${index + 1}`}
          style={{
            width: "70px",
            height: "70px",
            objectFit: "cover",
            borderRadius: "10px",
            cursor: "pointer",
            border:
              index === activeIndex
                ? "2px solid #00d084"
                : "2px solid transparent",
            flexShrink: 0
          }}
          onClick={() => onThumbnailClick(index)}
        />
      ))}
    </div>
  );
}

export default ImageThumbnails;
