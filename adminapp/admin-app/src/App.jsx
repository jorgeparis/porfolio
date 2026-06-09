import React, { useState } from "react";
import "./App.css";
import PreviewPanel from "./components/PreviewPanel";
import UploadPanel from "./components/UploadPanel";

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("studio");
  const [country, setCountry] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("Waiting for upload...");

  return (
    <div className="shell">
      <UploadPanel
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        title={title}
        setTitle={setTitle}
        category={category}
        setCategory={setCategory}
        country={country}
        setCountry={setCountry}
        uploadProgress={uploadProgress}
        setUploadProgress={setUploadProgress}
        uploadStatus={uploadStatus}
        setUploadStatus={setUploadStatus}
      />
      <PreviewPanel
        selectedFiles={selectedFiles}
        activeIndex={activeIndex}
        title={title}
        category={category}
        country={country}
      />
    </div>
  );
}

export default App;
