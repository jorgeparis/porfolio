import React, { useRef, useState } from "react";

function Dropzone({ onFilesSelected }) {
  const fileInputRef = useRef(null);
  const [fileCount, setFileCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e) => {
    const files = e.target.files;
    setFileCount(files.length);
    onFilesSelected(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    setFileCount(files.length);
    onFilesSelected(files);

    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach((file) => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="upload-box"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        borderColor: isDragOver ? "#00d084" : "rgba(255,255,255,0.15)",
        background: isDragOver
          ? "rgba(0, 208, 132, 0.05)"
          : "rgba(255, 255, 255, 0.03)"
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileChange}
      />
      <div className="upload-ui">
        <div className="icon">⬆️</div>
        <div className="text">
          <strong>Upload Images</strong>
          <span>Click or drag files here</span>
        </div>
        <div className="counter">
          {fileCount === 0
            ? "No files selected"
            : `${fileCount} file(s) selected`}
        </div>
      </div>
    </div>
  );
}

export default Dropzone;
