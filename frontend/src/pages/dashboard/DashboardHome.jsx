import { Link } from "react-router-dom";
import { workspace, teams, employees, projects, recentActivities, getEmployeeById } from "../../data/mockData.js";

const ACTIVITY_ICONS = {
  default: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
};

function DashboardHome() {
  const onlineEmployees = employees.filter((e) => e.status === "online");
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const kpis = [
    { label: "Nhân viên",   value: workspace.totalEmployees,     change: "+12%" },
    { label: "Phòng ban",   value: workspace.totalTeams,         change: "+1"   },
    { label: "Dự án",      value: workspace.totalProjects,       change: "+3"   },
    { label: "Task xong",  value: workspace.totalTasksCompleted, change: "+18%" },
    { label: "Doanh thu",  value: workspace.revenue,             change: "+8%"  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Tổng quan</h1>
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>{today}</span>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>{k.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--success)" }}>{k.change}</span>
            </div>
            <div className="kpi-value" style={{ fontSize: 20 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Middle grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Teams */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Phòng ban</span>
            <Link to="/dashboard/teams" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>Xem tất cả</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {teams.slice(0, 4).map((team) => (
              <Link key={team.id} to={`/dashboard/teams/${team.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  transition: "border-color 0.15s",
                  cursor: "pointer",
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: "var(--surface-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>{team.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-2)" }}>{team.memberCount} thành viên · {team.projectCount} dự án</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{team.performance}%</div>
                    <div className="progress-track" style={{ width: 60, marginTop: 4 }}>
                      <div className="progress-fill" style={{ width: `${team.performance}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 16 }}>Hoạt động gần đây</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recentActivities.slice(0, 7).map((act) => {
              const user = getEmployeeById(act.userId);
              return (
                <div key={act.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 8,
                  transition: "background 0.12s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: "var(--accent-bg)",
                    color: "var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 11,
                  }}>
                    {user ? user.avatar : "?"}
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 500 }}>{user ? user.name : "Unknown"}</span>
                    {" "}
                    <span style={{ color: "var(--text-2)" }}>{act.action}</span>
                    {" "}
                    <span style={{ color: "var(--accent)" }}>{act.target}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: chart + online */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Bar chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Năng suất tuần này</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["Tuần", "Tháng", "Quý"].map((t, i) => (
                <button key={t} style={{
                  padding: "3px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                  background: i === 0 ? "var(--accent)" : "transparent",
                  color: i === 0 ? "#fff" : "var(--text-2)",
                  border: i === 0 ? "none" : "1px solid var(--border)",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, padding: "0 8px" }}>
            {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%",
                    height: `${h}%`,
                    background: "var(--accent)",
                    borderRadius: "4px 4px 0 0",
                    opacity: 0.8,
                    transition: "opacity 0.15s",
                    cursor: "pointer",
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                    title={`${h}%`}
                  />
                </div>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {["T2","T3","T4","T5","T6","T7","CN"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Online members */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Online ngay</span>
            <span className="badge badge-green">{onlineEmployees.length} online</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {onlineEmployees.slice(0, 7).map((emp) => {
              const team = teams.find((t) => t.id === emp.teamId);
              return (
                <Link key={emp.id} to={`/dashboard/employees/${emp.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 8px", borderRadius: 8, transition: "background 0.12s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: "var(--surface-2)",
                        color: "var(--text)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 600, fontSize: 11,
                      }}>{emp.avatar}</div>
                      <span style={{
                        position: "absolute", bottom: -1, right: -1,
                        width: 8, height: 8, borderRadius: "50%",
                        background: "var(--success)",
                        border: "1.5px solid var(--surface)",
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-3)" }}>{team?.shortName} · {emp.role}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
