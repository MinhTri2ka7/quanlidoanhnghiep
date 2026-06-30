import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../utils/useCurrentUser.js";

// NAV theo từng role
const NAV_ADMIN = [
  {
    section: "Tổng quan",
    items: [{ path: "/dashboard", label: "Dashboard", icon: "home", exact: true }],
  },
  {
    section: "Quản lý",
    items: [
      { path: "/dashboard/employees", label: "Nhân viên",  icon: "employees" },
      { path: "/dashboard/teams",     label: "Phòng ban",  icon: "teams"     },
      { path: "/dashboard/projects",  label: "Dự án",      icon: "projects"  },
    ],
  },
  {
    section: "Hệ thống",
    items: [
      { path: "/dashboard/analytics", label: "Phân tích",  icon: "analytics" },
      { path: "/dashboard/chat",      label: "Tin nhắn",   icon: "chat"      },
      { path: "/dashboard/settings",  label: "Cài đặt",    icon: "settings"  },
    ],
  },
];

const NAV_MANAGER = [
  {
    section: "Tổng quan",
    items: [{ path: "/dashboard", label: "Dashboard", icon: "home", exact: true }],
  },
  {
    section: "Công việc",
    items: [
      { path: "/dashboard/projects", label: "Dự án",     icon: "projects" },
    ],
  },
  {
    section: "Hệ thống",
    items: [
      { path: "/dashboard/chat",     label: "Tin nhắn",  icon: "chat"     },
      { path: "/dashboard/settings", label: "Cài đặt",   icon: "settings" },
    ],
  },
];

const NAV_EMPLOYEE = [
  {
    section: "Tổng quan",
    items: [{ path: "/dashboard", label: "Dashboard", icon: "home", exact: true }],
  },
  {
    section: "Công việc",
    items: [
      { path: "/dashboard/projects", label: "Dự án", icon: "projects" },
    ],
  },
  {
    section: "Hệ thống",
    items: [
      { path: "/dashboard/chat",     label: "Tin nhắn", icon: "chat"     },
      { path: "/dashboard/settings", label: "Cài đặt",  icon: "settings" },
    ],
  },
];

const ICONS = {
  home:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  employees: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  teams:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  projects:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  tasks:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>,
  analytics: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  chat:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  settings:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 9 3V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

function Sidebar({ isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, isAdmin, isManager } = useCurrentUser();

  // Chọn menu theo role
  const NAV = isAdmin ? NAV_ADMIN : isManager ? NAV_MANAGER : NAV_EMPLOYEE;

  function isActive({ path, exact }) {
    return exact ? location.pathname === path : location.pathname.startsWith(path);
  }

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  // Hiển thị badge role
  const roleBadge = isAdmin
    ? { label: "Admin", color: "#EF4444" }
    : isManager
    ? { label: "Manager", color: "#F59E0B" }
    : { label: "Employee", color: "#10B981" };

  return (
    <aside style={{
      position: "fixed",
      left: 0, top: 0,
      height: "100%",
      width: isCollapsed ? 56 : 240,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
      transition: "width 0.2s ease",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: isCollapsed ? "0 12px" : "0 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, flexShrink: 0,
          background: "var(--accent)",
          borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 13,
        }}>T</div>
        {!isCollapsed && (
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden" }}>TechCorp Vietnam</div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 2 }}>
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link${isActive(item) ? " active" : ""}`}
                title={item.label}
                style={isCollapsed ? { justifyContent: "center", padding: "8px 0" } : {}}
              >
                {ICONS[item.icon]}
                {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* User + Collapse */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 8px", flexShrink: 0 }}>
        {!isCollapsed && user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", marginBottom: 4 }}>
            <div style={{ 
              width: 26, height: 26, borderRadius: 6, flexShrink: 0, 
              background: "var(--accent-bg)", color: "var(--accent)", 
              display: "flex", alignItems: "center", justifyContent: "center", 
              fontWeight: 700, fontSize: 11, overflow: "hidden" 
            }}>
              {user.avatar && (user.avatar.startsWith("http://") || user.avatar.startsWith("https://") || user.avatar.includes("/")) ? (
                <img src={user.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (user.fullname || user.email || "?")[0].toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.fullname || user.email}
              </div>
              <div style={{ 
                display: "inline-block", marginTop: 2,
                fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                color: roleBadge.color,
                background: roleBadge.color + "20",
                border: `1px solid ${roleBadge.color}40`,
                borderRadius: 4, padding: "1px 5px",
              }}>
                {roleBadge.label}
              </div>
            </div>
            <button onClick={handleLogout} title="Đăng xuất" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2, flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="btn-ghost"
          style={{ width: "100%", height: 32, borderRadius: 8 }}
          aria-label={isCollapsed ? "Mở sidebar" : "Thu sidebar"}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed
              ? <path d="m9 18 6-6-6-6"/>
              : <path d="m15 18-6-6 6-6"/>}
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
