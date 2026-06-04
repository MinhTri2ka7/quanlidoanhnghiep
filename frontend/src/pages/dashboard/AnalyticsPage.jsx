const teamPerformance = [
  { team: "Backend",  tasks: 45, completed: 38, productivity: 84 },
  { team: "Frontend", tasks: 32, completed: 28, productivity: 88 },
  { team: "DevOps",   tasks: 18, completed: 17, productivity: 94 },
  { team: "QA",       tasks: 28, completed: 22, productivity: 79 },
  { team: "Mobile",   tasks: 24, completed: 20, productivity: 83 },
];

const weeklyData = [
  { day: "T2", tasks: 12 }, { day: "T3", tasks: 15 }, { day: "T4", tasks: 18 },
  { day: "T5", tasks: 10 }, { day: "T6", tasks: 22 }, { day: "T7", tasks: 8 },
  { day: "CN", tasks: 3  },
];

const S = {
  card:    { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 20px" },
  label:   { fontSize: 12, color: "var(--text-2)", marginBottom: 4 },
  bigNum:  { fontSize: 26, fontWeight: 700, color: "var(--text)", lineHeight: 1 },
  change:  { fontSize: 11, color: "var(--success)", marginTop: 4 },
  secHead: { fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 16 },
};

function AnalyticsPage() {
  const totalTasks     = teamPerformance.reduce((s, t) => s + t.tasks, 0);
  const totalCompleted = teamPerformance.reduce((s, t) => s + t.completed, 0);
  const avgProd        = Math.round(teamPerformance.reduce((s, t) => s + t.productivity, 0) / teamPerformance.length);
  const maxTasks       = Math.max(...weeklyData.map(d => d.tasks));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Phân tích</h1>
        <div style={{ display: "flex", gap: 4 }}>
          {["Tuần này", "Tháng", "Quý"].map((t, i) => (
            <button key={t} style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              background: i === 0 ? "var(--accent)" : "transparent",
              color: i === 0 ? "#fff" : "var(--text-2)",
              border: i === 0 ? "none" : "1px solid var(--border)",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Tổng tasks",   value: totalTasks,     change: "+12% tuần trước" },
          { label: "Hoàn thành",   value: totalCompleted, change: `${Math.round((totalCompleted/totalTasks)*100)}% completion` },
          { label: "Năng suất TB", value: `${avgProd}%`,  change: "+5% tuần trước" },
        ].map(k => (
          <div key={k.label} style={S.card}>
            <p style={S.label}>{k.label}</p>
            <p style={S.bigNum}>{k.value}</p>
            <p style={S.change}>{k.change}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Bar chart */}
        <div style={S.card}>
          <p style={S.secHead}>Tasks hoàn thành theo ngày</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
            {weeklyData.map((d) => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>{d.tasks}</span>
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%", height: `${(d.tasks / maxTasks) * 100}%`,
                    background: "var(--accent)", borderRadius: "4px 4px 0 0", opacity: 0.8,
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                  />
                </div>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team performance */}
        <div style={S.card}>
          <p style={S.secHead}>Hiệu suất theo team</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {teamPerformance.map((team) => (
              <div key={team.team}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--text)" }}>{team.team}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{team.productivity}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${team.productivity}%` }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3, display: "block" }}>
                  {team.completed}/{team.tasks} tasks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={S.card}>
        <p style={S.secHead}>Activity Heatmap</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array.from({ length: 35 }).map((_, i) => {
            const v = Math.random();
            const alpha = v > 0.8 ? 1 : v > 0.6 ? 0.7 : v > 0.4 ? 0.4 : v > 0.2 ? 0.2 : 0.06;
            return (
              <div key={i} style={{
                aspectRatio: "1", borderRadius: 3,
                background: `color-mix(in srgb, var(--accent) ${Math.round(alpha*100)}%, transparent)`,
              }} />
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Ít</span>
          {[6, 20, 40, 70, 100].map(a => (
            <div key={a} style={{ width: 12, height: 12, borderRadius: 2, background: `color-mix(in srgb, var(--accent) ${a}%, transparent)` }} />
          ))}
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Nhiều</span>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
