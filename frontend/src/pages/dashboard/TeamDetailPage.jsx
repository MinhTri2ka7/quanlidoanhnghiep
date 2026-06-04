import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import Breadcrumb from "../../components/dashboard/Breadcrumb.jsx";

function TeamDetailPage() {
  const { teamId } = useParams();

  // Trong thực tế sẽ fetch từ API theo teamId
  // Hiện tại hiển thị giao diện team detail trống để user thêm members/projects
  const [teamName] = useState("Team");
  const [members, setMembers] = useState([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const breadcrumbItems = [
    { label: "Workspace", path: "/dashboard" },
    { label: "Teams", path: "/dashboard/teams" },
    { label: teamName, path: `/dashboard/teams/${teamId}` }
  ];

  function handleAddMember(event) {
    event.preventDefault();
    if (!newMemberName.trim()) return;

    const member = {
      id: "mem-" + Date.now(),
      name: newMemberName.trim(),
      role: newMemberRole.trim() || "Member",
      email: newMemberEmail.trim(),
      status: "online",
      avatar: newMemberName.charAt(0).toUpperCase()
    };

    setMembers([...members, member]);
    setNewMemberName("");
    setNewMemberRole("");
    setNewMemberEmail("");
    setIsAddMemberOpen(false);
  }

  function handleRemoveMember(memberId) {
    setMembers(members.filter((m) => m.id !== memberId));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={breadcrumbItems} />

      {/* Team Header */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primaryBlue to-accentIndigo flex items-center justify-center text-2xl">
              💻
            </div>
            <div>
              <h1 className="text-xl font-bold text-darkText">{teamName}</h1>
              <p className="text-sm text-darkTextGray mt-0.5">ID: {teamId}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-darkTextGray">
                <span>{members.length} thành viên</span>
                <span>0 dự án</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primaryBlue to-accentIndigo text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Thêm thành viên
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkText">{members.length}</p>
          <p className="text-xs text-darkTextGray mt-1">Thành viên</p>
        </div>
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkText">0</p>
          <p className="text-xs text-darkTextGray mt-1">Dự án</p>
        </div>
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkText">0</p>
          <p className="text-xs text-darkTextGray mt-1">Tasks</p>
        </div>
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkTextGray">—</p>
          <p className="text-xs text-darkTextGray mt-1">Hiệu suất</p>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-darkText">Thành viên</h3>
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="text-xs text-primaryBlue hover:underline font-medium"
          >
            + Thêm
          </button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-darkBg flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-darkTextGray">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-sm text-darkTextGray mb-1">Chưa có thành viên</p>
            <p className="text-xs text-darkTextGray">Thêm nhân viên vào team này</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accentIndigo to-accentPurple flex items-center justify-center text-white text-sm font-medium">
                    {member.avatar}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-darkCard bg-successGreen" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-darkText">{member.name}</p>
                  <p className="text-xs text-darkTextGray">{member.role} {member.email && `• ${member.email}`}</p>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-1.5 rounded-lg text-darkTextGray hover:text-dangerRed hover:bg-dangerRed/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Xóa khỏi team"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects Section (empty state) */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-darkText">Dự án của team</h3>
          <button className="text-xs text-primaryBlue hover:underline font-medium">
            + Tạo dự án
          </button>
        </div>
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-darkBg flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-darkTextGray">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm text-darkTextGray mb-1">Chưa có dự án</p>
          <p className="text-xs text-darkTextGray">Tạo dự án để giao việc cho team</p>
        </div>
      </div>

      {/* Tasks Section (empty state) */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-darkText">Tasks</h3>
          <Link to="/dashboard/tasks" className="text-xs text-primaryBlue hover:underline font-medium">
            Xem Kanban →
          </Link>
        </div>
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-darkBg flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-darkTextGray">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm text-darkTextGray mb-1">Chưa có task</p>
          <p className="text-xs text-darkTextGray">Tasks sẽ xuất hiện khi tạo dự án</p>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddMemberOpen(false)}
          />
          <div className="relative bg-darkCard border border-darkBorder rounded-card w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accentPurple to-primaryBlue rounded-t-card" />

            <h2 className="text-lg font-bold text-darkText mb-1">Thêm thành viên</h2>
            <p className="text-sm text-darkTextGray mb-5">Thêm nhân viên vào team này</p>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkText mb-2">Họ và tên *</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(event) => setNewMemberName(event.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full h-11 px-4 rounded-xl bg-darkBg border border-darkBorder text-darkText text-sm placeholder-darkTextGray focus:outline-none focus:border-primaryBlue/50 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkText mb-2">Email</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(event) => setNewMemberEmail(event.target.value)}
                  placeholder="email@company.com"
                  className="w-full h-11 px-4 rounded-xl bg-darkBg border border-darkBorder text-darkText text-sm placeholder-darkTextGray focus:outline-none focus:border-primaryBlue/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkText mb-2">Vai trò</label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(event) => setNewMemberRole(event.target.value)}
                  placeholder="VD: Developer, Designer, QA..."
                  className="w-full h-11 px-4 rounded-xl bg-darkBg border border-darkBorder text-darkText text-sm placeholder-darkTextGray focus:outline-none focus:border-primaryBlue/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-darkBorder bg-darkBg text-darkText text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newMemberName.trim()}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-accentPurple to-primaryBlue text-white text-sm font-medium
                    hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamDetailPage;
