import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <Topbar isSidebarCollapsed={isSidebarCollapsed} />

      <main style={{
        paddingTop: 48,
        paddingLeft: isSidebarCollapsed ? 56 : 240,
        minHeight: "100vh",
        transition: "padding-left 0.2s ease",
      }}>
        <div style={{ padding: "24px 28px", maxWidth: 1400 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
