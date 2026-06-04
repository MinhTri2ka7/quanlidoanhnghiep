import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllProjects, createProject } from "../../utils/api.js";

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // States for creating a project
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectStartDate, setNewProjectStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [newProjectEndDate, setNewProjectEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllProjects();

        // Map DTO fields to local fields
        const mappedProjects = data.map((proj) => ({
          id: proj.id,
          name: proj.name,
          description: proj.description,
          priority: "medium", // Mặc định do mock data
          status: proj.status || "active",
          progress: proj.status === "completed" ? 100 : 45, // Giả lập progress
          taskCount: 15,
          taskCompleted: proj.status === "completed" ? 15 : 7,
          deadline: proj.endDate ? proj.endDate.substring(0, 10) : "Không thời hạn",
          members: [
            { id: "m1", avatar: "A" },
            { id: "m2", avatar: "B" }
          ]
        }));

        setProjects(mappedProjects);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, []);

  async function handleCreateProject(event) {
    event.preventDefault();
    if (!newProjectName.trim()) return;

    setIsSubmitting(true);
    try {
      const createdPrj = await createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        startDate: newProjectStartDate,
        endDate: newProjectEndDate
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
        members: [{ id: "m1", avatar: "A" }]
      };

      setProjects([...projects, mappedPrj]);
      setIsCreateModalOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Dự án</h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4, marginBottom: 0 }}>
            {isLoading ? "Đang tải..." : `${projects.length} dự án trong workspace`}
          </p>
        </div>
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
      </div>

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

      {/* Project Cards */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/dashboard/projects/${project.id}`}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
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
              <p className="line-clamp-2" style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 10 }}>
                {project.description}
              </p>

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

      {/* Create Project Modal */}
      {isCreateModalOpen && (
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
                  disabled={!newProjectName.trim() || isSubmitting}>
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

