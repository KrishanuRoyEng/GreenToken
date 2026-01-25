import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminService, projectService } from "../services/api";
import { User } from "../types";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { StatusBadge, EcosystemBadge, Modal, ModalFooter, Pagination } from "../components/ui";
import AdminLayout from "../components/admin/AdminLayout";
import AdminStats from "../components/admin/AdminStats";
import AdminMap from "../components/admin/AdminMap";
import AIDashboard from "../components/ai/AIDashboard";
import toast from "react-hot-toast";

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);

  // Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotalPages, setProjectTotalPages] = useState(1);
  const [projectFilter, setProjectFilter] = useState("");
  const [projectSearch, setProjectSearch] = useState("");

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userFilter, setUserFilter] = useState(""); // Role filter
  const [userSearch, setUserSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [projectToReject, setProjectToReject] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'projects' || activeTab === 'dashboard') {
      loadProjects();
    }
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, projectPage, projectFilter, projectSearch, userPage, userFilter, userSearch]);

  const loadStats = async () => {
    try {
      const data = await adminService.getSystemStats();
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to load stats");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await adminService.getAllProjects({
        page: projectPage,
        limit: 10,
        status: projectFilter,
        search: projectSearch
      });
      setProjects(data.projects);
      setProjectTotalPages(data.pagination.pages);
    } catch (error) {
      toast.error("Failed to load projects");
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminService.getAllUsers({
        page: userPage,
        limit: 10,
        role: userFilter,
        search: userSearch
      });
      setUsers(data.users);
      setUserTotalPages(data.pagination.pages);
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const handleStatFilter = (type: 'projects' | 'users', filter?: string) => {
    if (type === 'projects') {
      setActiveTab('projects');
      setProjectFilter(filter || '');
    } else {
      setActiveTab('users');
    }
  };

  const handleApproveProject = async (projectId: string) => {
    try {
      await adminService.approveProject(projectId);
      toast.success("Project approved!");
      loadProjects();
      loadStats();
      setSelectedProject(null);
    } catch (error) {
      toast.error("Failed to approve project");
    }
  };

  const handleRejectProject = async () => {
    if (!projectToReject) return;
    try {
      await adminService.rejectProject(projectToReject, rejectReason);
      toast.success("Project rejected");
      setShowRejectModal(false);
      setRejectReason("");
      setProjectToReject(null);
      loadProjects();
      loadStats();
      setSelectedProject(null);
    } catch (error) {
      toast.error("Failed to reject project");
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      await adminService.updateUserRole(userId, role);
      toast.success("User role updated!");
      loadUsers();
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const viewProjectDetails = async (projectId: string) => {
    try {
      const project = await projectService.getProject(projectId);
      setSelectedProject(project);
    } catch (error) {
      toast.error("Failed to load project details");
    }
  };

  if (user?.role !== "ADMIN") return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {activeTab === 'dashboard' && 'Admin Dashboard'}
          {activeTab === 'projects' && 'Project Management'}
          {activeTab === 'users' && 'User Management'}
          {activeTab === 'map' && 'Restoration Map'}
          {activeTab === 'ai' && 'AI Ecosystem Analysis'}
          {activeTab === 'settings' && 'System Settings'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {activeTab === 'dashboard' && stats && (
        <>
          <AdminStats stats={stats} onFilter={handleStatFilter} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Recent Projects</h3>
              <div className="space-y-4">
                {projects.slice(0, 5).map(p => (
                  <div key={p.id} className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.owner?.name}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4" onClick={() => setActiveTab('projects')}>View All Projects</Button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Recent Users</h3>
              <div className="space-y-4">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{u.role}</span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4" onClick={() => setActiveTab('users')}>View All Users</Button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'map' && <AdminMap />}
      {activeTab === 'ai' && <AIDashboard />}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search projects..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {projects.map((project) => (
            <div key={project.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{project.name}</h3>
                    <EcosystemBadge ecosystem={project.ecosystemType} />
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-slate-500 dark:text-slate-400">
                      ID: <span className="text-slate-900 dark:text-white font-mono text-xs">{project.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      Owner: <span className="text-slate-900 dark:text-white">{project.owner?.name}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      Area: <span className="text-slate-900 dark:text-white">{project.areaHectares} ha</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      Docs: <span className="text-slate-900 dark:text-white">{project._count?.documents || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => viewProjectDetails(project.id)}>
                    Details
                  </Button>
                  {project.status === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={() => handleApproveProject(project.id)}>
                        Approve
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => {
                        setProjectToReject(project.id);
                        setShowRejectModal(true);
                      }}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Pagination
            currentPage={projectPage}
            totalPages={projectTotalPages}
            totalItems={projects.length * projectTotalPages} // Approx
            itemsPerPage={10}
            onPageChange={setProjectPage}
          />
        </div>
      )
      }

      {
        activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">All Roles</option>
                <option value="NGO">NGO</option>
                <option value="PANCHAYAT">Panchayat</option>
                <option value="COMMUNITY">Community</option>
                <option value="RESEARCHER">Researcher</option>
                <option value="VERIFIER">Verifier</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-400 to-coastal-500 flex items-center justify-center text-white font-medium">
                              {userItem.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{userItem.name}</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">{userItem.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {userItem.organizationName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={userItem.role}
                            onChange={(e) => handleUpdateUserRole(userItem.id, e.target.value)}
                            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
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
                          <StatusBadge status={userItem.isVerified ? "APPROVED" : "PENDING"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              currentPage={userPage}
              totalPages={userTotalPages}
              totalItems={users.length * userTotalPages}
              itemsPerPage={10}
              onPageChange={setUserPage}
            />
          </div>
        )
      }

      {/* Project Details Modal - Copied from original */}
      {
        selectedProject && (
          <Modal isOpen={true} onClose={() => setSelectedProject(null)} title={selectedProject.name} size="xl">
            <div className="space-y-6">
              {/* Project Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Location</div>
                  <div className="font-medium text-slate-900 dark:text-white">{selectedProject.location}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Area</div>
                  <div className="font-medium text-slate-900 dark:text-white">{selectedProject.areaHectares} ha</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Ecosystem</div>
                  <div className="font-medium text-slate-900 dark:text-white">{selectedProject.ecosystemType?.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Description */}
              {selectedProject.description && (
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Description</h4>
                  <p className="text-slate-600 dark:text-slate-400">{selectedProject.description}</p>
                </div>
              )}

              {/* Documents */}
              {selectedProject.documents?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Uploaded Documents ({selectedProject.documents.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedProject.documents.map((doc: any) => (
                      <div key={doc.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-ocean-600 dark:text-ocean-400">{doc.documentType}</span>
                        </div>
                        <p className="text-sm text-slate-900 dark:text-white truncate">{doc.originalName}</p>
                        {doc.ipfsUrl && (
                          <a
                            href={doc.ipfsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-ocean-500 hover:underline mt-1 block"
                          >
                            View on IPFS →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Info */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Owner</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-400 to-coastal-500 flex items-center justify-center text-white font-medium">
                    {selectedProject.owner?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedProject.owner?.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedProject.owner?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <ModalFooter>
              <Button variant="ghost" onClick={() => setSelectedProject(null)}>
                Close
              </Button>
              {selectedProject.status === 'PENDING' && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setProjectToReject(selectedProject.id);
                      setShowRejectModal(true);
                    }}
                  >
                    Reject
                  </Button>
                  <Button onClick={() => handleApproveProject(selectedProject.id)}>
                    Approve Project
                  </Button>
                </>
              )}

            </ModalFooter>
          </Modal>
        )
      }

      {/* Reject Modal */}
      {
        showRejectModal && (
          <Modal isOpen={true} onClose={() => setShowRejectModal(false)} title="Reject Project" size="sm">
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Please provide a reason for rejecting this project. This will be shared with the project owner.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRejectProject}>
                Confirm Rejection
              </Button>
            </ModalFooter>
          </Modal>
        )
      }
    </AdminLayout >
  );
};

export default Admin;
