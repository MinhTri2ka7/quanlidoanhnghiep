import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../utils/useCurrentUser.js";
import Breadcrumb from "../../components/dashboard/Breadcrumb.jsx";
import * as api from "../../utils/api.js";

function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isRequestingFriend, setIsRequestingFriend] = useState(false);

  useEffect(() => {
    loadData();
  }, [employeeId]);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [empData, tasksData, projsData, friendsData, pendingData] = await Promise.all([
        api.getUserById(employeeId),
        api.getTasksByUser(employeeId).catch(() => []),
        api.getAllProjects().catch(() => []),
        api.getFriends().catch(() => []),
        api.getPendingFriendRequests().catch(() => []),
      ]);

      setEmployee(empData);
      setTasks(tasksData);
      
      // Filter projects that the employee is manager of, or is a member of
      const empProjs = projsData.filter(p => 
        p.managerId === Number(employeeId) || 
        p.members?.some(m => Number(m.id) === Number(employeeId))
      );
      setProjects(empProjs);

      setFriends(friendsData);
      setPendingRequests(pendingData);
    } catch (err) {
      console.error(err);
      setError(err.message || "Không thể tải thông tin nhân viên");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-blue-400">
        <svg className="animate-spin w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span className="text-sm">Đang tải thông tin nhân viên...</span>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">⚠️ {error || "Nhân viên không tồn tại"}</p>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const productivity = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const breadcrumbItems = [
    { label: "Workspace", path: "/dashboard" },
    { label: employee.departmentName || "Phòng ban", path: "/dashboard/teams" },
    { label: employee.fullname, path: `/dashboard/employees/${employeeId}` }
  ];

  // Check friendship status
  const isMe = currentUser && Number(currentUser.id) === Number(employeeId);
  const isAlreadyFriend = friends.some(f => Number(f.friend.id) === Number(employeeId));
  const hasIncomingRequest = pendingRequests.some(r => Number(r.friend.id) === Number(employeeId));

  async function handleStartChat() {
    try {
      const room = await api.createPrivateRoom(employee.id);
      navigate("/dashboard/chat", { state: { roomId: room.id } });
    } catch (err) {
      alert("Không thể nhắn tin: " + err.message);
    }
  }

  async function handleSendFriendRequest() {
    setIsRequestingFriend(true);
    try {
      await api.sendFriendRequest(employee.email);
      alert("Đã gửi lời mời kết bạn thành công!");
      setFriendRequestSent(true);
    } catch (err) {
      if (err.message && err.message.includes("đã gửi")) {
        setFriendRequestSent(true);
      } else {
        alert(err.message || "Lỗi khi gửi lời mời kết bạn");
      }
    } finally {
      setIsRequestingFriend(false);
    }
  }

  async function handleAcceptFriend() {
    const req = pendingRequests.find(r => Number(r.friend.id) === Number(employeeId));
    if (!req) return;
    try {
      await api.acceptFriendRequest(req.id);
      alert("Đã chấp nhận kết bạn!");
      loadData();
    } catch (err) {
      alert(err.message || "Lỗi khi đồng ý kết bạn");
    }
  }

  // Generate skills based on role to keep visual richness
  const getSkillsByRole = (role) => {
    if (!role) return ["Kỹ năng mềm", "Giao tiếp"];
    const r = role.toLowerCase();
    if (r.includes("admin")) return ["Quản trị dự án", "Bảo mật", "Lập kế hoạch", "Quản lý nhân sự"];
    if (r.includes("manager")) return ["Quản lý đội ngũ", "Agile/Scrum", "Lập kế hoạch", "Đàm phán"];
    if (r.includes("dev") || r.includes("kỹ sư") || r.includes("eng")) return ["Java", "Spring Boot", "MySQL", "React", "Git", "RESTful API"];
    if (r.includes("design") || r.includes("designer")) return ["Figma", "UI/UX", "Prototyping", "Photoshop", "Wireframing"];
    if (r.includes("qa") || r.includes("test")) return ["Manual Testing", "Automation Testing", "Selenium", "JUnit", "Bug Tracking"];
    if (r.includes("market") || r.includes("mkt")) return ["SEO", "Content Marketing", "Social Media", "Google Analytics"];
    return ["Kỹ năng chuyên môn", "Giải quyết vấn đề", "Làm việc nhóm"];
  };

  const skills = getSkillsByRole(employee.roleName);

  function getStatusColor(isActive) {
    return isActive ? "bg-successGreen" : "bg-darkTextGray";
  }

  function getStatusLabel(isActive) {
    return isActive ? "Hoạt động" : "Ngưng hoạt động";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={breadcrumbItems} />

      {/* Employee Header */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accentIndigo to-accentPurple flex items-center justify-center text-white text-xl font-bold">
              {employee.fullname ? employee.fullname[0].toUpperCase() : "?"}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-3 border-darkCard ${getStatusColor(employee.isActive)}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-darkText">{employee.fullname}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${employee.isActive ? "bg-successGreen/10 text-successGreen" : "bg-darkBorder text-darkTextGray"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(employee.isActive)}`} />
                {getStatusLabel(employee.isActive)}
              </span>
            </div>
            <p className="text-sm text-darkTextGray mt-1">{employee.email}</p>
            {employee.phone && <p className="text-xs text-darkTextGray mt-0.5">SĐT: {employee.phone}</p>}
            <div className="flex items-center gap-3 mt-3">
              <span className="px-2.5 py-1 text-xs rounded-lg bg-primaryBlue/10 text-primaryBlue font-medium">
                {employee.roleName || "Nhân viên"}
              </span>
              {employee.departmentName && (
                <span className="px-2.5 py-1 text-xs rounded-lg bg-accentPurple/10 text-accentPurple font-medium">
                  🏢 {employee.departmentName}
                </span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isMe && (
              <>
                {isAlreadyFriend ? (
                  <button
                    onClick={handleStartChat}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
                  >
                    💬 Nhắn tin
                  </button>
                ) : hasIncomingRequest ? (
                  <button
                    onClick={handleAcceptFriend}
                    className="px-4 py-2 rounded-xl bg-successGreen hover:bg-successGreen/80 text-white text-sm font-semibold transition-colors"
                  >
                    🤝 Đồng ý kết bạn
                  </button>
                ) : friendRequestSent ? (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-darkBg border border-darkBorder text-sm text-darkTextGray cursor-not-allowed"
                  >
                    ✉️ Đã gửi lời mời
                  </button>
                ) : (
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={isRequestingFriend}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm font-semibold transition-colors"
                  >
                    {isRequestingFriend ? "Đang gửi..." : "➕ Kết bạn"}
                  </button>
                )}
              </>
            )}
            {isMe && (
              <span className="px-4 py-2 rounded-xl bg-darkBg border border-darkBorder text-sm text-darkTextGray">
                Đây là bạn
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkText">{productivity}%</p>
          <p className="text-xs text-darkTextGray mt-1">Hiệu suất (Task xong)</p>
        </div>
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkText">{projects.length}</p>
          <p className="text-xs text-darkTextGray mt-1">Dự án tham gia</p>
        </div>
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkText">{activeTasks.length}</p>
          <p className="text-xs text-darkTextGray mt-1">Tasks đang làm</p>
        </div>
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-successGreen">{completedTasks.length}</p>
          <p className="text-xs text-darkTextGray mt-1">Task hoàn thành</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="bg-darkCard border border-darkBorder rounded-card p-6">
          <h3 className="text-base font-semibold text-darkText mb-4">Kỹ năng</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="px-3 py-1.5 text-xs rounded-lg bg-accentIndigo/10 text-accentIndigo font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Assigned Projects */}
        <div className="bg-darkCard border border-darkBorder rounded-card p-6">
          <h3 className="text-base font-semibold text-darkText mb-4">Dự án tham gia</h3>
          <div className="space-y-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/dashboard/projects/${project.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-darkText">{project.name}</p>
                  <p className="text-xs text-darkTextGray">
                    {project.managerName ? `PM: ${project.managerName}` : "Chưa có PM"} • {project.progress || 0}% hoàn thành
                  </p>
                </div>
                <div className="w-16 h-1.5 rounded-full bg-darkBorder overflow-hidden">
                  <div className="h-full rounded-full bg-primaryBlue" style={{ width: `${project.progress || 0}%` }} />
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-darkTextGray text-center py-4">Chưa tham gia dự án nào</p>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <h3 className="text-base font-semibold text-darkText mb-4">Tasks được giao</h3>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${task.status === "done" ? "bg-successGreen" : task.status === "inProgress" ? "bg-primaryBlue" : task.status === "review" ? "bg-accentPurple" : "bg-darkTextGray"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-darkText">{task.title}</p>
                <p className="text-xs text-darkTextGray">
                  Dự án: {task.projectName || "Không thuộc dự án"} • Hạn chót: {task.deadline ? new Date(task.deadline).toLocaleDateString("vi-VN") : "Không có"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {task.priority && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded bg-darkBorder/50 font-medium ${task.priority === "high" ? "text-red-400" : task.priority === "medium" ? "text-amber-400" : "text-green-400"}`}>
                    {task.priority.toUpperCase()}
                  </span>
                )}
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-darkBorder/50 text-darkTextGray">
                  {task.status}
                </span>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-darkTextGray text-center py-4">Chưa có task nào</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetailPage;
