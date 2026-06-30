import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  getProjectById, 
  getTasksByProject, 
  getAllUsers, 
  updateProject, 
  createTask, 
  updateTaskStatus,
  uploadProjectDocument,
  getProjectDocuments,
  deleteProjectDocument,
  getStorageSize,
  getProjectMembers,
  addProjectMember,
  removeProjectMember
} from "../../utils/api.js";
import Breadcrumb from "../../components/dashboard/Breadcrumb.jsx";
import { useCurrentUser } from "../../utils/useCurrentUser.js";

function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [users, setUsers] = useState([]);

  // Check user role permissions
  const { user, isAdmin, isManager } = useCurrentUser();
  const canMoveTask = isAdmin || isManager;
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Roadmap Steps state
  const [roadmapSteps, setRoadmapSteps] = useState([]);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDate, setNewStepDate] = useState("");

  // Independent inline editors
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState("");

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoName, setInfoName] = useState("");
  const [infoDesc, setInfoDesc] = useState("");
  const [infoStart, setInfoStart] = useState("");
  const [infoEnd, setInfoEnd] = useState("");

  // Quick Task Board addition state
  const [activeAddFormColumn, setActiveAddFormColumn] = useState(null); // 'todo', 'inProgress', etc.
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskAssigneeId, setQuickTaskAssigneeId] = useState("");
  const [quickTaskPriority, setQuickTaskPriority] = useState("medium");
  const [quickTaskDeadline, setQuickTaskDeadline] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState("");
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);
  const [projectMembers, setProjectMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [projData, tasksData, usersData, docsData, storageSize, membersData] = await Promise.all([
          getProjectById(projectId),
          getTasksByProject(projectId).catch(() => []),
          getAllUsers().catch(() => []),
          getProjectDocuments(projectId).catch(() => []),
          getStorageSize().catch(() => 0),
          getProjectMembers(projectId).catch(() => [])
        ]);
        setProject(projData);
        setProjectTasks(tasksData || []);
        setUsers(usersData || []);
        setDocuments(docsData || []);
        setTotalStorageBytes(storageSize || 0);
        setProjectMembers(membersData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  // Sync roadmap steps state when project loads
  useEffect(() => {
    if (project && project.roadmap) {
      try {
        setRoadmapSteps(JSON.parse(project.roadmap));
      } catch (e) {
        // Fallback for legacy plain text roadmap
        setRoadmapSteps([
          { id: "step-legacy", title: project.roadmap, targetDate: "", status: "todo" }
        ]);
      }
    } else {
      setRoadmapSteps([]);
    }
  }, [project]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span style={{ marginLeft: 12, color: "var(--text-2)", fontSize: 14 }}>Đang tải chi tiết dự án...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 256, gap: 16 }}>
        <p style={{ color: "var(--danger)", fontWeight: 500 }}>⚠️ {error || "Dự án không tồn tại"}</p>
        <Link to="/dashboard/projects" style={{ color: "var(--accent)", textDecoration: "underline" }}>Quay lại danh sách dự án</Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Workspace", path: "/dashboard" },
    { label: "Dự án", path: "/dashboard/projects" },
    { label: project.name, path: `/dashboard/projects/${projectId}` }
  ];

  const tasksByStatus = {
    todo: projectTasks.filter((t) => t.status === "todo"),
    inProgress: projectTasks.filter((t) => t.status === "inProgress" || t.status === "inprogress" || t.status === "in_progress"),
    review: projectTasks.filter((t) => t.status === "review"),
    done: projectTasks.filter((t) => t.status === "done" || t.status === "completed")
  };

  const totalTasks = projectTasks.length;
  const completedTasks = tasksByStatus.done.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;


  function getPriorityStyle(priority) {
    if (priority === "high") return "badge badge-red";
    if (priority === "medium") return "badge badge-amber";
    return "badge badge-green";
  }

  // General update API helper
  const updateProjectFields = async (updatedFields) => {
    try {
      const payload = {
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        managerId: project.managerId,
        roadmap: project.roadmap,
        notes: project.notes,
        ...updatedFields
      };
      const updated = await updateProject(projectId, payload);
      setProject(updated);
      return updated;
    } catch (err) {
      alert("Lỗi khi cập nhật dự án: " + err.message);
      throw err;
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    setIsSubmittingMember(true);
    try {
      await addProjectMember(projectId, parseInt(selectedMemberId, 10));
      const refreshed = await getProjectMembers(projectId);
      setProjectMembers(refreshed || []);
      setSelectedMemberId("");
      setShowAddMember(false);
    } catch (err) {
      alert("Lỗi khi thêm thành viên: " + err.message);
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?")) return;
    try {
      await removeProjectMember(projectId, userId);
      const refreshed = await getProjectMembers(projectId);
      setProjectMembers(refreshed || []);
    } catch (err) {
      alert("Lỗi khi xóa thành viên: " + err.message);
    }
  };

  // Roadmap actions
  const handleSaveRoadmap = (updatedSteps) => {
    updateProjectFields({ roadmap: JSON.stringify(updatedSteps) });
  };

  const handleAddStep = (e) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;

    const newStep = {
      id: "step-" + Date.now(),
      title: newStepTitle.trim(),
      targetDate: newStepDate,
      status: "todo"
    };

    const updated = [...roadmapSteps, newStep];
    setRoadmapSteps(updated);
    handleSaveRoadmap(updated);
    setNewStepTitle("");
    setNewStepDate("");
  };

  const handleToggleStepStatus = (stepId) => {
    const updated = roadmapSteps.map(step => {
      if (step.id === stepId) {
        let nextStatus = "todo";
        if (step.status === "todo") nextStatus = "inProgress";
        else if (step.status === "inProgress") nextStatus = "done";
        return { ...step, status: nextStatus };
      }
      return step;
    });
    setRoadmapSteps(updated);
    handleSaveRoadmap(updated);
  };

  const handleDeleteStep = (stepId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chặng này?")) return;
    const updated = roadmapSteps.filter(step => step.id !== stepId);
    setRoadmapSteps(updated);
    handleSaveRoadmap(updated);
  };

  // Manager Editor Actions
  const startEditingManager = () => {
    setSelectedManagerId(project.managerId || "");
    setIsEditingManager(true);
  };

  const saveManagerChange = async () => {
    await updateProjectFields({
      managerId: selectedManagerId ? parseInt(selectedManagerId, 10) : null
    });
    setIsEditingManager(false);
  };

  // Notes Editor Actions
  const startEditingNotes = () => {
    setTempNotes(project.notes || "");
    setIsEditingNotes(true);
  };

  const saveNotesChange = async () => {
    await updateProjectFields({
      notes: tempNotes.trim()
    });
    setIsEditingNotes(false);
  };

  // Info Editor Actions
  const startEditingInfo = () => {
    setInfoName(project.name || "");
    setInfoDesc(project.description || "");
    setInfoStart(project.startDate ? project.startDate.substring(0, 10) : "");
    setInfoEnd(project.endDate ? project.endDate.substring(0, 10) : "");
    setIsEditingInfo(true);
  };

  const saveInfoChange = async (e) => {
    e.preventDefault();
    await updateProjectFields({
      name: infoName.trim(),
      description: infoDesc.trim(),
      startDate: infoStart,
      endDate: infoEnd
    });
    setIsEditingInfo(false);
  };

  // Quick Task Board addition actions
  const handleOpenQuickAdd = (status) => {
    setActiveAddFormColumn(status);
    setQuickTaskTitle("");
    setQuickTaskAssigneeId("");
    setQuickTaskPriority("medium");
    setQuickTaskDeadline("");
  };

  const handleQuickAddTask = async (e, columnStatus) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) {
      alert("Vui lòng điền tiêu đề công việc!");
      return;
    }
    if (!quickTaskAssigneeId) {
      alert("Vui lòng chọn nhân viên được giao!");
      return;
    }

    setIsAddingTask(true);
    try {
      const userStr = localStorage.getItem("user");
      let loggedInUserId = 1;
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          if (parsed && parsed.id) loggedInUserId = parsed.id;
        } catch (err) {}
      }

      // 1. Create task (defaults to todo status)
      const createdTask = await createTask({
        title: quickTaskTitle.trim(),
        description: "",
        priority: quickTaskPriority,
        deadline: quickTaskDeadline ? quickTaskDeadline + "T23:59:59" : null,
        projectId: parseInt(projectId, 10),
        assignedToId: parseInt(quickTaskAssigneeId, 10)
      }, loggedInUserId);

      // 2. If the column status is not "todo", update status immediately
      if (columnStatus !== "todo") {
        await updateTaskStatus(createdTask.id, columnStatus);
      }

      // 3. Reload tasks list to refresh the board
      const refreshedTasks = await getTasksByProject(projectId);
      setProjectTasks(refreshedTasks || []);

      // 4. Reset state
      setActiveAddFormColumn(null);
    } catch (err) {
      alert("Lỗi khi thêm công việc: " + err.message);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr, 10);
    try {
      await updateTaskStatus(taskId, targetStatus);
      const refreshedTasks = await getTasksByProject(projectId);
      setProjectTasks(refreshedTasks || []);
    } catch (err) {
      alert("Lỗi khi chuyển trạng thái task: " + err.message);
    }
  };

  const handleUploadDocument = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    setDocError("");
    try {
      const newDoc = await uploadProjectDocument(projectId, file);
      setDocuments(prev => [...prev, newDoc]);
      // Refresh storage size
      const newSize = await getStorageSize();
      setTotalStorageBytes(newSize);
    } catch (err) {
      setDocError(err.message || "Tải tài liệu lên thất bại");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này khỏi dự án?")) return;
    
    try {
      await deleteProjectDocument(docId);
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      // Refresh storage size
      const newSize = await getStorageSize();
      setTotalStorageBytes(newSize);
    } catch (err) {
      alert("Lỗi khi xóa tài liệu: " + err.message);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-in">
      <Breadcrumb items={breadcrumbItems} />

      {/* Project Header Info - Solid Borders */}
      <div style={{
        background: "var(--surface)",
        border: "2px solid var(--border)",
        borderRadius: 12,
        padding: 24
      }}>
        {isEditingInfo ? (
          <form onSubmit={saveInfoChange} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>Chỉnh sửa thông tin chung</h3>
            
            <div>
              <label className="field-label">Tên dự án</label>
              <input className="field-input" type="text" required value={infoName} onChange={e => setInfoName(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Mô tả</label>
              <textarea className="field-input" rows={2} style={{ height: "auto", padding: "10px 12px" }} value={infoDesc} onChange={e => setInfoDesc(e.target.value)} />
            </div>

            <div className="form-row-2">
              <div>
                <label className="field-label">Ngày bắt đầu</label>
                <input className="field-input" type="date" value={infoStart} onChange={e => setInfoStart(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Ngày kết thúc</label>
                <input className="field-input" type="date" value={infoEnd} onChange={e => setInfoEnd(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button type="button" className="btn-secondary" onClick={() => setIsEditingInfo(false)}>Hủy</button>
              <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 18px" }}>Lưu</button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>{project.name}</h1>
                <span className={getPriorityStyle(project.priority || "medium")}>
                  {project.priority === "high" ? "Ưu tiên cao" : project.priority === "low" ? "Thấp" : "Trung bình"}
                </span>
                {project.status === "completed" && (
                  <span className="badge badge-green">Hoàn thành</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>{project.description || "Không có mô tả dự án."}</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-darkTextGray" style={{ color: "var(--text-2)" }}>
                <span>Bắt đầu: <b>{project.startDate || "N/A"}</b></span>
                <span>•</span>
                <span>Hạn chót: <b>{project.endDate || "Không thời hạn"}</b></span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button 
                onClick={() => navigate("/dashboard/chat", { state: { projectId: project.id } })}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 6, width: "auto", padding: "0 14px", height: 36 }}
              >
                💬 Chat dự án
              </button>
              <button 
                onClick={startEditingInfo}
                className="btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: 6, height: 36 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Sửa thông tin
              </button>
            </div>
          </div>
        )}

        {/* Progress bar - solid */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "2px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>Tiến độ công việc</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{progressPercent}%</span>
          </div>
          <div className="progress-track" style={{ height: 6 }}>
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%`, background: progressPercent === 100 ? "var(--success)" : "var(--accent)" }}
            />
          </div>
          <div className="flex items-center justify-between mt-2" style={{ fontSize: 11, color: "var(--text-2)" }}>
            <span>{completedTasks} / {totalTasks} task hoàn thành</span>
            <span>Hạn chót: {project.endDate || "Không giới hạn"}</span>
          </div>
        </div>
      </div>

      {/* Grid: Project Manager Selector & Attention Notes - Separated Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Project Manager Selector Panel */}
        <div style={{
          background: "var(--surface)",
          border: "2px solid var(--border)",
          borderRadius: 12,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Trưởng dự án (PM)
            </h3>
            {!isEditingManager && (
              <button onClick={startEditingManager} className="btn-ghost" style={{ width: 24, height: 24 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            )}
          </div>

          {isEditingManager ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <select 
                className="field-input" 
                value={selectedManagerId} 
                onChange={e => setSelectedManagerId(e.target.value)}
              >
                <option value="">-- Chưa chỉ định --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.fullname} ({u.email})</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11 }} onClick={() => setIsEditingManager(false)}>Hủy</button>
                <button className="btn-primary" style={{ width: "auto", height: 28, padding: "0 12px", fontSize: 11 }} onClick={saveManagerChange}>Lưu</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "var(--accent-bg)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 14
              }}>
                {project.managerName ? project.managerName.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                  {project.managerName || "Chưa phân công PM"}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-2)", margin: 0 }}>
                  {project.managerName ? "Trưởng dự án chịu trách nhiệm chính" : "Nhấp vào nút sửa để giao dự án"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Attention Notes Panel - Separated Yellow Card */}
        <div className="lg:col-span-2" style={{
          background: "var(--surface)",
          border: "2px solid var(--warning)", // Solid bright yellow border
          borderRadius: 12,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "color-mix(in srgb, var(--warning) 30%, transparent)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--warning)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Lưu ý đặc biệt (Attention Notes)
            </h3>
            {!isEditingNotes && (
              <button onClick={startEditingNotes} className="btn-ghost" style={{ width: 24, height: 24, color: "var(--warning)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea 
                className="field-input" 
                rows={3} 
                style={{ height: "auto", padding: "10px 12px", border: "1px solid var(--warning)" }}
                placeholder="Nhập những ghi chú quan trọng hoặc cảnh báo tại đây..."
                value={tempNotes}
                onChange={e => setTempNotes(e.target.value)}
              />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button className="btn-secondary" style={{ height: 28, padding: "0 10px", fontSize: 11 }} onClick={() => setIsEditingNotes(false)}>Hủy</button>
                <button className="btn-primary" style={{ width: "auto", height: 28, padding: "0 12px", fontSize: 11, background: "var(--warning)" }} onClick={saveNotesChange}>Lưu chú ý</button>
              </div>
            </div>
          ) : (
            <div style={{
              padding: 10,
              background: "color-mix(in srgb, var(--warning) 6%, var(--surface))",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text)",
              minHeight: 48,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap"
            }}>
              {project.notes || "Không có chú ý đặc biệt nào được ghi lại."}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Roadmap Timeline steps & Team Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Roadmap (Task-like step list timeline) */}
        <div className="lg:col-span-2" style={{
          background: "var(--surface)",
          border: "2px solid var(--border)",
          borderRadius: 12,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 14
        }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Lộ trình thực hiện (Roadmap Milestones)
            </h3>
            <span className="badge badge-blue">{roadmapSteps.length} Chặng</span>
          </div>

          {/* Form to Add Step inline */}
          <form onSubmit={handleAddStep} style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 8,
            alignItems: "end",
            background: "var(--surface-2)",
            padding: 10,
            borderRadius: 8,
            border: "1px dashed var(--border)"
          }}>
            <div>
              <label className="field-label" style={{ fontSize: 11, marginBottom: 3 }}>Tên chặng / Cột mốc</label>
              <input 
                type="text" 
                className="field-input" 
                style={{ height: 32, fontSize: 12 }} 
                placeholder="VD: Bàn giao UI Mockup"
                value={newStepTitle}
                onChange={e => setNewStepTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" style={{ fontSize: 11, marginBottom: 3 }}>Ngày dự kiến</label>
              <input 
                type="date" 
                className="field-input" 
                style={{ height: 32, fontSize: 12, width: 130 }} 
                value={newStepDate}
                onChange={e => setNewStepDate(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: "auto", height: 32, padding: "0 14px", fontSize: 12 }}
              disabled={!newStepTitle.trim()}
            >
              + Thêm chặng
            </button>
          </form>

          {/* Steps Timeline List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {roadmapSteps.map((step, idx) => {
              const getStatusBadge = (status) => {
                if (status === "done") return { text: "Hoàn thành", color: "badge-green" };
                if (status === "inProgress") return { text: "Đang chạy", color: "badge-blue" };
                return { text: "Cần làm", color: "badge-gray" };
              };
              const statusCfg = getStatusBadge(step.status);

              return (
                <div key={step.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: step.status === "done" ? "color-mix(in srgb, var(--success) 4%, var(--surface))" : "var(--surface)",
                  border: `2px solid ${step.status === "done" ? "var(--success)" : "var(--border)"}`,
                  borderRadius: 10,
                  transition: "border-color 0.15s"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    {/* Status Toggle Box */}
                    <button 
                      onClick={() => handleToggleStepStatus(step.id)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: `2px solid ${step.status === "done" ? "var(--success)" : "var(--text-3)"}`,
                        background: step.status === "done" ? "var(--success)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff"
                      }}
                      title="Nhấn để đổi trạng thái chặng"
                    >
                      {step.status === "done" && "✓"}
                      {step.status === "inProgress" && "•"}
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 13,
                        fontWeight: 600,
                        margin: 0,
                        color: "var(--text)",
                        textDecoration: step.status === "done" ? "line-through" : "none",
                        opacity: step.status === "done" ? 0.6 : 1
                      }}>
                        {step.title}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-2)", margin: "2px 0 0" }}>
                        🗓️ Hạn dự kiến: {step.targetDate || "Chưa set hạn"}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button 
                      onClick={() => handleToggleStepStatus(step.id)} 
                      className={`badge ${statusCfg.color}`}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      {statusCfg.text}
                    </button>
                    <button 
                      onClick={() => handleDeleteStep(step.id)} 
                      className="btn-ghost" 
                      style={{ width: 24, height: 24, color: "var(--danger)" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {roadmapSteps.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "24px 0",
                color: "var(--text-2)",
                fontSize: 12,
                border: "2px dashed var(--border)",
                borderRadius: 8
              }}>
                Chưa có chặng lộ trình nào. Hãy thêm chặng mới ở ô phía trên!
              </div>
            )}
          </div>
        </div>

        {/* Team Members List - Solid border */}
        <div style={{
          background: "var(--surface)",
          border: "2px solid var(--border)",
          borderRadius: 12,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderColor: "var(--border)" }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Thành viên ({projectMembers.length})</h4>
            {(isAdmin || (isManager && project && project.managerId === user?.id)) && (
              <button 
                onClick={() => setShowAddMember(!showAddMember)}
                className="btn-ghost"
                style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6 }}
              >
                {showAddMember ? "Hủy" : "+ Thêm"}
              </button>
            )}
          </div>

          {showAddMember && (
            <form onSubmit={handleAddMember} style={{ display: "flex", gap: 6, margin: "8px 0" }}>
              <select
                className="field-input"
                style={{ flex: 1, height: 32, fontSize: 12, padding: "0 8px" }}
                required
                value={selectedMemberId}
                onChange={e => setSelectedMemberId(e.target.value)}
              >
                <option value="">-- Chọn nhân viên --</option>
                {users.filter(u => 
                  u.roleName !== "Admin" &&
                  project?.managerId !== u.id &&
                  !projectMembers.some(m => m.id === u.id)
                ).map(u => (
                  <option key={u.id} value={u.id}>{u.fullname} ({u.roleName})</option>
                ))}
              </select>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ height: 32, padding: "0 12px", fontSize: 12, width: "auto" }}
                disabled={isSubmittingMember || !selectedMemberId}
              >
                {isSubmittingMember ? "..." : "Lưu"}
              </button>
            </form>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {projectMembers.map((member) => (
              <div
                key={member.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 8,
                  borderRadius: 8,
                  border: "2px solid var(--border)",
                  background: "var(--surface)"
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-2)"
                }}>
                  {member.fullname.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {member.fullname}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--text-2)", margin: 0 }}>
                    {project?.managerId === member.id ? "Trưởng dự án (PM)" : "Thành viên"}
                  </p>
                </div>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  marginRight: 6,
                  background: member.isActive ? "var(--success)" : "var(--text-3)"
                }} />
                {(isAdmin || (isManager && project && project.managerId === user?.id)) && project?.managerId !== member.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--danger)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center"
                    }}
                    title="Xóa khỏi dự án"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {projectMembers.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--text-2)", fontStyle: "italic", margin: 0 }}>Chưa có thành viên nào tham gia.</p>
            )}
          </div>
        </div>
      </div>

      {/* Project Documents Section - Styled matching the design system */}
      <div style={{
        background: "var(--surface)",
        border: "2px solid var(--border)",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid var(--border)", paddingBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Tài liệu dự án (Project Documents)
            </h3>
            <p style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2, margin: 0 }}>
              Tải lên tài liệu dự án lên AWS S3 (Tổng dung lượng hệ thống đã dùng: <b>{formatBytes(totalStorageBytes)}</b>).
            </p>
          </div>

          <label className="btn-primary" style={{ 
            width: "auto", 
            padding: "0 16px", 
            height: 32, 
            fontSize: 12, 
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            cursor: "pointer",
            margin: 0
          }}>
            {uploadingDoc ? "Đang tải lên..." : "+ Tải lên tài liệu"}
            <input 
              type="file" 
              onChange={handleUploadDocument} 
              style={{ display: "none" }} 
              disabled={uploadingDoc}
            />
          </label>
        </div>

        {docError && (
          <div style={{ color: "var(--danger)", fontSize: 12, padding: "8px 12px", background: "color-mix(in srgb, var(--danger) 8%, var(--surface))", borderRadius: 8 }}>
            ⚠️ {docError}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {documents.map((doc) => {
            const isImage = doc.fileType && doc.fileType.startsWith("image/");
            const isPdf = doc.fileType && doc.fileType.includes("pdf");

            return (
              <div key={doc.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--surface)",
                border: "2px solid var(--border)",
                borderRadius: 10,
                transition: "border-color 0.15s"
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: isImage ? "color-mix(in srgb, var(--success) 10%, var(--surface))" : isPdf ? "color-mix(in srgb, var(--danger) 10%, var(--surface))" : "var(--surface-2)",
                    color: isImage ? "var(--success)" : isPdf ? "var(--danger)" : "var(--text-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {isImage ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <a 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: "var(--text)", 
                        textDecoration: "none",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {doc.name}
                    </a>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginTop: 4, fontSize: 11, color: "var(--text-2)" }}>
                      <span>Dung lượng: <b>{formatBytes(doc.fileSize)}</b></span>
                      <span>•</span>
                      <span>Tải lên bởi: <b>{doc.uploadedByName || "N/A"}</b></span>
                      <span>•</span>
                      <span>Thời gian: <b>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString("vi-VN") : "N/A"}</b></span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <a 
                    href={doc.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-ghost" 
                    style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                    title="Mở / Tải xuống tài liệu"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </a>
                  <button 
                    onClick={() => handleDeleteDocument(doc.id)} 
                    className="btn-ghost" 
                    style={{ width: 30, height: 30, color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none" }}
                    title="Xóa tài liệu"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {documents.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "30px 0",
              color: "var(--text-2)",
              fontSize: 12,
              border: "2px dashed var(--border)",
              borderRadius: 8
            }}>
              Chưa có tài liệu nào được tải lên cho dự án này.
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board - Task Board */}
      <div style={{
        background: "var(--surface)",
        border: "2px solid var(--border)",
        borderRadius: 12,
        padding: 18
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 16px" }}>Bảng phân phối công việc (Tasks Board)</h3>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10 }}>
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
            const statusConfig = {
              todo: { label: "Todo", color: "var(--text-2)", badge: "badge-gray" },
              inProgress: { label: "In Progress", color: "var(--accent)", badge: "badge-blue" },
              review: { label: "Review", color: "#8B5CF6", badge: "badge-amber" },
              done: { label: "Done", color: "var(--success)", badge: "badge-green" }
            };
            const config = statusConfig[status];

            return (
              <div key={status} style={{ flexShrink: 0, width: 250, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="flex items-center gap-2 px-1 justify-between">
                  <span style={{ fontSize: 12, fontWeight: 600, color: config.color }}>{config.label}</span>
                  <span className={`badge ${config.badge}`}>{statusTasks.length}</span>
                </div>

                {/* Inline task addition for each status column */}
                {canMoveTask && (
                  activeAddFormColumn === status ? (
                    <form 
                      onSubmit={(e) => handleQuickAddTask(e, status)} 
                      style={{
                        background: "var(--surface-2)",
                        border: "2px solid var(--border)",
                        borderRadius: 10,
                        padding: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8
                      }}
                    >
                      <input
                        type="text"
                        className="field-input"
                        style={{ height: 30, fontSize: 12, padding: "0 8px" }}
                        placeholder="Tiêu đề công việc..."
                        required
                        value={quickTaskTitle}
                        onChange={e => setQuickTaskTitle(e.target.value)}
                      />
                      <select
                        className="field-input"
                        style={{ height: 30, fontSize: 12, padding: "0 8px" }}
                        required
                        value={quickTaskAssigneeId}
                        onChange={e => setQuickTaskAssigneeId(e.target.value)}
                      >
                        <option value="">-- Giao cho --</option>
                        {(projectMembers.length > 0 ? projectMembers : users).map(u => (
                          <option key={u.id} value={u.id}>{u.fullname}</option>
                        ))}
                      </select>
                      <div style={{ display: "flex", gap: 4 }}>
                        <select
                          className="field-input"
                          style={{ height: 30, fontSize: 12, padding: "0 4px", flex: 1 }}
                          value={quickTaskPriority}
                          onChange={e => setQuickTaskPriority(e.target.value)}
                        >
                          <option value="low">Thấp</option>
                          <option value="medium">Vừa</option>
                          <option value="high">Cao</option>
                        </select>
                        <input
                          type="date"
                          className="field-input"
                          style={{ height: 30, fontSize: 11, padding: "0 4px", flex: 1 }}
                          value={quickTaskDeadline}
                          onChange={e => setQuickTaskDeadline(e.target.value)}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
                        <button type="button" className="btn-secondary" style={{ height: 24, padding: "0 8px", fontSize: 11 }} onClick={() => setActiveAddFormColumn(null)}>Hủy</button>
                        <button type="submit" className="btn-primary" style={{ width: "auto", height: 24, padding: "0 10px", fontSize: 11 }} disabled={isAddingTask}>
                          {isAddingTask ? "..." : "Thêm"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => handleOpenQuickAdd(status)}
                      style={{
                        background: "transparent",
                        border: "2px dashed var(--border)",
                        borderRadius: 10,
                        padding: "8px 0",
                        fontSize: 12,
                        color: "var(--text-2)",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "center"
                      }}
                    >
                      + Thêm công việc
                    </button>
                  )
                )}

                 <div 
                  onDragOver={(e) => { if (canMoveTask) e.preventDefault(); }}
                  onDragEnter={() => { if (canMoveTask) setDragOverColumn(status); }}
                  onDragLeave={() => { if (canMoveTask) setDragOverColumn(null); }}
                  onDrop={(e) => { if (canMoveTask) handleDrop(e, status); }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    minHeight: 120,
                    background: dragOverColumn === status ? "color-mix(in srgb, var(--accent) 8%, var(--surface-2))" : "transparent",
                    border: dragOverColumn === status ? "2px dashed var(--accent)" : "2px dashed transparent",
                    borderRadius: 10,
                    padding: 6,
                    transition: "all 0.2s ease"
                  }}
                >
                  {statusTasks.map((task) => {
                    return (
                      <div 
                        key={task.id} 
                        draggable={canMoveTask}
                        onDragStart={(e) => { if (canMoveTask) handleDragStart(e, task.id); }}
                        style={{
                          background: "var(--surface)",
                          border: "2px solid var(--border)",
                          borderRadius: 10,
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          cursor: canMoveTask ? "grab" : "default",
                          transition: "border-color 0.15s, transform 0.15s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <p style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 500, margin: 0 }}>{task.title}</p>
                          {canMoveTask && (
                            <select
                              value={task.status}
                              onChange={async (e) => {
                                try {
                                  await updateTaskStatus(task.id, e.target.value);
                                  const refreshedTasks = await getTasksByProject(projectId);
                                  setProjectTasks(refreshedTasks || []);
                                } catch (err) {
                                  alert("Lỗi khi chuyển trạng thái task: " + err.message);
                                }
                              }}
                              style={{
                                background: "var(--surface-2)",
                                border: "1px solid var(--border)",
                                borderRadius: 4,
                                padding: "1px 4px",
                                fontSize: 10,
                                color: "var(--text)",
                                outline: "none",
                                cursor: "pointer"
                              }}
                            >
                              <option value="todo">Todo</option>
                              <option value="inProgress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="done">Done</option>
                            </select>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "var(--text-2)" }}>
                          {task.assignedToName ? (
                            <span style={{ fontWeight: 600, color: "var(--text)" }}>👤 {task.assignedToName.split(" ").pop()}</span>
                          ) : (
                            <span style={{ fontStyle: "italic" }}>Chưa giao</span>
                          )}
                          <span>{task.deadline ? task.deadline.substring(0, 10) : "N/A"}</span>
                        </div>
                      </div>
                    );
                  })}
                  {statusTasks.length === 0 && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 80,
                      border: "2px dashed var(--border)",
                      borderRadius: 10,
                      color: "var(--text-3)",
                      fontSize: 11,
                      fontStyle: "italic"
                    }}>
                      Trống
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
