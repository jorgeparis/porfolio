// src/services/api.js
import axios from "axios";

// Your existing backend
const EXISTING_API_URL =
  import.meta.env.VITE_EXISTING_API_URL || "http://localhost:8000";

// New blog backend
const BLOG_API_URL =
  import.meta.env.VITE_BLOG_API_URL || "http://localhost:8001";

// For your existing backend
export const existingApi = axios.create({
  baseURL: EXISTING_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// For the new blog backend
export const blogApi = axios.create({
  baseURL: BLOG_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor for blog API
blogApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("blog_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for blog API
blogApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("blog_access_token");
      // Redirect to blog login instead of main login
      window.location.href = "/blog/login";
    }
    return Promise.reject(error);
  }
);

// Blog API methods
export const blogService = {
  // Posts
  getPosts: (params) => blogApi.get("/api/blog/posts", { params }),
  getPost: (slug) => blogApi.get(`/api/blog/posts/${slug}`),
  createPost: (data) => blogApi.post("/api/blog/posts", data),
  updatePost: (id, data) => blogApi.put(`/api/blog/posts/${id}`, data),
  deletePost: (id) => blogApi.delete(`/api/blog/posts/${id}`),

  // Comments
  getComments: (postId, params) =>
    blogApi.get(`/api/blog/posts/${postId}/comments`, { params }),
  createComment: (postId, data) =>
    blogApi.post(`/api/blog/posts/${postId}/comments`, data),

  // Auth
  login: (data) =>
    blogApi.post("/api/blog/auth/token", new URLSearchParams(data)),
  register: (data) => blogApi.post("/api/blog/auth/register", data)
};

// Your existing API service methods
export const existingService = {
  // Add your existing API methods here
  // For example:
  getUser: () => existingApi.get("/api/user"),
  updateProfile: (data) => existingApi.put("/api/user", data)
  // ... etc
};
