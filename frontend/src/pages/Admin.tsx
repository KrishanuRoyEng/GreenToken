import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminService } from "../services/api";
import { Project, User } from "../types";
import { Users, CheckCircle, XCircle, BarChart3, Clock } from "lucide-react";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Project[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "users">(
    "overview"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsData, pendingData, usersData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getPendingApprovals(),
        adminService.getAllUsers(),
      ]);

      setStats(statsData.stats);
      setPendingProjects(pendingData);
      setUsers(usersData.users || usersData);
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveProject = async (projectId: string) => {
    try {
      await adminService.approveProject(projectId);
      toast.success("Project approved successfully!");
      loadAdminData(); // Refresh data
    } catch (error) {
      toast.error("Failed to approve project");
    }
  };

  const handleRejectProject = async (projectId: string) => {
    try {
      await adminService.rejectProject(projectId);
      toast.success("Project rejected");
      loadAdminData(); // Refresh data
    } catch (error) {
      toast.error("Failed to reject project");
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      await adminService.updateUserRole(userId, role);
      toast.success("User role updated successfully!");
      loadAdminData(); // Refresh data
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage system operations, users, and project approvals
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg p-1 shadow-sm mb-8">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-4 rounded-md font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <BarChart3 className="inline mr-2 h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`py-3 px-4 rounded-md font-medium transition-colors ${
                activeTab === "projects"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Clock className="inline mr-2 h-4 w-4" />
              Pending Projects
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-3 px-4 rounded-md font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="inline mr-2 h-4 w-4" />
              User Management
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              System Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.length > 0 ? (
                stats.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl p-6 shadow-md flex flex-col"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {project.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Status: {project.status}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Estimated Credits: {project.estimatedCredits}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Issued Credits: {project.issuedCredits}
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      Project ID: {project.id}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No stats available</p>
              )}
            </div>
          </div>
        )}
        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Projects Pending Approval
            </h2>

            {pendingProjects.length > 0 ? (
              pendingProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl p-6 shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {project.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>
                      <strong>Location:</strong> {project.location}
                    </p>
                    <p>
                      <strong>Area:</strong> {project.areaHectares} hectares
                    </p>
                    <p>
                      <strong>Type:</strong> {project.ecosystemType}
                    </p>
                    <p>
                      <strong>Owner:</strong> {project.owner?.name}
                    </p>
                    <p>
                      <strong>Organization:</strong>{" "}
                      {project.owner?.organizationName}
                    </p>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {project.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleApproveProject(project.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleRejectProject(project.id)}
                      className="flex-1"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <Clock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No pending projects
                </h3>
                <p className="text-gray-500">
                  All submitted projects have been reviewed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              User Management
            </h2>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userItem.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userItem.organizationName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={userItem.role}
                            onChange={(e) =>
                              handleUpdateUserRole(userItem.id, e.target.value)
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="NGO">NGO</option>
                            <option value="PANCHAYAT">Panchayat</option>
                            <option value="COMMUNITY">Community</option>
                            <option value="RESEARCHER">Researcher</option>
                            <option value="VERIFIER">Verifier</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              userItem.isVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {userItem.isVerified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {!userItem.isVerified && (
                            <Button size="sm" onClick={() => {}}>
                              Verify
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
