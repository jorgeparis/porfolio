// src/App.jsx
import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import MiniPlayer from "./components/MiniPlayer";
import { RadioProvider } from "./context/RadioContext";
import { ThemeProvider } from "./context/ThemeContext";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import RadioPage from "./pages/RadioPage";
import "./styles/global.css";

// Import blog components
import BlogList from "./components/Blog/BlogList";
import BlogPost from "./components/Blog/BlogPost";

// Import QueryClient for blog
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a query client for blog data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  }
});

function App() {
  return (
    <ThemeProvider>
      <RadioProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              {/* Existing routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/radio" element={<RadioPage />} />
              <Route path="/projects" element={<ProjectsPage />} />

              {/* Blog routes */}
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
            </Routes>
            <MiniPlayer />
          </Router>
        </QueryClientProvider>
      </RadioProvider>
    </ThemeProvider>
  );
}

export default App;
