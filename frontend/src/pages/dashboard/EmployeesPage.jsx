import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, getAllDepartments } from "../../utils/api.js";

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [usersData, deptsData] = await Promise.all([
          getAllUsers(),
          getAllDepartments()
        ]);

        const mappedTeams = deptsData.map((dept, index) => {
          const icons = ["💻", "📢", "👥", "🎨", "🧪", "⚙️", "📊", "🚀"];
          return {
            id: dept.id,
            name: dept.name,
            shortName: dept.name.split(" ")[0] || dept.name,
            icon: icons[index % icons.length]
          };
        });
        setTeams(mappedTeams);

        const mappedEmployees = usersData.map((user) => ({
          id: user.id,
          name: user.fullname,
          email: user.email,
          phone: user.phone,
          avatar: user.fullname.substring(0, 1).toUpperCase(),
          role: user.roleName || "Nhân viên",
          departmentName: user.departmentName || "Chưa phân ban",
          status: user.isActive ? "online" : "offline",
          productivity: Math.floor(Math.random() * 20) + 80 // Giả lập năng suất
        }));
        setEmployees(mappedEmployees);

      } catch (err) {
        setError(err.message || "Lỗi tải dữ liệu nhân viên");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = employee.name.toLowerCase().includes(lowerQuery) ||
      employee.email.toLowerCase().includes(lowerQuery) ||
      employee.role.toLowerCase().includes(lowerQuery);
    
    const matchesTeam = filterTeam === "all" || employee.departmentName === filterTeam;
    return matchesSearch && matchesTeam;
  });

  function getStatusStyle(status) {
    if (status === "online") return { background: "var(--success)" };
    if (status === "away") return { background: "var(--warning)" };
    return { background: "var(--text-2)" };
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Nhân viên</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            {isLoading ? "Đang tải..." : `${employees.length} nhân viên trong workspace`}
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          style={{ width: "auto", padding: "0 14px" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm nhân viên
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-2)" }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email, vai trò..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="field-input w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterTeam("all")}
            className="px-3 py-2 text-xs rounded-lg font-medium transition-colors"
            style={
              filterTeam === "all"
                ? { background: "var(--accent-bg)", color: "var(--accent)" }
                : { color: "var(--text-2)" }
            }
          >
            Tất cả
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setFilterTeam(team.name)}
              className="px-3 py-2 text-xs rounded-lg font-medium transition-colors"
              style={
                filterTeam === team.name
                  ? { background: "var(--accent-bg)", color: "var(--accent)" }
                  : { color: "var(--text-2)" }
              }
            >
              {team.icon} {team.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center p-12" style={{ color: "var(--accent)" }}>
          <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Đang tải thông tin nhân viên...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="toast-error">
          ⚠️ Lỗi: {error}
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>Nhân viên</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>Team</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>Vai trò</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>Năng suất</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = ""}
                  >
                    <td className="px-6 py-4">
                      <Link to={`/dashboard/employees/${employee.id}`} className="flex items-center gap-3 group">
                        <div className="relative">
                          <div style={{
                            background: "var(--accent-bg)",
                            color: "var(--accent)",
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 13
                          }}>
                            {employee.avatar}
                          </div>
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                            style={{ ...getStatusStyle(employee.status), borderColor: "var(--surface)" }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{employee.name}</p>
                          <p className="text-xs" style={{ color: "var(--text-2)" }}>{employee.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1"
                        style={{
                          background: "var(--accent-bg)",
                          color: "var(--accent)",
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        💼 {employee.departmentName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--text-2)" }}>{employee.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="progress-track w-20">
                          <div className="progress-fill" style={{ width: `${employee.productivity}%` }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{employee.productivity}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: employee.status === "online" ? "var(--success)" : "var(--text-2)" }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={getStatusStyle(employee.status)}
                        />
                        {employee.status === "online" ? "Online" : "Offline"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeesPage;
