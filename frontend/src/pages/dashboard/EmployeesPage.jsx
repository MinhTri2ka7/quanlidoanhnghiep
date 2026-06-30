import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, getAllDepartments, createUser } from "../../utils/api.js";
import { useCurrentUser } from "../../utils/useCurrentUser.js";

const avatarGradients = [
  "from-blue-500 to-indigo-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
];
const getGradient = (id) => avatarGradients[(id || 0) % avatarGradients.length];

function EmployeesPage() {
  const { isAdmin } = useCurrentUser();
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams]         = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam]   = useState("all");

  // Modal thêm nhân viên mới
  const [isAddOpen, setIsAddOpen]     = useState(false);
  const [form, setForm]               = useState({
    email: "", fullname: "", phone: "", password: "password123", roleId: 1, departmentId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const emailRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, deptsData] = await Promise.all([getAllUsers(), getAllDepartments()]);

      const deptIcons = ["💻", "📢", "👥", "🎨", "🧪", "⚙️", "📊", "🚀"];
      setTeams(deptsData.map((d, i) => ({
        id: d.id, name: d.name, icon: deptIcons[i % deptIcons.length]
      })));

      setEmployees(usersData.map(u => ({
        id:             u.id,
        fullname:       u.fullname,
        email:          u.email,
        phone:          u.phone,
        roleName:       u.role?.name || "Nhân viên",
        departmentName: u.department?.name || "Chưa phân ban",
        isActive:       u.isActive,
      })));
    } catch (err) {
      setError(err.message || "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = employees.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchSearch = e.fullname.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.roleName.toLowerCase().includes(q);
    const matchTeam   = filterTeam === "all" || e.departmentName === filterTeam;
    return matchSearch && matchTeam;
  });

  function openAddModal() {
    setForm({ email: "", fullname: "", phone: "", password: "password123", roleId: 1, departmentId: "" });
    setSubmitError("");
    setSubmitSuccess(false);
    setIsAddOpen(true);
    setTimeout(() => emailRef.current?.focus(), 80);
  }

  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSubmitError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.fullname || !form.phone) {
      setSubmitError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        fullname:     form.fullname.trim(),
        email:        form.email.trim().toLowerCase(),
        phone:        form.phone.trim(),
        password:     form.password || "password123",
        roleId:       Number(form.roleId) || 1,
        ...(form.departmentId ? { departmentId: Number(form.departmentId) } : {}),
      };
      const created = await createUser(payload);

      // Thêm vào danh sách local
      setEmployees(prev => [{
        id:             created.id,
        fullname:       created.fullname,
        email:          created.email,
        phone:          created.phone,
        roleName:       created.role?.name || "Nhân viên",
        departmentName: created.department?.name || "Chưa phân ban",
        isActive:       created.isActive ?? true,
      }, ...prev]);

      setSubmitSuccess(true);
      setForm({ email: "", fullname: "", phone: "", password: "password123", roleId: 1, departmentId: "" });
    } catch (err) {
      setSubmitError(err.message || "Tạo nhân viên thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ─── Header ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-darkText">Nhân viên</h1>
          <p className="text-sm text-darkTextGray mt-1">
            {isLoading ? "Đang tải..." : `${employees.length} nhân viên trong workspace`}
          </p>
        </div>
        {isAdmin && (
          <button
            id="btn-add-employee"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold
              bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500
              shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Thêm nhân viên
          </button>
        )}
      </div>

      {/* ─── Filters ─────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[220px]">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-darkTextGray" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email, vai trò..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm text-darkText placeholder-darkTextGray
              bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[{ id: "all", name: "Tất cả", icon: "🏢" }, ...teams.map(t => ({ id: t.name, name: t.name, icon: t.icon }))].map(t => (
            <button
              key={t.id}
              onClick={() => setFilterTeam(t.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                filterTeam === t.id
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-white/5 text-darkTextGray border border-white/10 hover:bg-white/10"
              }`}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Loading / Error ─────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-blue-400">
          <svg className="animate-spin w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm">Đang tải nhân viên...</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">⚠️ {error}</div>
      )}

      {/* ─── Table ───────────────────────────────── */}
      {!isLoading && !error && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {["Nhân viên", "Team / Phòng ban", "Vai trò", "Trạng thái", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-darkTextGray">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-sm text-darkTextGray">
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                ) : filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                    {/* Avatar + name */}
                    <td className="px-5 py-4">
                      <Link to={`/dashboard/employees/${emp.id}`} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(emp.id)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                          {emp.fullname?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-darkText group-hover:text-blue-400 transition-colors">{emp.fullname}</p>
                          <p className="text-xs text-darkTextGray">{emp.email}</p>
                        </div>
                      </Link>
                    </td>
                    {/* Dept */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        💼 {emp.departmentName}
                      </span>
                    </td>
                    {/* Role */}
                    <td className="px-5 py-4 text-sm text-darkTextGray">{emp.roleName}</td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${emp.isActive ? "text-emerald-400" : "text-gray-400"}`}>
                        <span className={`w-2 h-2 rounded-full ${emp.isActive ? "bg-emerald-400" : "bg-gray-400"}`}/>
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <Link to={`/dashboard/employees/${emp.id}`}
                        className="text-xs text-blue-400 hover:underline opacity-0 group-hover:opacity-100 transition-all">
                        Chi tiết →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL THÊM NHÂN VIÊN MỚI BẰNG GMAIL
      ═══════════════════════════════════════════════════ */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h2 className="modal-title">Thêm nhân viên mới</h2>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Success */}
                {submitSuccess && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 8, background: "#10b98118", border: "1px solid #10b98130", marginBottom: 12 }}>
                    <svg width="15" height="15" style={{ color: "var(--success)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                    </svg>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--success)", fontWeight: 500 }}>Đã tạo nhân viên thành công!</p>
                  </div>
                )}

                {/* Error */}
                {submitError && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 8, background: "#ef444418", border: "1px solid #ef444430", marginBottom: 12 }}>
                    <svg width="15" height="15" style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--danger)" }}>{submitError}</p>
                  </div>
                )}

                <div>
                  <label className="field-label" htmlFor="emp-email">Gmail / Email <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="emp-email"
                    ref={emailRef}
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="ten@gmail.com"
                    required
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="emp-fullname">Họ và tên <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="emp-fullname"
                    type="text"
                    name="fullname"
                    value={form.fullname}
                    onChange={handleFormChange}
                    placeholder="Nguyễn Văn A"
                    required
                    className="field-input"
                  />
                </div>

                <div className="form-row-2">
                  <div>
                    <label className="field-label" htmlFor="emp-phone">Số điện thoại <span style={{ color: "var(--danger)" }}>*</span></label>
                    <input
                      id="emp-phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="0912345678"
                      required
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="emp-role">Vai trò</label>
                    <select
                      id="emp-role"
                      name="roleId"
                      value={form.roleId}
                      onChange={handleFormChange}
                      className="field-input"
                    >
                      <option value={1}>Employee</option>
                      <option value={2}>Manager</option>
                      <option value={3}>Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor="emp-dept">Phòng ban (tuỳ chọn)</label>
                  <select
                    id="emp-dept"
                    name="departmentId"
                    value={form.departmentId}
                    onChange={handleFormChange}
                    className="field-input"
                  >
                    <option value="">-- Chưa phân ban --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 8, background: "#3b82f610", border: "1px solid #3b82f620", marginTop: 8 }}>
                  <svg width="14" height="14" style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-2)", lineHeight: "1.4" }}>
                    Mật khẩu mặc định: <strong>password123</strong> — nhân viên có thể đổi sau khi đăng nhập.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 20px" }} disabled={isSubmitting}>
                  {isSubmitting ? "Đang tạo..." : "Tạo nhân viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeesPage;
