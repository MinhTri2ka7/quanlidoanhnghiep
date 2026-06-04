const loginHistory = [
  { id: 1, device: "Chrome - Windows 11", ip: "192.168.1.100", location: "Hà Nội, VN", time: "Hôm nay, 09:30", status: "success" },
  { id: 2, device: "Safari - macOS", ip: "10.0.0.45", location: "Hà Nội, VN", time: "Hôm nay, 08:15", status: "success" },
  { id: 3, device: "Firefox - Ubuntu", ip: "203.162.4.190", location: "TP.HCM, VN", time: "Hôm qua, 22:10", status: "failed" },
  { id: 4, device: "Chrome - Android", ip: "192.168.1.55", location: "Hà Nội, VN", time: "Hôm qua, 14:20", status: "success" },
  { id: 5, device: "Unknown Browser", ip: "45.33.32.156", location: "Unknown", time: "2 ngày trước", status: "failed" }
];

const activeSessions = [
  { id: 1, device: "Chrome - Windows 11", ip: "192.168.1.100", location: "Hà Nội", lastActive: "Đang hoạt động", isCurrent: true },
  { id: 2, device: "Safari - macOS", ip: "10.0.0.45", location: "Hà Nội", lastActive: "1 giờ trước", isCurrent: false },
  { id: 3, device: "Chrome - Android", ip: "192.168.1.55", location: "Hà Nội", lastActive: "3 giờ trước", isCurrent: false }
];

const securityAlerts = [
  { id: 1, type: "warning", title: "Đăng nhập thất bại nhiều lần", description: "5 lần đăng nhập thất bại từ IP 45.33.32.156", time: "2 ngày trước" },
  { id: 2, type: "info", title: "Thiết bị mới đăng nhập", description: "Chrome trên Android đã đăng nhập lần đầu", time: "Hôm qua" },
  { id: 3, type: "danger", title: "Đăng nhập từ vị trí lạ", description: "Phát hiện đăng nhập từ IP không xác định", time: "2 ngày trước" }
];

function SecurityPage() {
  function getAlertStyle(type) {
    if (type === "danger") return "border-dangerRed/30 bg-dangerRed/5";
    if (type === "warning") return "border-warningAmber/30 bg-warningAmber/5";
    return "border-primaryBlue/30 bg-primaryBlue/5";
  }

  function getAlertIconColor(type) {
    if (type === "danger") return "text-dangerRed";
    if (type === "warning") return "text-warningAmber";
    return "text-primaryBlue";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-darkText">Security Center</h1>
        <p className="text-sm text-darkTextGray mt-1">Giám sát bảo mật và quản lý phiên đăng nhập</p>
      </div>

      {/* Security Alerts */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-darkText">Cảnh báo bảo mật</h3>
        {securityAlerts.map((alert) => (
          <div key={alert.id} className={`border rounded-xl p-4 ${getAlertStyle(alert.type)}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${getAlertIconColor(alert.type)}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-darkText">{alert.title}</p>
                <p className="text-xs text-darkTextGray mt-0.5">{alert.description}</p>
              </div>
              <span className="text-xs text-darkTextGray shrink-0">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Sessions */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-darkText">Phiên đang hoạt động</h3>
          <button className="text-sm text-dangerRed hover:underline font-medium">Đăng xuất tất cả</button>
        </div>
        <div className="space-y-3">
          {activeSessions.map((session) => (
            <div key={session.id} className="flex items-center gap-4 p-3 rounded-xl border border-darkBorder hover:border-primaryBlue/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-darkBg flex items-center justify-center text-darkTextGray">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="14" x="2" y="3" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-darkText">{session.device}</p>
                  {session.isCurrent && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-successGreen/10 text-successGreen font-medium">Hiện tại</span>
                  )}
                </div>
                <p className="text-xs text-darkTextGray">{session.ip} • {session.location} • {session.lastActive}</p>
              </div>
              {!session.isCurrent && (
                <button className="text-xs text-dangerRed hover:underline font-medium">Đăng xuất</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Login History */}
      <div className="bg-darkCard border border-darkBorder rounded-card overflow-hidden">
        <div className="px-6 py-4 border-b border-darkBorder">
          <h3 className="text-base font-semibold text-darkText">Lịch sử đăng nhập</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-darkBorder">
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">Thiết bị</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">IP</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">Vị trí</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">Thời gian</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder">
              {loginHistory.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-3 text-sm text-darkText">{entry.device}</td>
                  <td className="px-6 py-3 text-sm text-darkTextGray font-mono">{entry.ip}</td>
                  <td className="px-6 py-3 text-sm text-darkTextGray">{entry.location}</td>
                  <td className="px-6 py-3 text-sm text-darkTextGray">{entry.time}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${entry.status === "success" ? "bg-successGreen/10 text-successGreen" : "bg-dangerRed/10 text-dangerRed"}`}>
                      {entry.status === "success" ? "Thành công" : "Thất bại"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SecurityPage;
