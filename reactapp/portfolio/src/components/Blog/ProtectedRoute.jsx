// src/components/Blog/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("blog_access_token");

  if (!token) {
    // Redirect to login page if not authenticated
    return <Navigate to="/blog/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
