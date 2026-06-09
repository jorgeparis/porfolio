import React from "react";
import Dropzone from "./Dropzone";
import FormInput from "./FormInput";
import ImageThumbnails from "./ImageThumbnails";
import ProgressBar from "./ProgressBar";

function UploadPanel({
  selectedFiles,
  setSelectedFiles,
  activeIndex,
  setActiveIndex,
  title,
  setTitle,
  category,
  setCategory,
  country,
  setCountry,
  uploadProgress,
  setUploadProgress,
  uploadStatus,
  setUploadStatus
}) {
  const handleFilesSelected = (files) => {
    setSelectedFiles(Array.from(files));
    setActiveIndex(0);
    setUploadProgress(0);
    setUploadStatus("Waiting for upload...");
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus("Please select files first");
      return;
    }

    setUploadStatus("Uploading to Firebase...");

    // Simulate upload progress (replace with actual Firebase upload)
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setUploadStatus("Upload complete!");
    setTimeout(() => setUploadStatus("Waiting for upload..."), 3000);
  };

  return (
    <div className="card upload-panel">
      <div className="logo">⬆</div>
      <h1 className="title">Upload Project</h1>
      <p className="subtitle">
        Upload telecom, networking, studio and broadcast projects directly to
        Firebase.
      </p>

      <Dropzone onFilesSelected={handleFilesSelected} />

      {selectedFiles.length > 0 && (
        <ImageThumbnails
          files={selectedFiles}
          activeIndex={activeIndex}
          onThumbnailClick={setActiveIndex}
        />
      )}

      <FormInput
        label="Project Title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="FM Broadcast Studio"
      />

      <FormInput
        label="Category"
        type="select"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={["studio", "network", "telecom", "broadcast"]}
      />

      <FormInput
        label="Country"
        type="text"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        placeholder="Enter country name"
      />

      <button className="upload-btn" onClick={handleUpload}>
        Upload To Firebase
      </button>

      <ProgressBar progress={uploadProgress} status={uploadStatus} />
    </div>
  );
}

export default UploadPanel;
