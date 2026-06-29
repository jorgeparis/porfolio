const API_BASE_URL = "http://localhost:8000/api";

class ProjectService {
  async getGalleryProjects(category = null) {
    try {
      let url = `${API_BASE_URL}/projects/gallery`;
      if (category && category !== "all") {
        url += `?category=${category}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      let projects = [];
      if (Array.isArray(data)) {
        projects = data;
      } else if (data.projects) {
        projects = data.projects;
      }

      // Transform projects to include full_url for images
      return projects.map((project) => ({
        ...project,
        images:
          project.images?.map((image) => ({
            ...image,
            full_url:
              image.full_url || this.getImageUrl(image.file_path || image.url)
          })) || [],
        primary_image: project.primary_image
          ? {
              ...project.primary_image,
              full_url:
                project.primary_image.full_url ||
                this.getImageUrl(
                  project.primary_image.file_path || project.primary_image.url
                )
            }
          : null
      }));
    } catch (error) {
      console.error("Error in getGalleryProjects:", error);
      throw error;
    }
  }

  getImageUrl(filePath) {
    if (!filePath) return "/api/placeholder/400/300";

    // If it's already a full URL, return it
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    // Remove leading/trailing slashes and clean up the path
    let cleanPath = filePath.replace(/^\/+/, "").replace(/\\/g, "/");

    // If the path already starts with 'uploads/', we don't need to add it again
    if (!cleanPath.startsWith("uploads/")) {
      cleanPath = `uploads/${cleanPath}`;
    }

    // Construct the full URL
    return `http://localhost:8000/${cleanPath}`;
  }
}

export default new ProjectService();
