import axios, { AxiosInstance } from "axios";

const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL || "http://localhost:5000/api";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
        return Promise.reject(error);
      }
    );
  }
  // Test Methods
  // Add generic HTTP methods
  async get(url: string, config?: any) {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post(url: string, data?: any, config?: any) {
    const response = await this.api.post(url, data, config);
    return response.data;
  }
  // Auth methods
  async login(email: string, password: string) {
    const response = await this.api.post("/auth/login", { email, password });
    return response.data;
  }

  async register(userData: any) {
    const response = await this.api.post("/auth/register", userData);
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get("/auth/profile");
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.api.put("/auth/profile", data);
    return response.data;
  }

  // Project methods
  async getProjects(filters?: any) {
    const response = await this.api.get("/projects", { params: filters });
    return response.data;
  }

  async getUserProjects() {
    const response = await this.api.get("/projects/user");
    return response.data;
  }

  async getProject(id: string) {
    const response = await this.api.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(projectData: any) {
    const response = await this.api.post("/projects", projectData);
    return response.data;
  }

  async updateProject(id: string, data: any) {
    const response = await this.api.put(`/projects/${id}`, data);
    return response.data;
  }

  async approveProject(id: string) {
    const response = await this.api.post(`/projects/${id}/approve`);
    return response.data;
  }

  async rejectProject(id: string, reason?: string) {
    const response = await this.api.post(`/projects/${id}/reject`, { reason });
    return response.data;
  }

  // Token methods
  async getUserTokens() {
    const response = await this.api.get("/tokens/balance");
    return response.data;
  }

  async buyTokens(amount: number) {
    const response = await this.api.post("/tokens/buy", { amount });
    return response.data;
  }

  async sellTokens(amount: number, pricePerToken: number) {
    const response = await this.api.post("/tokens/sell", {
      amount,
      pricePerToken,
    });
    return response.data;
  }

  async getMarketplace(params?: any) {
    const response = await this.api.get("/tokens/marketplace", { params });
    return response.data;
  }

  async purchaseFromMarketplace(orderId: string) {
    const response = await this.api.post(
      `/tokens/marketplace/${orderId}/purchase`
    );
    return response.data;
  }

  // Admin methods
  async getSystemStats() {
    const response = await this.api.get("/admin/stats");
    return response.data;
  }

  async getAllUsers(params?: any) {
    const response = await this.api.get("/admin/users", { params });
    return response.data;
  }

  async updateUserRole(userId: string, role: string) {
    const response = await this.api.put(`/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  }

  async verifyUser(userId: string) {
    const response = await this.api.post(`/admin/users/${userId}/verify`);
    return response.data;
  }

  async getPendingApprovals() {
    const response = await this.api.get("/admin/projects/pending");
    return response.data;
  }

  async issueCredits(projectId: string, amount: number, verificationData: any) {
    const response = await this.api.post(
      `/admin/projects/${projectId}/issue-credits`,
      {
        amount,
        verificationData,
      }
    );
    return response.data;
  }

  // Upload methods
  async uploadFile(file: File, projectId?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (projectId) formData.append("projectId", projectId);

    const response = await this.api.post("/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
}

export const apiService = new ApiService();

// Individual service exports
export const authService = {
  login: apiService.login.bind(apiService),
  register: apiService.register.bind(apiService),
  getProfile: apiService.getProfile.bind(apiService),
  updateProfile: apiService.updateProfile.bind(apiService),
};

export const projectService = {
  getProjects: apiService.getProjects.bind(apiService),
  getUserProjects: apiService.getUserProjects.bind(apiService),
  getProject: apiService.getProject.bind(apiService),
  createProject: apiService.createProject.bind(apiService),
  updateProject: apiService.updateProject.bind(apiService),
  approveProject: apiService.approveProject.bind(apiService),
  rejectProject: apiService.rejectProject.bind(apiService),
};

export const tokenService = {
  getUserTokens: apiService.getUserTokens.bind(apiService),
  buyTokens: apiService.buyTokens.bind(apiService),
  sellTokens: apiService.sellTokens.bind(apiService),
  getMarketplace: apiService.getMarketplace.bind(apiService),
  purchaseFromMarketplace: apiService.purchaseFromMarketplace.bind(apiService),
};

export const adminService = {
  getSystemStats: apiService.getSystemStats.bind(apiService),
  getAllUsers: apiService.getAllUsers.bind(apiService),
  updateUserRole: apiService.updateUserRole.bind(apiService),
  verifyUser: apiService.verifyUser.bind(apiService),
  getPendingApprovals: apiService.getPendingApprovals.bind(apiService),
  issueCredits: apiService.issueCredits.bind(apiService),
  approveProject: apiService.approveProject.bind(apiService),
  rejectProject: apiService.rejectProject.bind(apiService),
};
