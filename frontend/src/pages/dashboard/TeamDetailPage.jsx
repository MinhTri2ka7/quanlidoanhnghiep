import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Breadcrumb from "../../components/dashboard/Breadcrumb.jsx";
import { getDepartmentById, getAllUsers, updateUser } from "../../utils/api.js";

const iconOptions = ["💻", "📢", "👥", "🎨", "🧪", "⚙️", "📊", "🚀", "🔒", "📱"];
const avatarGradients = [
  "from-blue-500 to-indigo-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
];
const getGradient = (id) => avatarGradients[(id || 0) % avatarGradients.length];

function TeamDetailPage() {
  const { teamId } = useParams();

  const [team, setTeam]       = useState(null);
  const [members, setMembers] = useState([]);
  const [available, setAvailable] = useState([]); // nhân viên chưa trong team
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Modal thêm thành viên
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [addingId, setAddingId]         = useState(null);

  // Xóa thành viên
  const [removingId, setRemovingId] = useState(null);

  const searchRef = useRef(null);

  const breadcrumbItems = [
    { label: "Workspace", path: "/dashboard" },
    { label: "Teams",     path: "/dashboard/teams" },
    { label: team?.name || "Chi tiết", path: `/dashboard/teams/${teamId}` },
  ];

  useEffect(() => { loadData(); }, [teamId]);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [dept, users] = await Promise.all([
        getDepartmentById(teamId),
        getAllUsers(),
      ]);
      setTeam({ ...dept, icon: iconOptions[dept.id % iconOptions.length] });

      const inTeam  = users.filter(u => u.department && String(u.department.id) === String(teamId));
      const outside = users.filter(u => !u.department || String(u.department.id) !== String(teamId));
      setMembers(inTeam);
      setAvailable(outside);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu team");
    } finally {
      setIsLoading(false);
    }
  }

  function openModal() {
    setSearchQuery("");
    setIsModalOpen(true);
    setTimeout(() => searchRef.current?.focus(), 80);
  }

  // Danh sách nhân viên lọc theo tìm kiếm
  const filteredAvailable = available.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.fullname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.name?.toLowerCase().includes(q)
    );
  });

  async function handleAdd(user) {
    setAddingId(user.id);
    try {
      await updateUser(user.id, {
        fullname:     user.fullname,
        email:        user.email,
        phone:        user.phone || "0000000000",
        departmentId: Number(teamId),
        roleId:       user.role?.id || 1,
        isActive:     user.isActive ?? true,
      });
      setMembers(prev => [...prev, { ...user, department: { id: Number(teamId), name: team?.name } }]);
      setAvailable(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      alert("Lỗi: " + (err.message || ""));
    } finally {
      setAddingId(null);
    }
  }

  async function handleRemove(user) {
    if (!window.confirm(`Bỏ ${user.fullname} khỏi team?`)) return;
    setRemovingId(user.id);
    try {
      await updateUser(user.id, {
        fullname:         user.fullname,
        email:            user.email,
        phone:            user.phone || "0000000000",
        departmentId:     null,
        roleId:           user.role?.id || 1,
        isActive:         user.isActive ?? true,
      });
      setAvailable(prev => [...prev, { ...user, department: null }]);
      setMembers(prev => prev.filter(m => m.id !== user.id));
    } catch (err) {
      alert("Lỗi: " + (err.message || ""));
    } finally {
      setRemovingId(null);
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-blue-400">
      <svg className="animate-spin w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <span className="text-sm">Đang tải dữ liệu team...</span>
    </div>
  );

  if (error) return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumbItems}/>
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
        ⚠️ {error}
        <button onClick={loadData} className="ml-auto underline text-xs">Thử lại</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb items={breadcrumbItems}/>

      {/* ─── Hero ─────────────────────────────────── */}
      <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top left,#3B82F6 0%,transparent 65%)" }}/>
        <div className="relative p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-white/10 shadow-xl"
              style={{ background: "linear-gradient(135deg,#3B82F633,#6366F133)" }}>
              {team?.icon || "👥"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-darkText">{team?.name}</h1>
              {team?.description && <p className="text-sm text-darkTextGray mt-1 max-w-md">{team.description}</p>}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  👥 {members.length} thành viên
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-darkTextGray">
                  📁 0 dự án
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold
              bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500
              shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-200 self-start sm:self-auto"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Thêm thành viên
          </button>
        </div>
      </div>

      {/* ─── Stats ───────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Thành viên", value: members.length, icon:"👥" },
          { label:"Dự án",      value: 0,               icon:"📁" },
          { label:"Tasks",      value: 0,               icon:"✅" },
          { label:"Hiệu suất", value: "—",              icon:"📊" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-center hover:bg-white/8 transition-colors">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="text-xl font-bold text-darkText">{s.value}</p>
            <p className="text-xs text-darkTextGray mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Members list ─────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-darkText">Thành viên</h3>
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {members.length}
            </span>
          </div>
          <button onClick={openModal}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Thêm
          </button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-darkTextGray">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <p className="text-sm text-darkTextGray">Chưa có thành viên nào</p>
            <p className="text-xs text-darkTextGray/60 mt-1">Nhấn "+ Thêm" để chọn nhân viên</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors group">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(m.id)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                  {m.fullname?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-darkText truncate">{m.fullname}</p>
                  <p className="text-xs text-darkTextGray truncate">{m.email}</p>
                </div>
                {m.role?.name && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-white/8 text-darkTextGray border border-white/10 flex-shrink-0">
                    {m.role.name}
                  </span>
                )}
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs flex-shrink-0 ${
                  m.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                             : "bg-gray-500/10 border-gray-500/20 text-gray-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? "bg-emerald-400" : "bg-gray-400"}`}/>
                  {m.isActive ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => handleRemove(m)}
                  disabled={removingId === m.id}
                  className="p-1.5 rounded-lg text-darkTextGray hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  title="Xóa khỏi team"
                >
                  {removingId === m.id
                    ? <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Projects placeholder ─────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h3 className="text-sm font-semibold text-darkText">Dự án của team</h3>
          <Link to="/dashboard/projects" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            + Tạo dự án
          </Link>
        </div>
        <div className="text-center py-10">
          <p className="text-sm text-darkTextGray">Chưa có dự án</p>
          <p className="text-xs text-darkTextGray/60 mt-0.5">Tạo dự án để giao việc cho team</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODAL CHỌN NHÂN VIÊN TỪ DANH SÁCH
      ═══════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}/>

          <div className="relative w-full max-w-lg animate-slide-up">
            <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-white/8 backdrop-blur-2xl shadow-2xl shadow-black/60">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"/>

              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-darkText">Thêm thành viên vào team</h2>
                    <p className="text-xs text-darkTextGray mt-0.5">
                      Chọn nhân viên để thêm vào&nbsp;
                      <span className="text-blue-400 font-semibold">{team?.name}</span>
                    </p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-lg text-darkTextGray hover:text-darkText hover:bg-white/10 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-darkTextGray" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, email, vai trò..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl text-sm text-darkText placeholder-darkTextGray
                      bg-white/8 border border-white/10 focus:outline-none focus:border-blue-500/50 focus:bg-white/12 transition-all"
                  />
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-black/20">
                  {filteredAvailable.length === 0 ? (
                    <div className="text-center py-10 text-sm text-darkTextGray">
                      {searchQuery
                        ? "Không tìm thấy nhân viên phù hợp"
                        : available.length === 0
                          ? "Tất cả nhân viên đã trong team này"
                          : "Không có nhân viên nào"
                      }
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {filteredAvailable.map(user => (
                        <div key={user.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors group/row">
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(user.id)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                            {user.fullname?.charAt(0).toUpperCase()}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-darkText truncate">{user.fullname}</p>
                            <p className="text-xs text-darkTextGray truncate">{user.email}</p>
                          </div>
                          {/* Role */}
                          {user.role?.name && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-white/8 text-darkTextGray border border-white/10 flex-shrink-0">
                              {user.role.name}
                            </span>
                          )}
                          {/* Current dept */}
                          {user.department?.name && (
                            <span className="text-xs text-amber-400/80 flex-shrink-0 max-w-[80px] truncate" title={user.department.name}>
                              📌 {user.department.name}
                            </span>
                          )}
                          {/* Add button */}
                          <button
                            onClick={() => handleAdd(user)}
                            disabled={addingId === user.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white
                              bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500
                              disabled:opacity-40 disabled:cursor-not-allowed
                              opacity-0 group-hover/row:opacity-100
                              transition-all duration-150 flex-shrink-0"
                          >
                            {addingId === user.id
                              ? <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                  </svg>
                                  Thêm
                                </>
                            }
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer info */}
                <div className="mt-3 flex items-center justify-between text-xs text-darkTextGray">
                  <span>{filteredAvailable.length} nhân viên có thể thêm</span>
                  {members.length > 0 && (
                    <span className="text-blue-400">{members.length} đã trong team</span>
                  )}
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full mt-3 h-10 rounded-xl border border-white/10 bg-white/5 text-darkText text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamDetailPage;
