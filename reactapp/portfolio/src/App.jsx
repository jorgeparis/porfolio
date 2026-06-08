import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import MiniPlayer from "./components/MiniPlayer";
import { RadioProvider } from "./context/RadioContext";
import { ThemeProvider } from "./context/ThemeContext";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import RadioPage from "./pages/RadioPage";
import "./styles/global.css";

function App() {
  return (
    <ThemeProvider>
      <RadioProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/radio" element={<RadioPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
          </Routes>
          <MiniPlayer />
        </Router>
      </RadioProvider>
    </ThemeProvider>
  );
}

export default App;
