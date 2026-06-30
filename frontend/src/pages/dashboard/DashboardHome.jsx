import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../utils/useCurrentUser.js";
import {
  getAllUsers,
  getAllDepartments,
  getAllProjects,
  getAllTasks,
  getTasksByUser,
  getUserById,
} from "../../utils/api.js";

// ───────── SVG Icons ─────────
const ICONS = {
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  department: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  ),
  project: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  task: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  empty: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v4m0 4h.01"/>
    </svg>
  ),
};

function EmptyCard({ title, description }) {
  return (
    <div className="card" style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center" }}>
      {ICONS.empty}
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>{title}</span>
      <span style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 280 }}>{description}</span>
    </div>
  );
}

function DashboardHome() {
  const { user, isAdmin, isManager, isEmployee } = useCurrentUser();
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, departments: 0, projects: 0, tasksTotal: 0, tasksDone: 0 });
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    setLoading(true);
    try {
      if (isAdmin) {
        const [usersData, depsData, projsData, tasksData] = await Promise.all([
          getAllUsers().catch(() => []),
          getAllDepartments().catch(() => []),
          getAllProjects().catch(() => []),
          getAllTasks().catch(() => []),
        ]);
        setStats({
          users: usersData.length,
          departments: depsData.length,
          projects: projsData.length,
          tasksTotal: tasksData.length,
          tasksDone: tasksData.filter(t => t.status === "done").length,
        });
        setDepartments(depsData.slice(0, 5));
        setProjects(projsData.slice(0, 5));
      } else if (isManager) {
        // Load profile to get department info
        const profile = await getUserById(user.id).catch(() => null);
        setMyProfile(profile);
        // Load assigned projects (where user is manager)
        const allProjects = await getAllProjects().catch(() => []);
        const managerProjects = allProjects.filter(p => p.managerId === user.id);
        setProjects(managerProjects);
        // Load tasks
        const tasksData = await getTasksByUser(user.id).catch(() => []);
        setMyTasks(tasksData);
        setStats({
          users: 0,
          departments: 0,
          projects: managerProjects.length,
          tasksTotal: tasksData.length,
          tasksDone: tasksData.filter(t => t.status === "done").length,
        });
      } else {
        // Employee
        const profile = await getUserById(user.id).catch(() => null);
        setMyProfile(profile);
        // Load projects employee is part of
        const allProjects = await getAllProjects().catch(() => []);
        setProjects(allProjects); // Will filter if needed
        // Load tasks assigned to employee
        const tasksData = await getTasksByUser(user.id).catch(() => []);
        setMyTasks(tasksData);
        setStats({
          users: 0,
          departments: 0,
          projects: allProjects.length,
          tasksTotal: tasksData.length,
          tasksDone: tasksData.filter(t => t.status === "done").length,
        });
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text-2)", fontSize: 14 }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  // ───────── GREETING ─────────
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  })();

  const displayName = user?.fullname || user?.name || "bạn";

  // ───────── ADMIN DASHBOARD ─────────
  if (isAdmin) {
    const kpis = [
      { label: "Nhân viên", value: stats.users, icon: ICONS.users, color: "var(--accent)" },
      { label: "Phòng ban", value: stats.departments, icon: ICONS.department, color: "#8b5cf6" },
      { label: "Dự án", value: stats.projects, icon: ICONS.project, color: "#f59e0b" },
      { label: "Task hoàn thành", value: `${stats.tasksDone}/${stats.tasksTotal}`, icon: ICONS.task, color: "var(--success)" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>{greeting}, {displayName}</h1>
            <p style={{ fontSize: 12, color: "var(--text-2)", margin: "4px 0 0" }}>Quản trị hệ thống · {today}</p>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {kpis.map(k => (
            <div key={k.label} className="kpi-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: k.color + "18",
                color: k.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{k.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{k.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Grid: Phòng ban + Dự án */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Phòng ban */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Phòng ban</span>
              <Link to="/dashboard/teams" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>Xem tất cả</Link>
            </div>
            {departments.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {departments.map(dep => (
                  <Link key={dep.id} to={`/dashboard/teams/${dep.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px", borderRadius: 8,
                      border: "1px solid var(--border)", transition: "border-color 0.15s", cursor: "pointer",
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: "var(--accent)" + "18", color: "var(--accent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                      }}>{dep.name?.charAt(0) || "P"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dep.name}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-3)", fontSize: 13 }}>Chưa có phòng ban nào</div>
            )}
          </div>

          {/* Dự án */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Dự án</span>
              <Link to="/dashboard/projects" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>Xem tất cả</Link>
            </div>
            {projects.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {projects.map(proj => {
                  const statusMap = { active: { label: "Đang thực hiện", cls: "badge-green" }, completed: { label: "Hoàn thành", cls: "badge-blue" }, paused: { label: "Tạm dừng", cls: "badge-amber" } };
                  const st = statusMap[proj.status] || { label: proj.status, cls: "badge-gray" };
                  return (
                    <Link key={proj.id} to={`/dashboard/projects/${proj.id}`} style={{ textDecoration: "none" }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px", borderRadius: 8,
                        border: "1px solid var(--border)", transition: "border-color 0.15s", cursor: "pointer",
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: "#f59e0b18", color: "#f59e0b",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700,
                        }}>{proj.name?.charAt(0) || "D"}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-3)" }}>Quản lý: {proj.managerName || "Chưa gán"}</div>
                        </div>
                        <span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-3)", fontSize: 13 }}>Chưa có dự án nào</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ───────── MANAGER DASHBOARD ─────────
  if (isManager) {
    const depName = myProfile?.departmentName || null;
    const kpis = [
      { label: "Dự án quản lý", value: stats.projects, icon: ICONS.project, color: "#f59e0b" },
      { label: "Task được giao", value: stats.tasksTotal, icon: ICONS.task, color: "var(--accent)" },
      { label: "Đã hoàn thành", value: stats.tasksDone, icon: ICONS.task, color: "var(--success)" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>{greeting}, {displayName}</h1>
          <p style={{ fontSize: 12, color: "var(--text-2)", margin: "4px 0 0" }}>
            Quản lý{depName ? ` · Phòng ${depName}` : ""} · {today}
          </p>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {kpis.map(k => (
            <div key={k.label} className="kpi-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: k.color + "18", color: k.color,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{k.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{k.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Dự án đang quản lý */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Dự án đang quản lý</span>
            <Link to="/dashboard/projects" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>Xem tất cả</Link>
          </div>
          {projects.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {projects.map(proj => {
                const statusMap = { active: { label: "Đang thực hiện", cls: "badge-green" }, completed: { label: "Hoàn thành", cls: "badge-blue" }, paused: { label: "Tạm dừng", cls: "badge-amber" } };
                const st = statusMap[proj.status] || { label: proj.status, cls: "badge-gray" };
                return (
                  <Link key={proj.id} to={`/dashboard/projects/${proj.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px", borderRadius: 8,
                      border: "1px solid var(--border)", transition: "border-color 0.15s", cursor: "pointer",
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: "#f59e0b18", color: "#f59e0b",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                      }}>{proj.name?.charAt(0) || "D"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{proj.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{proj.description || "Không có mô tả"}</div>
                      </div>
                      <span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyCard title="Chưa có dự án" description="Bạn chưa được Admin giao quản lý dự án nào." />
          )}
        </div>

        {/* Tasks gần đây */}
        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", display: "block", marginBottom: 16 }}>Công việc được giao</span>
          {myTasks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {myTasks.slice(0, 8).map(task => {
                const statusMap = { todo: { label: "Cần làm", cls: "badge-gray" }, in_progress: { label: "Đang làm", cls: "badge-blue" }, done: { label: "Xong", cls: "badge-green" } };
                const st = statusMap[task.status] || { label: task.status, cls: "badge-gray" };
                const prioMap = { high: "badge-red", medium: "badge-amber", low: "badge-green" };
                return (
                  <div key={task.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}>
                    <span className={`badge ${prioMap[task.priority] || "badge-gray"}`} style={{ fontSize: 10, flexShrink: 0 }}>
                      {task.priority === "high" ? "Cao" : task.priority === "medium" ? "Vừa" : "Thấp"}
                    </span>
                    <div style={{ flex: 1, fontSize: 13, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{task.projectName}</span>
                    <span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 20, color: "var(--text-3)", fontSize: 13 }}>Chưa có công việc nào</div>
          )}
        </div>
      </div>
    );
  }

  // ───────── EMPLOYEE DASHBOARD ─────────
  const depName = myProfile?.departmentName || null;
  const hasDepartment = !!depName;
  const hasProjects = projects.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>{greeting}, {displayName}</h1>
        <p style={{ fontSize: 12, color: "var(--text-2)", margin: "4px 0 0" }}>
          Nhân viên{depName ? ` · Phòng ${depName}` : ""} · {today}
        </p>
      </div>

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Phòng ban */}
        {hasDepartment ? (
          <div className="kpi-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "#8b5cf618", color: "#8b5cf6",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{ICONS.department}</div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 2 }}>Phòng ban</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{depName}</div>
            </div>
          </div>
        ) : (
          <div className="kpi-card" style={{ display: "flex", alignItems: "center", gap: 14, opacity: 0.5 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "var(--surface-2)", color: "var(--text-3)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{ICONS.department}</div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Phòng ban</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)" }}>Chưa được phân bổ</div>
            </div>
          </div>
        )}

        {/* Công việc */}
        <div className="kpi-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "var(--success)" + "18", color: "var(--success)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{ICONS.task}</div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 2 }}>Công việc</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              {stats.tasksDone}/{stats.tasksTotal} hoàn thành
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Projects and Tasks */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: hasProjects ? "1fr 1fr" : "1fr", 
        gap: 20 
      }}>
        {/* Dự án tham gia (Chỉ hiển thị khi đã được add vào dự án) */}
        {hasProjects && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Dự án tham gia</span>
              <Link to="/dashboard/projects" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>Xem tất cả</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {projects.map(proj => {
                const statusMap = { active: { label: "Đang thực hiện", cls: "badge-green" }, completed: { label: "Hoàn thành", cls: "badge-blue" }, paused: { label: "Tạm dừng", cls: "badge-amber" } };
                const st = statusMap[proj.status] || { label: proj.status, cls: "badge-gray" };
                return (
                  <Link key={proj.id} to={`/dashboard/projects/${proj.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px", borderRadius: 8,
                      border: "1px solid var(--border)", transition: "border-color 0.15s", cursor: "pointer",
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: "#0ea5e918", color: "#0ea5e9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                      }}>{proj.name?.charAt(0) || "D"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{proj.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{proj.description || "Không có mô tả"}</div>
                      </div>
                      <span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", display: "block", marginBottom: 16 }}>Công việc của tôi</span>
          {myTasks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {myTasks.map(task => {
                const statusMap = { todo: { label: "Cần làm", cls: "badge-gray" }, in_progress: { label: "Đang làm", cls: "badge-blue" }, done: { label: "Xong", cls: "badge-green" } };
                const st = statusMap[task.status] || { label: task.status, cls: "badge-gray" };
                const prioMap = { high: "badge-red", medium: "badge-amber", low: "badge-green" };
                return (
                  <div key={task.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}>
                    <span className={`badge ${prioMap[task.priority] || "badge-gray"}`} style={{ fontSize: 10, flexShrink: 0 }}>
                      {task.priority === "high" ? "Cao" : task.priority === "medium" ? "Vừa" : "Thấp"}
                    </span>
                    <div style={{ flex: 1, fontSize: 13, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{task.projectName}</span>
                    <span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyCard title="Chưa có công việc" description="Bạn chưa được giao công việc nào. Khi Manager phân công, công việc sẽ hiển thị ở đây." />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
