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
  "from-primaryBlue to-accentIndigo",
  "from-accentPurple to-pink-500",
  "from-successGreen to-emerald-400",
  "from-warningAmber to-orange-400",
  "from-accentCyan to-blue-400",
  "from-dangerRed to-rose-400"
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

  // Fetch departments when mounting
  useEffect(() => {
    async function loadDepartments() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllDepartments();
        // Map DTO to local shape for display compatibility
        const mappedTeams = data.map((dept, index) => ({
          id: dept.id,
          name: dept.name,
          description: dept.description,
          icon: iconOptions[index % iconOptions.length],
          color: colorOptions[index % colorOptions.length],
          memberCount: 0,
          projectCount: 0,
          performance: 0,
          createdAt: "Đang cập nhật"
        }));
        setTeams(mappedTeams);
      } catch (err) {
        setError(err.message || "Không thể tải danh sách phòng ban");
      } finally {
        setIsLoading(false);
      }
    }

    loadDepartments();
  }, []);

  async function handleCreateTeam(event) {
    event.preventDefault();

    if (!newTeamName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const createdDto = await createDepartment({
        name: newTeamName.trim(),
        description: newTeamDescription.trim()
      });

      const newTeam = {
        id: createdDto.id,
        name: createdDto.name,
        description: createdDto.description,
        icon: newTeamIcon,
        color: newTeamColor,
        memberCount: 0,
        projectCount: 0,
        performance: 0,
        createdAt: "Vừa xong"
      };

      setTeams([...teams, newTeam]);
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng ban này không?")) {
      return;
    }

    try {
      await deleteDepartment(teamId);
      setTeams(teams.filter((team) => team.id !== teamId));
    } catch (err) {
      alert(err.message || "Lỗi khi xóa phòng ban");
    }
  }

  const filteredTeams = teams.filter((team) => {
    return team.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-darkText">Teams / Departments</h1>
          <p className="text-sm text-darkTextGray mt-1">
            {teams.length === 0
              ? "Chưa có team nào. Tạo team đầu tiên cho workspace."
              : `${teams.length} phòng ban trong workspace`}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primaryBlue to-accentIndigo text-white text-sm font-medium hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primaryBlue/25 transition-all duration-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tạo Team
        </button>
      </div>

      {/* Search (only show when has teams) */}
      {teams.length > 0 && (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-darkTextGray" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Tìm team..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-darkCard border border-darkBorder text-darkText text-sm placeholder-darkTextGray focus:outline-none focus:border-primaryBlue/50 transition-colors"
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center p-12 text-primaryBlue">
          <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Đang tải phòng ban...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-dangerRed/10 border border-dangerRed/20 text-dangerRed text-sm">
          ⚠️ Lỗi: {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && teams.length === 0 && (
        <div className="bg-darkCard border border-darkBorder rounded-card p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primaryBlue/10 flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primaryBlue">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-darkText mb-2">Chưa có team nào</h3>
          <p className="text-sm text-darkTextGray mb-6 max-w-sm mx-auto">
            Tạo các phòng ban / team để tổ chức nhân viên, dự án và công việc theo cấu trúc doanh nghiệp.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primaryBlue to-accentIndigo text-white text-sm font-medium hover:opacity-90 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tạo team đầu tiên
          </button>
        </div>
      )}

      {/* Team Cards */}
      {!isLoading && !error && filteredTeams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-darkCard border border-darkBorder rounded-card p-5 hover:border-primaryBlue/30 transition-all duration-300 group relative"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDeleteTeam(team.id)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-darkTextGray hover:text-dangerRed hover:bg-dangerRed/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Xóa team"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${team.color} flex items-center justify-center text-xl`}>
                  {team.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-darkText group-hover:text-primaryBlue transition-colors truncate">
                    {team.name}
                  </h3>
                  <p className="text-xs text-darkTextGray">Tạo: {team.createdAt}</p>
                </div>
              </div>

              {team.description && (
                <p className="text-xs text-darkTextGray mb-4 line-clamp-2">{team.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-darkTextGray mb-3">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {team.memberCount} members
                </span>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  {team.projectCount} projects
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-darkBorder flex items-center gap-2">
                <Link
                  to={`/dashboard/teams/${team.id}`}
                  className="flex-1 py-2 text-xs font-medium text-center text-primaryBlue bg-primaryBlue/10 rounded-lg hover:bg-primaryBlue/20 transition-colors"
                >
                  Mở chi tiết
                </Link>
                <button className="flex-1 py-2 text-xs font-medium text-center text-darkTextGray bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  Cài đặt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-darkCard border border-darkBorder rounded-card w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primaryBlue via-accentIndigo to-accentPurple rounded-t-card" />

            <h2 className="text-lg font-bold text-darkText mb-1">Tạo Team mới</h2>
            <p className="text-sm text-darkTextGray mb-6">Thêm phòng ban / nhóm vào workspace</p>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              {/* Icon picker */}
              <div>
                <label className="block text-sm font-medium text-darkText mb-2">Icon</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewTeamIcon(icon)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
                        ${newTeamIcon === icon
                          ? "bg-primaryBlue/20 border-2 border-primaryBlue scale-110"
                          : "bg-darkBg border border-darkBorder hover:border-darkTextGray/50"}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-darkText mb-2">Màu sắc</label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTeamColor(color)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} transition-all
                        ${newTeamColor === color
                          ? "ring-2 ring-primaryBlue ring-offset-2 ring-offset-darkCard scale-110"
                          : "hover:scale-105"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-darkText mb-2">Tên team *</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(event) => setNewTeamName(event.target.value)}
                  placeholder="VD: IT / Engineering"
                  className="w-full h-11 px-4 rounded-xl bg-darkBg border border-darkBorder text-darkText text-sm placeholder-darkTextGray focus:outline-none focus:border-primaryBlue/50 transition-colors"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-darkText mb-2">Mô tả</label>
                <textarea
                  value={newTeamDescription}
                  onChange={(event) => setNewTeamDescription(event.target.value)}
                  placeholder="Mô tả ngắn về team này..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-darkBg border border-darkBorder text-darkText text-sm placeholder-darkTextGray focus:outline-none focus:border-primaryBlue/50 transition-colors resize-none"
                />
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl border border-darkBorder bg-darkBg">
                <p className="text-[10px] text-darkTextGray uppercase tracking-wider mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${newTeamColor} flex items-center justify-center text-lg`}>
                    {newTeamIcon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-darkText">{newTeamName || "Tên team"}</p>
                    <p className="text-xs text-darkTextGray">{newTeamDescription || "Mô tả team"}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-darkBorder bg-darkBg text-darkText text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newTeamName.trim() || isSubmitting}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primaryBlue to-accentIndigo text-white text-sm font-medium
                    hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? "Đang xử lý..." : "Tạo Team"}
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
