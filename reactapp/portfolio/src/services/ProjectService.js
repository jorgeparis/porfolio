const API_BASE_URL = 'http://localhost:8000/api';

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
      
      return projects;
    } catch (error) {
      console.error("Error in getGalleryProjects:", error);
      throw error;
    }
  }

  getImageUrl(filePath) {
    if (!filePath) return "/api/placeholder/400/300";
    let relativePath = filePath.split('uploads').pop();
    relativePath = relativePath.replace(/\\/g, '/');
    return `http://localhost:8000/uploads${relativePath}`;
  }
}

export default new ProjectService();