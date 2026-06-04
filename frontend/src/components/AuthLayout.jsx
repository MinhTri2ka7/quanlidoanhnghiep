function AuthLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>
      {/* Left brand panel */}
      <aside style={{
        width: 420,
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 40px",
      }} className="hidden lg:flex">
        {/* Logo */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
            <div style={{
              width: 32, height: 32,
              background: "var(--accent)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 15,
            }}>T</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>TechCorp Vietnam</div>
              <div style={{ fontSize: 11, color: "var(--text-2)" }}>Enterprise Workspace</div>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginBottom: 14 }}>
            Hệ thống quản lý<br />doanh nghiệp
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.7 }}>
            Quản lý nhân sự, dự án và công việc trong một nền tảng thống nhất — được thiết kế cho hiệu suất doanh nghiệp.
          </p>

          {/* Features */}
          <ul style={{ listStyle: "none", padding: 0, margin: "32px 0 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Quản lý nhân sự và phòng ban tập trung",
              "Theo dõi công việc và dự án realtime",
              "Báo cáo và phân tích trực quan",
              "Bảo mật chuẩn doanh nghiệp",
            ].map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-2)" }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: "var(--accent-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
          {[["128+", "Nhân viên"], ["24", "Dự án"], ["99.9%", "Uptime"]].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right form area */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
