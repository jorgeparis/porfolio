import React, { useState } from "react";
import Dropzone from "./Dropzone";
import FormInput from "./FormInput";
import ImageThumbnails from "./ImageThumbnails";
import ProgressBar from "./ProgressBar";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState("");

  const handleFilesSelected = (files) => {
    setSelectedFiles(Array.from(files));
    setActiveIndex(0);
    setUploadProgress(0);
    setUploadStatus("Waiting for upload...");
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setTitle("");
    setDescription("");
    setCountry("");
    setCategory("studio");
    setActiveIndex(0);
    setUploadProgress(0);
    setUploadStatus("Waiting for upload...");
  };

  const validateForm = () => {
    if (selectedFiles.length === 0) {
      setUploadStatus("Please select at least one image");
      return false;
    }

    if (!title.trim()) {
      setUploadStatus("Please enter a project title");
      return false;
    }

    if (title.trim().length > 200) {
      setUploadStatus("Project title is too long (max 200 characters)");
      return false;
    }

    if (!country.trim()) {
      setUploadStatus("Please enter a country");
      return false;
    }

    if (country.trim().length > 100) {
      setUploadStatus("Country name is too long (max 100 characters)");
      return false;
    }

    // Check file sizes
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const largeFiles = selectedFiles.filter((file) => file.size > maxFileSize);
    if (largeFiles.length > 0) {
      setUploadStatus(`Some files are too large (max 10MB each)`);
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Preparing upload...");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("country", country.trim());

    if (description.trim()) {
      formData.append("description", description.trim());
    }

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
        setUploadStatus(`Uploading: ${percentComplete}%`);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          setUploadProgress(100);
          setUploadStatus(
            `✅ Success! Project "${result.project.title}" uploaded with ${result.images_count} image(s)`
          );
          setTimeout(() => resetForm(), 4000);
        } catch (error) {
          setUploadStatus(`❌ Error parsing server response`);
          setUploadProgress(0);
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          setUploadStatus(`❌ ${error.detail || "Upload failed"}`);
        } catch {
          setUploadStatus(`❌ Server error (${xhr.status})`);
        }
        setUploadProgress(0);
      }
      setIsUploading(false);
    });

    xhr.addEventListener("error", () => {
      setUploadStatus("❌ Network error. Is the backend server running?");
      setUploadProgress(0);
      setIsUploading(false);
    });

    xhr.addEventListener("timeout", () => {
      setUploadStatus("❌ Upload timeout. Please try again.");
      setUploadProgress(0);
      setIsUploading(false);
    });

    xhr.timeout = 30000; // 30 second timeout
    xhr.open("POST", `${API_BASE_URL}/upload/project-with-images`);
    xhr.send(formData);
  };

  return (
    <div className="card upload-panel">
      <div className="logo">⬆</div>
      <h1 className="title">Upload Project</h1>
      <p className="subtitle">
        Upload telecom, networking, studio and broadcast projects directly to
        FastAPI backend.
      </p>

      <Dropzone onFilesSelected={handleFilesSelected} />

      {selectedFiles.length > 0 && (
        <>
          <ImageThumbnails
            files={selectedFiles}
            activeIndex={activeIndex}
            onThumbnailClick={setActiveIndex}
          />
          <div className="file-info">
            {selectedFiles.length} file(s) selected, total size:{" "}
            {(
              selectedFiles.reduce((sum, f) => sum + f.size, 0) /
              1024 /
              1024
            ).toFixed(2)}{" "}
            MB
          </div>
        </>
      )}

      <FormInput
        label="Project Title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="FM Broadcast Studio"
        required
      />

      <FormInput
        label="Description"
        type="textarea"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your project (optional)"
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
        required
      />

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={isUploading || selectedFiles.length === 0}
      >
        {isUploading ? `Uploading... ${uploadProgress}%` : "Upload To Backend"}
      </button>

      <ProgressBar progress={uploadProgress} status={uploadStatus} />
    </div>
  );
}

export default UploadPanel;
