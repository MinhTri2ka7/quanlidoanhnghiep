import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/dashboard":            "Dashboard",
  "/dashboard/employees":  "Nhân viên",
  "/dashboard/teams":      "Phòng ban",
  "/dashboard/projects":   "Dự án",
  "/dashboard/tasks":      "Công việc",
  "/dashboard/analytics":  "Phân tích",
  "/dashboard/chat":       "Tin nhắn",
  "/dashboard/settings":   "Cài đặt",
  "/dashboard/security":   "Bảo mật",
  "/dashboard/logs":       "Audit Logs",
  "/dashboard/billing":    "Thanh toán",
};

function Topbar({ isSidebarCollapsed }) {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const pageTitle = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([k]) => location.pathname.startsWith(k))?.[1] || "Dashboard";

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    function onThemeChange(e) { if (e.detail) setTheme(e.detail); }
    window.addEventListener("theme-change", onThemeChange);
    return () => window.removeEventListener("theme-change", onThemeChange);
  }, []);

  useEffect(() => {
    function onUserUpdate(e) { if (e.detail) setUser(e.detail); }
    window.addEventListener("user-update", onUserUpdate);
    return () => window.removeEventListener("user-update", onUserUpdate);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
  }

  return (
    <header style={{
      position: "fixed",
      top: 0,
      left: isSidebarCollapsed ? 56 : 240,
      right: 0,
      height: 48,
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      zIndex: 30,
      transition: "left 0.2s ease",
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{pageTitle}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button className="btn-ghost" title="Tìm kiếm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </button>

        <button className="btn-ghost" title="Thông báo" style={{ position: "relative" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span style={{ position: "absolute", top: 6, right: 6, width: 5, height: 5, borderRadius: "50%", background: "var(--danger)", border: "1.5px solid var(--surface)" }} />
        </button>

        <button className="btn-ghost" onClick={toggleTheme} title={theme === "light" ? "Tối" : "Sáng"}>
          {theme === "light" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          )}
        </button>

        <div style={{ 
          width: 28, 
          height: 28, 
          borderRadius: 6, 
          background: "var(--accent-bg)", 
          color: "var(--accent)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          fontWeight: 700, 
          fontSize: 12, 
          cursor: "pointer", 
          marginLeft: 4,
          overflow: "hidden" 
        }}>
          {user && user.avatar && (user.avatar.startsWith("http://") || user.avatar.startsWith("https://") || user.avatar.includes("/")) ? (
            <img src={user.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            user ? (user.fullname || user.email || "?")[0].toUpperCase() : "?"
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
