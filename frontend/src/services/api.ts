import axios, { AxiosInstance } from "axios";

// Change the base URL to NOT include the /api prefix
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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

  async put(url: string, data?: any, config?: any) {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  async delete(url: string, config?: any) {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  // Auth methods
  async login(email: string, password: string) {
    // Add /api prefix to each call
    const response = await this.api.post("/api/auth/login", { email, password });
    return response.data;
  }

  async register(userData: any) {
    // Add /api prefix to each call
    const response = await this.api.post("/api/auth/register", userData);
    return response.data;
  }

  async getProfile() {
    // Add /api prefix to each call
    const response = await this.api.get("/api/auth/profile");
    return response.data;
  }

  async updateProfile(data: any) {
    // Add /api prefix to each call
    const response = await this.api.put("/api/auth/profile", data);
    return response.data;
  }

  // Project methods
  async getProjects(filters?: any) {
    // Add /api prefix to each call
    const response = await this.api.get("/api/projects", { params: filters });
    return response.data;
  }

  async getUserProjects() {
    // Add /api prefix to each call
    const response = await this.api.get("/api/projects/user");
    return response.data;
  }

  async getProject(id: string) {
    // Add /api prefix to each call
    const response = await this.api.get(`/api/projects/${id}`);
    return response.data;
  }

  async createProject(projectData: any) {
    // Add /api prefix to each call
    const response = await this.api.post("/api/projects", projectData);
    return response.data;
  }

  async updateProject(id: string, data: any) {
    // Add /api prefix to each call
    const response = await this.api.put(`/api/projects/${id}`, data);
    return response.data;
  }

  async approveProject(id: string) {
    // Add /api prefix to each call
    const response = await this.api.post(`/api/projects/${id}/approve`);
    return response.data;
  }

  async rejectProject(id: string, reason?: string) {
    // Add /api prefix to each call
    const response = await this.api.post(`/api/projects/${id}/reject`, { reason });
    return response.data;
  }

  // Token methods
  async getUserTokens() {
    // Add /api prefix to each call
    const response = await this.api.get("/api/tokens/balance");
    return response.data;
  }

  async buyTokens(amount: number) {
    // Add /api prefix to each call
    const response = await this.api.post("/api/tokens/buy", { amount });
    return response.data;
  }

  async sellTokens(amount: number, pricePerToken: number) {
    // Add /api prefix to each call
    const response = await this.api.post("/api/tokens/sell", {
      amount,
      pricePerToken,
    });
    return response.data;
  }

  async getMarketplace(params?: any) {
    // Add /api prefix to each call
    const response = await this.api.get("/api/tokens/marketplace", { params });
    return response.data;
  }

  async purchaseFromMarketplace(orderId: string) {
    // Add /api prefix to each call
    const response = await this.api.post(
      `/api/tokens/marketplace/${orderId}/purchase`
    );
    return response.data;
  }

  // Admin methods
  async getSystemStats() {
    // Add /api prefix to each call
    const response = await this.api.get("/api/admin/stats");
    return response.data;
  }

  async getAllUsers(params?: any) {
    // Add /api prefix to each call
    const response = await this.api.get("/api/admin/users", { params });
    return response.data;
  }

  async updateUserRole(userId: string, role: string) {
    // Add /api prefix to each call
    const response = await this.api.put(`/api/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  }

  async verifyUser(userId: string) {
    // Add /api prefix to each call
    const response = await this.api.post(`/api/admin/users/${userId}/verify`);
    return response.data;
  }

  async getAllProjects(params?: any) {
    const response = await this.api.get("/api/admin/projects", { params });
    return response.data;
  }

  async getMapData() {
    const response = await this.api.get("/api/admin/map-data");
    return response.data;
  }

  async getPendingApprovals() {
    // Add /api prefix to each call
    const response = await this.api.get("/api/admin/projects/pending");
    return response.data;
  }

  async issueCredits(projectId: string, amount: number, verificationData: any) {
    // Add /api prefix to each call
    const response = await this.api.post(
      `/api/admin/projects/${projectId}/issue-credits`,
      {
        amount,
        verificationData,
      }
    );
    return response.data;
  }

  // Upload methods
  async uploadFile(file: File, projectId?: string, documentType?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (projectId) formData.append("projectId", projectId);
    if (documentType) formData.append("documentType", documentType);

    const response = await this.api.post("/api/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async uploadDroneData(file: File, projectId: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    const response = await this.api.post("/api/uploads/drone", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async getProjectDocuments(projectId: string) {
    const response = await this.api.get(`/api/uploads/project/${projectId}`);
    return response.data;
  }

  async deleteFile(fileId: string) {
    const response = await this.api.delete(`/api/uploads/${fileId}`);
    return response.data;
  }

  // Wallet methods
  async getWalletInfo() {
    const response = await this.api.get("/api/auth/wallet");
    return response.data;
  }

  async setCustomWallet(walletAddress: string) {
    const response = await this.api.post("/api/auth/wallet/custom", { walletAddress });
    return response.data;
  }

  async useCustodianWallet() {
    const response = await this.api.post("/api/auth/wallet/custodian");
    return response.data;
  }

  // Project finalization
  async finalizeProject(projectId: string) {
    const response = await this.api.post(`/api/projects/${projectId}/finalize`);
    return response.data;
  }

  // Payment methods
  async getPaymentMode() {
    const response = await this.api.get('/api/payments/mode');
    return response.data;
  }

  async createPaymentOrder(data: { amount: number; tokenAmount: number; orderId?: string; currency?: string }) {
    const response = await this.api.post('/api/payments/create-order', data);
    return response.data;
  }

  async verifyPayment(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; demoMode?: boolean }) {
    const response = await this.api.post('/api/payments/verify', data);
    return response.data;
  }

  async getPaymentHistory(params?: { page?: number; limit?: number }) {
    const response = await this.api.get('/api/payments/history', { params });
    return response.data;
  }

  async verifyCryptoPayment(data: { txHash: string; amount: number; tokenAmount: number; orderId?: string; walletAddress: string }) {
    const response = await this.api.post('/api/payments/crypto/verify', data);
    return response.data;
  }

  // Get user's own marketplace listings
  async getUserListings() {
    const response = await this.api.get('/api/tokens/marketplace/my-listings');
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
  getWalletInfo: apiService.getWalletInfo.bind(apiService),
  setCustomWallet: apiService.setCustomWallet.bind(apiService),
  useCustodianWallet: apiService.useCustodianWallet.bind(apiService),
};

export const projectService = {
  getProjects: apiService.getProjects.bind(apiService),
  getUserProjects: apiService.getUserProjects.bind(apiService),
  getProject: apiService.getProject.bind(apiService),
  createProject: apiService.createProject.bind(apiService),
  updateProject: apiService.updateProject.bind(apiService),
  approveProject: apiService.approveProject.bind(apiService),
  rejectProject: apiService.rejectProject.bind(apiService),
  finalizeProject: apiService.finalizeProject.bind(apiService),
};

export const tokenService = {
  getUserTokens: apiService.getUserTokens.bind(apiService),
  buyTokens: apiService.buyTokens.bind(apiService),
  sellTokens: apiService.sellTokens.bind(apiService),
  getMarketplace: apiService.getMarketplace.bind(apiService),
  purchaseFromMarketplace: apiService.purchaseFromMarketplace.bind(apiService),
  getUserListings: apiService.getUserListings.bind(apiService),
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
  getAllProjects: apiService.getAllProjects.bind(apiService),
  getMapData: apiService.getMapData.bind(apiService),
};

export const uploadService = {
  uploadFile: apiService.uploadFile.bind(apiService),
  uploadDroneData: apiService.uploadDroneData.bind(apiService),
  getProjectDocuments: apiService.getProjectDocuments.bind(apiService),
  deleteFile: apiService.deleteFile.bind(apiService),
};

export const paymentService = {
  getPaymentMode: apiService.getPaymentMode.bind(apiService),
  createOrder: apiService.createPaymentOrder.bind(apiService),
  verifyPayment: apiService.verifyPayment.bind(apiService),
  verifyCryptoPayment: apiService.verifyCryptoPayment.bind(apiService),
  getHistory: apiService.getPaymentHistory.bind(apiService),
};