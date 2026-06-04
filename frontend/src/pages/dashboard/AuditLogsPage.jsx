import { useState } from "react";

const auditLogs = [
  { id: 1, user: "Nguyễn Văn A", action: "CREATE", module: "Project", detail: "Tạo project Mobile App v2", time: "09:30 17/05/2026", ip: "192.168.1.100" },
  { id: 2, user: "Trần Thị B", action: "UPDATE", module: "Task", detail: "Cập nhật trạng thái task #142", time: "09:15 17/05/2026", ip: "10.0.0.45" },
  { id: 3, user: "Admin", action: "DELETE", module: "Employee", detail: "Xóa tài khoản user test", time: "08:50 17/05/2026", ip: "192.168.1.1" },
  { id: 4, user: "Lê Văn C", action: "LOGIN", module: "Auth", detail: "Đăng nhập thành công", time: "08:30 17/05/2026", ip: "203.162.4.190" },
  { id: 5, user: "Phạm Thị D", action: "UPDATE", module: "Settings", detail: "Thay đổi cài đặt notification", time: "08:00 17/05/2026", ip: "192.168.1.55" },
  { id: 6, user: "Admin", action: "CREATE", module: "Team", detail: "Tạo team AI Research", time: "16:45 16/05/2026", ip: "192.168.1.1" },
  { id: 7, user: "Hoàng Văn E", action: "DEPLOY", module: "DevOps", detail: "Deploy production v3.2.1", time: "15:30 16/05/2026", ip: "10.0.0.80" },
  { id: 8, user: "Admin", action: "UPDATE", module: "Permission", detail: "Cập nhật quyền role Manager", time: "14:00 16/05/2026", ip: "192.168.1.1" }
];

function AuditLogsPage() {
  const [filterAction, setFilterAction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  function getActionStyle(action) {
    if (action === "CREATE") return "bg-successGreen/10 text-successGreen";
    if (action === "UPDATE") return "bg-primaryBlue/10 text-primaryBlue";
    if (action === "DELETE") return "bg-dangerRed/10 text-dangerRed";
    if (action === "LOGIN") return "bg-accentPurple/10 text-accentPurple";
    if (action === "DEPLOY") return "bg-accentCyan/10 text-accentCyan";
    return "bg-darkBorder/50 text-darkTextGray";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-darkText">Audit Logs</h1>
          <p className="text-sm text-darkTextGray mt-1">Lịch sử hoạt động hệ thống</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-darkCard border border-darkBorder text-sm text-darkTextGray hover:border-primaryBlue/50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-darkTextGray" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo user, module, chi tiết..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-darkCard border border-darkBorder text-darkText text-sm placeholder-darkTextGray focus:outline-none focus:border-primaryBlue/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "CREATE", "UPDATE", "DELETE", "LOGIN", "DEPLOY"].map((action) => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors
                ${filterAction === action ? "bg-primaryBlue/10 text-primaryBlue" : "text-darkTextGray hover:bg-white/5"}`}
            >
              {action === "all" ? "Tất cả" : action}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-darkCard border border-darkBorder rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-darkBorder">
                <th className="text-left px-6 py-4 text-xs font-semibold text-darkTextGray uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-darkTextGray uppercase tracking-wider">Action</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-darkTextGray uppercase tracking-wider">Module</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-darkTextGray uppercase tracking-wider">Chi tiết</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-darkTextGray uppercase tracking-wider">Thời gian</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-darkTextGray uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accentIndigo to-accentPurple flex items-center justify-center text-white text-[10px] font-medium">
                        {log.user.charAt(0)}
                      </div>
                      <span className="text-sm text-darkText">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getActionStyle(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-darkTextGray">{log.module}</td>
                  <td className="px-6 py-3 text-sm text-darkText max-w-[250px] truncate">{log.detail}</td>
                  <td className="px-6 py-3 text-sm text-darkTextGray whitespace-nowrap">{log.time}</td>
                  <td className="px-6 py-3 text-sm text-darkTextGray font-mono">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsPage;
