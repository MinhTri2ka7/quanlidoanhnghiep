import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllProjects, createProject, getAllUsers } from "../../utils/api.js";
import { useCurrentUser } from "../../utils/useCurrentUser.js";

function ProjectsPage() {
  const { user, isAdmin, isManager } = useCurrentUser();

  const [projects, setProjects]       = useState([]);
  const [users, setUsers]             = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState(null);

  // States for creating a project (chỉ Admin dùng)
  const [isCreateModalOpen, setIsCreateModalOpen]   = useState(false);
  const [newProjectName, setNewProjectName]         = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectStartDate, setNewProjectStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [newProjectEndDate, setNewProjectEndDate]   = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [newProjectManagerId, setNewProjectManagerId] = useState("");
  const [newProjectRoadmap, setNewProjectRoadmap]   = useState("");
  const [newProjectNotes, setNewProjectNotes]       = useState("");
  const [isSubmitting, setIsSubmitting]             = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [projectsData, usersData] = await Promise.all([
          getAllProjects(),
          getAllUsers().catch(() => [])
        ]);
        setUsers(usersData || []);

        let mapped = (projectsData || []).map((proj) => ({
          id:            proj.id,
          name:          proj.name,
          description:   proj.description,
          priority:      "medium",
          status:        proj.status || "active",
          progress:      proj.progress || 0,
          taskCount:     proj.taskCount || 0,
          taskCompleted: proj.taskCompleted || 0,
          deadline:      proj.endDate ? proj.endDate.substring(0, 10) : "Không thời hạn",
          managerId:     proj.managerId,
          managerName:   proj.managerName,
          roadmap:       proj.roadmap,
          notes:         proj.notes,
          members:       (proj.members || []).map(m => ({
            id: m.id,
            avatar: m.avatar && (m.avatar.startsWith("http") || m.avatar.includes("/")) ? m.avatar : (m.fullname || "?")[0].toUpperCase()
          }))
        }));

        // ─── Manager chỉ thấy dự án được Admin giao cho họ quản lý ───
        if (isManager && user?.id) {
          mapped = mapped.filter(p => String(p.managerId) === String(user.id));
        }

        setProjects(mapped);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isManager, user?.id]);

  async function handleCreateProject(event) {
    event.preventDefault();
    if (!newProjectName.trim()) return;

    setIsSubmitting(true);
    try {
      const createdPrj = await createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        startDate: newProjectStartDate,
        endDate: newProjectEndDate,
        managerId: newProjectManagerId ? parseInt(newProjectManagerId, 10) : null,
        roadmap: newProjectRoadmap.trim(),
        notes: newProjectNotes.trim()
      });

      const mappedPrj = {
        id: createdPrj.id,
        name: createdPrj.name,
        description: createdPrj.description,
        priority: "medium",
        status: createdPrj.status || "active",
        progress: 0,
        taskCount: 0,
        taskCompleted: 0,
        deadline: createdPrj.endDate ? createdPrj.endDate.substring(0, 10) : "Không thời hạn",
        managerId: createdPrj.managerId,
        managerName: createdPrj.managerName,
        roadmap: createdPrj.roadmap,
        notes: createdPrj.notes,
        members: [{ id: "m1", avatar: "A" }]
      };

      setProjects([...projects, mappedPrj]);
      setIsCreateModalOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectManagerId("");
      setNewProjectRoadmap("");
      setNewProjectNotes("");
    } catch (err) {
      alert(err.message || "Lỗi khi tạo dự án");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getPriorityBadgeClass(priority) {
    if (priority === "high") return "badge badge-red";
    if (priority === "medium") return "badge badge-amber";
    return "badge badge-green";
  }

  function getPriorityLabel(priority) {
    if (priority === "high") return "Cao";
    if (priority === "medium") return "TB";
    return "Thấp";
  }

  // Lọc danh sách users chỉ lấy Manager để Admin chọn làm quản lý dự án
  const managerUsers = users.filter(u => {
    const rn = u.role?.name || u.roleName || "";
    return rn === "Manager";
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Dự án</h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4, marginBottom: 0 }}>
            {isLoading
              ? "Đang tải..."
              : isManager
                ? `${projects.length} dự án được giao cho bạn quản lý`
                : `${projects.length} dự án trong workspace`}
          </p>
        </div>

        {/* Chỉ Admin mới thấy nút Tạo dự án */}
        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
            style={{ width: "auto", padding: "0 14px", gap: 6, display: "flex", alignItems: "center" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tạo dự án
          </button>
        )}
      </div>

      {/* Thông báo với Manager */}
      {isManager && !isLoading && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "var(--text-2)"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Hiển thị các dự án mà Admin đã chỉ định bạn làm quản lý.</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, color: "var(--text-2)" }}>
          <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Đang tải dự án...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="toast-error">
          ⚠️ Lỗi: {error}
        </div>
      )}

      {/* Empty state for Manager */}
      {!isLoading && !error && projects.length === 0 && isManager && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 64, gap: 12, color: "var(--text-2)"
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          <p style={{ fontSize: 14, textAlign: "center", margin: 0 }}>
            Chưa có dự án nào được giao cho bạn.<br />
            Vui lòng liên hệ Admin để được phân công quản lý dự án.
          </p>
        </div>
      )}

      {/* Project Cards */}
      {!isLoading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/dashboard/projects/${project.id}`}
              style={{
                background: "var(--surface)",
                border: "2px solid var(--border)",
                borderRadius: 12,
                padding: 18,
                textDecoration: "none",
                display: "block",
                transition: "border-color 0.15s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <span className={getPriorityBadgeClass(project.priority)}>
                  {getPriorityLabel(project.priority)}
                </span>
                {project.status === "completed" && (
                  <span className="badge badge-green">✓</span>
                )}
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4, marginTop: 8 }}>
                {project.name}
              </h3>
              <p className="line-clamp-2" style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 6 }}>
                {project.description}
              </p>
              {project.managerName && (
                <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>PM: {project.managerName}</span>
                </div>
              )}

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>{project.taskCompleted}/{project.taskCount} tasks</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{project.progress}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="flex items-center" style={{ gap: -6 }}>
                  {project.members.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--surface-2)",
                        border: "2px solid var(--surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "var(--text-2)",
                        marginLeft: -4
                      }}
                    >
                      {member.avatar}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-2)" }}>{project.deadline}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal — chỉ Admin mới dùng được */}
      {isAdmin && isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h2 className="modal-title">Tạo dự án mới</h2>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div>
                  <label className="field-label" htmlFor="proj-name">Tên dự án <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input id="proj-name" className="field-input" type="text" required autoFocus
                    value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                    placeholder="VD: Cổng thông tin ERP" />
                </div>

                <div>
                  <label className="field-label" htmlFor="proj-desc">Mô tả</label>
                  <textarea id="proj-desc" className="field-input" rows={3}
                    value={newProjectDescription} onChange={e => setNewProjectDescription(e.target.value)}
                    placeholder="Mô tả ngắn gọn mục tiêu dự án..."
                    style={{ height: "auto", padding: "10px 12px", resize: "none" }} />
                </div>

                {/* Chỉ chọn Manager làm trưởng dự án */}
                <div>
                  <label className="field-label" htmlFor="proj-manager">
                    Trưởng dự án (Manager) <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select id="proj-manager" className="field-input" required
                    value={newProjectManagerId} onChange={e => setNewProjectManagerId(e.target.value)}>
                    <option value="">-- Chọn Manager làm quản lý --</option>
                    {managerUsers.length === 0 && (
                      <option disabled value="">Không có Manager trong hệ thống</option>
                    )}
                    {managerUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.fullname} ({u.email})</option>
                    ))}
                  </select>
                  {managerUsers.length === 0 && (
                    <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>
                      ⚠ Chưa có tài khoản Manager nào. Vui lòng tạo tài khoản Manager trước.
                    </p>
                  )}
                </div>

                <div className="form-row-2">
                  <div>
                    <label className="field-label" htmlFor="proj-start">Ngày bắt đầu</label>
                    <input id="proj-start" className="field-input" type="date"
                      value={newProjectStartDate} onChange={e => setNewProjectStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="proj-end">Ngày kết thúc</label>
                    <input id="proj-end" className="field-input" type="date"
                      value={newProjectEndDate} onChange={e => setNewProjectEndDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 20px" }}
                  disabled={!newProjectName.trim() || !newProjectManagerId || isSubmitting}>
                  {isSubmitting ? "Đang xử lý..." : "Tạo dự án"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
