const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

class ApiService {
  // Project endpoints
  async getProjects(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/projects?${params}`);
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
  }

  async getGalleryProjects(category = null, country = null) {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (country) params.append("country", country);
    const response = await fetch(`${API_BASE_URL}/projects/gallery?${params}`);
    if (!response.ok) throw new Error("Failed to fetch gallery projects");
    return response.json();
  }

  async getProject(id) {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    if (!response.ok) throw new Error("Failed to fetch project");
    return response.json();
  }

  async createProject(projectData) {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData)
    });
    if (!response.ok) throw new Error("Failed to create project");
    return response.json();
  }

  async updateProject(id, projectData) {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData)
    });
    if (!response.ok) throw new Error("Failed to update project");
    return response.json();
  }

  async deleteProject(id) {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete project");
    return response.json();
  }

  // Upload endpoints
  async uploadProject(formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.detail || "Upload failed"));
          } catch {
            reject(new Error("Upload failed"));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error occurred"));
      });

      xhr.open("POST", `${API_BASE_URL}/upload/project-with-images`);
      xhr.send(formData);
    });
  }

  // Metadata endpoints
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/projects/categories/list`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
  }

  async getCountries() {
    const response = await fetch(`${API_BASE_URL}/projects/countries/list`);
    if (!response.ok) throw new Error("Failed to fetch countries");
    return response.json();
  }

  // Image endpoints
  async setPrimaryImage(imageId) {
    const response = await fetch(
      `${API_BASE_URL}/projects/images/${imageId}/primary`,
      {
        method: "PUT"
      }
    );
    if (!response.ok) throw new Error("Failed to set primary image");
    return response.json();
  }

  getImageUrl(filePath) {
    return `http://localhost:8000/uploads/${filePath
      .split("uploads/")[1]
      .replace(/\\/g, "/")}`;
  }
}

export default new ApiService();
