import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../../components/dashboard/Breadcrumb.jsx";
import { getAllDepartments, createDepartment, deleteDepartment } from "../../utils/api.js";

const breadcrumbItems = [
  { label: "Workspace", path: "/dashboard" },
  { label: "Teams", path: "/dashboard/teams" }
];

const iconOptions = ["💻", "📢", "👥", "🎨", "🧪", "⚙️", "📊", "🚀", "🔒", "📱"];
const colorOptions = [
  { from: "#3B82F6", to: "#6366F1", cls: "from-blue-500 to-indigo-500" },
  { from: "#8B5CF6", to: "#EC4899", cls: "from-violet-500 to-pink-500" },
  { from: "#10B981", to: "#34D399", cls: "from-emerald-500 to-green-400" },
  { from: "#F59E0B", to: "#FB923C", cls: "from-amber-500 to-orange-400" },
  { from: "#06B6D4", to: "#60A5FA", cls: "from-cyan-500 to-blue-400" },
  { from: "#EF4444", to: "#F87171", cls: "from-red-500 to-rose-400" },
];

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newTeamIcon, setNewTeamIcon] = useState("💻");
  const [newTeamColor, setNewTeamColor] = useState(colorOptions[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllDepartments();
      const mappedTeams = data.map((dept, index) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        icon: iconOptions[index % iconOptions.length],
        color: colorOptions[index % colorOptions.length],
        memberCount: dept.memberCount || 0,
        createdAt: "Vừa xong"
      }));
      setTeams(mappedTeams);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phòng ban");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createDepartment({
        name: newTeamName.trim(),
        description: newTeamDescription.trim()
      });
      const newTeam = {
        id: created.id,
        name: created.name,
        description: created.description,
        icon: newTeamIcon,
        color: newTeamColor,
        memberCount: 0,
        projectCount: 0,
        createdAt: "Vừa xong"
      };
      setTeams(prev => [newTeam, ...prev]);
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamIcon("💻");
      setNewTeamColor(colorOptions[0]);
      setIsCreateModalOpen(false);
    } catch (err) {
      alert(err.message || "Không thể tạo phòng ban mới");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTeam(teamId) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa team này?")) return;
    setDeletingId(teamId);
    try {
      await deleteDepartment(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (err) {
      alert(err.message || "Lỗi khi xóa team");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-darkText">Teams</h1>
          <p className="text-sm text-darkTextGray mt-1">
            {teams.length === 0
              ? "Chưa có team nào — hãy tạo team đầu tiên"
              : `${teams.length} team trong workspace`}
          </p>
        </div>
        <button
          id="btn-create-team"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold
            bg-gradient-to-r from-blue-500 to-indigo-600
            hover:from-blue-400 hover:to-indigo-500
            shadow-lg shadow-blue-500/25
            hover:shadow-blue-500/40 hover:-translate-y-0.5
            transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tạo Team mới
        </button>
      </div>

      {/* Search */}
      {teams.length > 0 && (
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-darkTextGray" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm team..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm text-darkText placeholder-darkTextGray
              bg-white/5 backdrop-blur-sm border border-white/10
              focus:outline-none focus:border-blue-500/50 focus:bg-white/8
              transition-all duration-200"
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-blue-400">
          <svg className="animate-spin w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Đang tải...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && teams.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-14 text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-darkText mb-2">Chưa có team nào</h3>
          <p className="text-sm text-darkTextGray mb-6 max-w-xs mx-auto leading-relaxed">
            Tạo các phòng ban để tổ chức nhân viên và dự án theo cấu trúc doanh nghiệp.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tạo team đầu tiên
          </button>
        </div>
      )}

      {/* Team Cards Grid */}
      {!isLoading && !error && filteredTeams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map(team => (
            <div
              key={team.id}
              className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm
                hover:bg-white/8 hover:border-white/20 hover:-translate-y-1
                transition-all duration-300 overflow-hidden"
            >
              {/* Top gradient line */}
              <div
                className="absolute top-0 inset-x-0 h-0.5 opacity-80"
                style={{ background: `linear-gradient(90deg, ${team.color.from}, ${team.color.to})` }}
              />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${team.color.from}33, ${team.color.to}33)`, border: `1px solid ${team.color.from}40` }}
                    >
                      {team.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-darkText group-hover:text-blue-400 transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-xs text-darkTextGray mt-0.5">Tạo: {team.createdAt}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    disabled={deletingId === team.id}
                    className="p-1.5 rounded-lg text-darkTextGray hover:text-red-400 hover:bg-red-500/10
                      opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Xóa team"
                  >
                    {deletingId === team.id ? (
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Description */}
                {team.description && (
                  <p className="text-xs text-darkTextGray mb-4 line-clamp-2 leading-relaxed">
                    {team.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-darkTextGray mb-4">
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{team.memberCount} thành viên</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/8">
                  <Link
                    to={`/dashboard/teams/${team.id}`}
                    className="flex-1 py-2 text-xs font-semibold text-center text-blue-400
                      bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
                  >
                    Xem chi tiết
                  </Link>
                  <Link
                    to={`/dashboard/teams/${team.id}`}
                    className="flex-1 py-2 text-xs font-medium text-center text-darkTextGray
                      bg-white/5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Thêm thành viên
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h2 className="modal-title">Tạo Team mới</h2>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTeam}>
              <div className="modal-body">
                {/* Icon picker */}
                <div>
                  <label className="field-label">Icon</label>
                  <div className="flex items-center gap-2 flex-wrap" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewTeamIcon(icon)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          background: newTeamIcon === icon ? "var(--accent-dim)" : "var(--surface-2)",
                          border: newTeamIcon === icon ? "2px solid var(--accent)" : "1px solid var(--border)",
                          transform: newTeamIcon === icon ? "scale(1.05)" : "none"
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="field-label">Màu sắc</label>
                  <div className="flex items-center gap-2" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    {colorOptions.map((color, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewTeamColor(color)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                          border: newTeamColor === color ? "2px solid var(--text)" : "none",
                          transform: newTeamColor === color ? "scale(1.15)" : "none",
                          boxShadow: newTeamColor === color ? "0 0 8px var(--text)" : "none"
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="field-label" htmlFor="team-name">Tên team <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="team-name"
                    type="text"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="VD: Kỹ thuật, Marketing..."
                    autoFocus
                    required
                    className="field-input"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="field-label" htmlFor="team-desc">Mô tả</label>
                  <textarea
                    id="team-desc"
                    value={newTeamDescription}
                    onChange={e => setNewTeamDescription(e.target.value)}
                    placeholder="Mô tả ngắn về chức năng của team..."
                    rows={3}
                    className="field-input"
                    style={{ height: "auto", padding: "10px 12px", resize: "none" }}
                  />
                </div>

                {/* Preview */}
                <div style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", marginTop: 8 }}>
                  <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", margin: "0 0 8px 0" }}>Preview</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        background: `linear-gradient(135deg, ${newTeamColor.from}44, ${newTeamColor.to}44)`,
                        border: `1px solid ${newTeamColor.from}50`,
                        color: newTeamColor.from
                      }}
                    >
                      {newTeamIcon}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{newTeamName || "Tên team"}</p>
                      <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>{newTeamDescription || "Mô tả team..."}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                <button
                  type="submit"
                  id="btn-submit-create-team"
                  disabled={!newTeamName.trim() || isSubmitting}
                  className="btn-primary"
                  style={{ width: "auto", padding: "0 20px" }}
                >
                  {isSubmitting ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang tạo...
                    </span>
                  ) : "Tạo Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamsPage;
