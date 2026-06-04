import { useState, useEffect } from "react";
import { getAllTasks, getAllUsers, getAllProjects, createTask, updateTaskStatus } from "../../utils/api.js";

const statusConfig = {
  todo:       { label: "Todo",        colorStyle: { background: "var(--text-3)" } },
  inProgress: { label: "In Progress", colorStyle: { background: "var(--accent)" } },
  review:     { label: "Review",      colorStyle: { background: "#8B5CF6" } },
  done:       { label: "Done",        colorStyle: { background: "var(--success)" } },
};

function getPriorityDotStyle(priority) {
  if (priority === "high")   return { background: "var(--danger)" };
  if (priority === "medium") return { background: "var(--warning)" };
  return { background: "var(--success)" };
}

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // States for creating a task
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [newProjectId, setNewProjectId] = useState("");
  const [newAssignedToId, setNewAssignedToId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hover state for task cards
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  // Load dynamic data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [tasksData, usersData, projectsData] = await Promise.all([
          getAllTasks(),
          getAllUsers(),
          getAllProjects(),
        ]);

        const mappedTasks = tasksData.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status || "todo",
          priority: t.priority || "medium",
          deadline: t.deadline ? t.deadline.substring(0, 10) : "Không có",
          projectName: t.projectName,
          assignedToName: t.assignedToName,
          comments: Math.floor(Math.random() * 3),
          labels: [t.priority === "high" ? "Khẩn cấp" : "Nghiệp vụ"],
        }));

        setTasks(mappedTasks);
        setEmployees(usersData);
        setProjects(projectsData);

        if (projectsData.length > 0) setNewProjectId(projectsData[0].id.toString());
        if (usersData.length > 0) setNewAssignedToId(usersData[0].id.toString());
      } catch (err) {
        setError(err.message || "Lỗi khi tải thông tin Tasks");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleCreateTask(event) {
    event.preventDefault();
    if (!newTitle.trim() || !newProjectId || !newAssignedToId) return;

    setIsSubmitting(true);
    try {
      const createdTaskDto = await createTask({
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        deadline: newDeadline ? newDeadline + "T18:00:00" : null,
        projectId: parseInt(newProjectId),
        assignedToId: parseInt(newAssignedToId),
      });

      const mappedTask = {
        id: createdTaskDto.id,
        title: createdTaskDto.title,
        description: createdTaskDto.description,
        status: createdTaskDto.status || "todo",
        priority: createdTaskDto.priority || "medium",
        deadline: createdTaskDto.deadline
          ? createdTaskDto.deadline.substring(0, 10)
          : "Không có",
        projectName: createdTaskDto.projectName,
        assignedToName: createdTaskDto.assignedToName,
        comments: 0,
        labels: [createdTaskDto.priority === "high" ? "Khẩn cấp" : "Nghiệp vụ"],
      };

      setTasks([...tasks, mappedTask]);
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
    } catch (err) {
      alert(err.message || "Lỗi khi tạo task");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function moveTask(taskId, targetStatus) {
    try {
      await updateTaskStatus(taskId, targetStatus);
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)));
    } catch (err) {
      alert(err.message || "Không thể chuyển trạng thái task");
    }
  }

  const tasksByStatus = {
    todo:       tasks.filter((t) => t.status === "todo"),
    inProgress: tasks.filter((t) => t.status === "inProgress"),
    review:     tasks.filter((t) => t.status === "review"),
    done:       tasks.filter((t) => t.status === "done"),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>
            Kanban Board
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
            Quản lý và điều phối tasks trong hệ thống
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
          Tạo Task
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <p style={{ color: "var(--text-2)", fontSize: 14 }}>Đang tải danh sách Tasks...</p>
      )}

      {/* Error state */}
      {error && (
        <div className="toast-error">
          ⚠️ Lỗi: {error}
        </div>
      )}

      {/* Kanban Board */}
      {!isLoading && !error && (
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }}>
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
            const config = statusConfig[status];
            return (
              <div key={status} style={{ flexShrink: 0, width: 280 }}>
                {/* Column Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      display: "inline-block",
                      ...config.colorStyle,
                    }}
                  />
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                    {config.label}
                  </h3>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "var(--text-2)",
                      background: "var(--surface-2)",
                      padding: "1px 7px",
                      borderRadius: 99,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {statusTasks.length}
                  </span>
                </div>

                {/* Tasks container */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    minHeight: 200,
                    background: "var(--surface-2)",
                    padding: 8,
                    borderRadius: 10,
                    border: "1px dashed var(--border)",
                  }}
                >
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        background: "var(--surface)",
                        border: hoveredTaskId === task.id
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                        borderRadius: 8,
                        padding: 12,
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={() => setHoveredTaskId(task.id)}
                      onMouseLeave={() => setHoveredTaskId(null)}
                    >
                      {/* Task project info + status select */}
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
                          {task.projectName || "Dự án chung"}
                        </span>
                        <select
                          value={task.status}
                          onChange={(e) => moveTask(task.id, e.target.value)}
                          style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            borderRadius: 4,
                            padding: "1px 4px",
                            fontSize: 11,
                            color: "var(--text)",
                            outline: "none",
                          }}
                        >
                          <option value="todo">Todo</option>
                          <option value="inProgress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>

                      {/* Labels */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.labels.map((label) => (
                          <span
                            key={label}
                            style={{
                              display: "inline-flex",
                              fontSize: 10,
                              background: "var(--accent-bg)",
                              color: "var(--accent)",
                              borderRadius: 4,
                              padding: "1px 6px",
                              fontWeight: 500,
                            }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                        {task.title}
                      </h4>

                      {/* Description */}
                      {task.description && (
                        <p
                          className="line-clamp-2"
                          style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 10 }}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          paddingTop: 8,
                          marginTop: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {/* Assignee */}
                        <div className="flex items-center gap-1">
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "var(--accent-bg)",
                              color: "var(--accent)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 700,
                            }}
                          >
                            {task.assignedToName ? task.assignedToName.charAt(0).toUpperCase() : "?"}
                          </div>
                          <span
                            className="truncate max-w-[80px]"
                            style={{ fontSize: 10, color: "var(--text-2)" }}
                          >
                            {task.assignedToName
                              ? task.assignedToName.split(" ").pop()
                              : "Chưa giao"}
                          </span>
                        </div>

                        {/* Priority dot + deadline */}
                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              display: "inline-block",
                              ...getPriorityDotStyle(task.priority),
                            }}
                            title={`Priority: ${task.priority}`}
                          />
                          <span style={{ fontSize: 10, color: "var(--text-2)" }}>
                            {task.deadline}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add task button */}
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
                      width: "100%",
                      padding: "7px",
                      borderRadius: 8,
                      border: "1px dashed var(--border)",
                      fontSize: 12,
                      color: "var(--text-2)",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    + Thêm task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h2 className="modal-title">Tạo task mới</h2>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div>
                  <label className="field-label" htmlFor="task-title">Tiêu đề <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input id="task-title" className="field-input" type="text" required autoFocus
                    value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="VD: Nghiên cứu thiết kế database" />
                </div>

                <div>
                  <label className="field-label" htmlFor="task-desc">Mô tả</label>
                  <textarea id="task-desc" className="field-input" rows={2}
                    value={newDescription} onChange={e => setNewDescription(e.target.value)}
                    placeholder="Mô tả chi tiết nội dung cần làm..."
                    style={{ height: "auto", padding: "10px 12px", resize: "none" }} />
                </div>

                <div className="form-row-2">
                  <div>
                    <label className="field-label" htmlFor="task-project">Dự án <span style={{ color: "var(--danger)" }}>*</span></label>
                    <select id="task-project" className="field-input"
                      value={newProjectId} onChange={e => setNewProjectId(e.target.value)}>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="task-assignee">Người thực hiện <span style={{ color: "var(--danger)" }}>*</span></label>
                    <select id="task-assignee" className="field-input"
                      value={newAssignedToId} onChange={e => setNewAssignedToId(e.target.value)}>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullname}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div>
                    <label className="field-label" htmlFor="task-priority">Độ ưu tiên</label>
                    <select id="task-priority" className="field-input"
                      value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="task-deadline">Hạn chót</label>
                    <input id="task-deadline" className="field-input" type="date"
                      value={newDeadline} onChange={e => setNewDeadline(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 20px" }}
                  disabled={!newTitle.trim() || isSubmitting}>
                  {isSubmitting ? "Đang xử lý..." : "Tạo task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage;

