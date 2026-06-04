import { useParams, Link } from "react-router-dom";
import { getEmployeeById, getTeamById, getTasksByEmployee, projects } from "../../data/mockData.js";
import Breadcrumb from "../../components/dashboard/Breadcrumb.jsx";

function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const employee = getEmployeeById(employeeId);

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-darkTextGray">Nhân viên không tồn tại</p>
      </div>
    );
  }

  const team = getTeamById(employee.teamId);
  const employeeTasks = getTasksByEmployee(employeeId);
  const employeeProjects = projects.filter((proj) => proj.memberIds.includes(employeeId));

  const breadcrumbItems = [
    { label: "Workspace", path: "/dashboard" },
    { label: team ? team.name : "Team", path: team ? `/dashboard/teams/${team.id}` : "/dashboard/teams" },
    { label: employee.name, path: `/dashboard/employees/${employeeId}` }
  ];

  const activeTasks = employeeTasks.filter((t) => t.status !== "done");
  const completedTasks = employeeTasks.filter((t) => t.status === "done");

  function getStatusColor(status) {
    if (status === "online") return "bg-successGreen";
    if (status === "away") return "bg-warningAmber";
    return "bg-darkTextGray";
  }

  function getStatusLabel(status) {
    if (status === "online") return "Online";
    if (status === "away") return "Away";
    return "Offline";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={breadcrumbItems} />

      {/* Employee Header */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accentIndigo to-accentPurple flex items-center justify-center text-white text-xl font-bold">
              {employee.avatar}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-3 border-darkCard ${getStatusColor(employee.status)}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-darkText">{employee.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${employee.status === "online" ? "bg-successGreen/10 text-successGreen" : employee.status === "away" ? "bg-warningAmber/10 text-warningAmber" : "bg-darkBorder text-darkTextGray"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(employee.status)}`} />
                {getStatusLabel(employee.status)}
              </span>
            </div>
            <p className="text-sm text-darkTextGray mt-1">{employee.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="px-2.5 py-1 text-xs rounded-lg bg-primaryBlue/10 text-primaryBlue font-medium">
                {employee.role}
              </span>
              {team && (
                <Link
                  to={`/dashboard/teams/${team.id}`}
                  className="px-2.5 py-1 text-xs rounded-lg bg-accentPurple/10 text-accentPurple font-medium hover:bg-accentPurple/20 transition-colors"
                >
                  {team.icon} {team.shortName}
                </Link>
              )}
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-darkBg border border-darkBorder text-sm text-darkText hover:border-primaryBlue/50 transition-colors">
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkText">{employee.productivity}%</p>
          <p className="text-xs text-darkTextGray mt-1">Năng suất</p>
        </div>
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkText">{employeeProjects.length}</p>
          <p className="text-xs text-darkTextGray mt-1">Dự án</p>
        </div>
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-darkText">{activeTasks.length}</p>
          <p className="text-xs text-darkTextGray mt-1">Tasks đang làm</p>
        </div>
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-successGreen">{completedTasks.length}</p>
          <p className="text-xs text-darkTextGray mt-1">Hoàn thành</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="bg-darkCard border border-darkBorder rounded-card p-6">
          <h3 className="text-base font-semibold text-darkText mb-4">Kỹ năng</h3>
          <div className="flex flex-wrap gap-2">
            {employee.skills.map((skill) => (
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
            {employeeProjects.map((project) => {
              const projectTeam = getTeamById(project.teamId);
              return (
                <Link
                  key={project.id}
                  to={`/dashboard/projects/${project.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-darkText">{project.name}</p>
                    <p className="text-xs text-darkTextGray">{projectTeam ? projectTeam.shortName : ""} • {project.progress}% hoàn thành</p>
                  </div>
                  <div className="w-16 h-1.5 rounded-full bg-darkBorder overflow-hidden">
                    <div className="h-full rounded-full bg-primaryBlue" style={{ width: `${project.progress}%` }} />
                  </div>
                </Link>
              );
            })}
            {employeeProjects.length === 0 && (
              <p className="text-sm text-darkTextGray text-center py-4">Chưa tham gia dự án nào</p>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <h3 className="text-base font-semibold text-darkText mb-4">Tasks được giao</h3>
        <div className="space-y-2">
          {employeeTasks.map((task) => {
            const project = projects.find((p) => p.id === task.projectId);
            return (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${task.status === "done" ? "bg-successGreen" : task.status === "inProgress" ? "bg-primaryBlue" : task.status === "review" ? "bg-accentPurple" : "bg-darkTextGray"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-darkText">{task.title}</p>
                  <p className="text-xs text-darkTextGray">
                    {project ? project.name : "Unknown"} • {task.deadline}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {task.labels.map((label) => (
                    <span key={label} className="px-1.5 py-0.5 text-[10px] rounded bg-darkBorder/50 text-darkTextGray">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {employeeTasks.length === 0 && (
            <p className="text-sm text-darkTextGray text-center py-4">Chưa có task nào</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetailPage;
