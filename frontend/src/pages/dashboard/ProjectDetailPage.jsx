import { useParams, Link } from "react-router-dom";
import { getProjectById, getTeamById, getTasksByProject, getEmployeeById } from "../../data/mockData.js";
import Breadcrumb from "../../components/dashboard/Breadcrumb.jsx";

function ProjectDetailPage() {
  const { projectId } = useParams();
  const project = getProjectById(projectId);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-darkTextGray">Dự án không tồn tại</p>
      </div>
    );
  }

  const team = getTeamById(project.teamId);
  const projectTasks = getTasksByProject(projectId);
  const members = project.memberIds.map((id) => getEmployeeById(id)).filter(Boolean);

  const breadcrumbItems = [
    { label: "Workspace", path: "/dashboard" },
    { label: team ? team.name : "Team", path: team ? `/dashboard/teams/${team.id}` : "/dashboard/teams" },
    { label: project.name, path: `/dashboard/projects/${projectId}` }
  ];

  const tasksByStatus = {
    todo: projectTasks.filter((t) => t.status === "todo"),
    inProgress: projectTasks.filter((t) => t.status === "inProgress"),
    review: projectTasks.filter((t) => t.status === "review"),
    done: projectTasks.filter((t) => t.status === "done")
  };

  function getPriorityStyle(priority) {
    if (priority === "high") return "bg-dangerRed/10 text-dangerRed";
    if (priority === "medium") return "bg-warningAmber/10 text-warningAmber";
    return "bg-successGreen/10 text-successGreen";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={breadcrumbItems} />

      {/* Project Header */}
      <div className="bg-darkCard border border-darkBorder rounded-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-darkText">{project.name}</h1>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityStyle(project.priority)}`}>
                {project.priority === "high" ? "Ưu tiên cao" : project.priority === "medium" ? "Trung bình" : "Thấp"}
              </span>
              {project.status === "completed" && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-successGreen/10 text-successGreen font-medium">Hoàn thành</span>
              )}
            </div>
            <p className="text-sm text-darkTextGray">{project.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-darkTextGray">
              {team && (
                <Link to={`/dashboard/teams/${team.id}`} className="flex items-center gap-1 hover:text-primaryBlue transition-colors">
                  <span>{team.icon}</span>
                  <span>{team.name}</span>
                </Link>
              )}
              <span>Deadline: {project.deadline}</span>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-primaryBlue text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            Quản lý
          </button>
        </div>

        {/* Progress */}
        <div className="mt-5 pt-5 border-t border-darkBorder">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-darkTextGray">Tiến độ tổng thể</span>
            <span className="text-sm font-semibold text-darkText">{project.progress}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-darkBorder overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${project.progress === 100 ? "bg-successGreen" : "bg-gradient-to-r from-primaryBlue to-accentIndigo"}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-darkTextGray">
            <span>{project.taskCompleted} / {project.taskCount} tasks hoàn thành</span>
            <span>{project.deadline}</span>
          </div>
        </div>
      </div>

      {/* Stats + Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Stats */}
        <div className="lg:col-span-2 grid grid-cols-4 gap-3">
          <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-darkTextGray">{tasksByStatus.todo.length}</p>
            <p className="text-xs text-darkTextGray mt-1">Todo</p>
          </div>
          <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-primaryBlue">{tasksByStatus.inProgress.length}</p>
            <p className="text-xs text-darkTextGray mt-1">In Progress</p>
          </div>
          <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-accentPurple">{tasksByStatus.review.length}</p>
            <p className="text-xs text-darkTextGray mt-1">Review</p>
          </div>
          <div className="bg-darkCard border border-darkBorder rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-successGreen">{tasksByStatus.done.length}</p>
            <p className="text-xs text-darkTextGray mt-1">Done</p>
          </div>
        </div>

        {/* Members */}
        <div className="bg-darkCard border border-darkBorder rounded-xl p-4">
          <h4 className="text-sm font-semibold text-darkText mb-3">Thành viên ({members.length})</h4>
          <div className="space-y-2">
            {members.map((member) => (
              <Link
                key={member.id}
                to={`/dashboard/employees/${member.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accentIndigo to-accentPurple flex items-center justify-center text-white text-[10px] font-medium">
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-darkText truncate">{member.name}</p>
                  <p className="text-[10px] text-darkTextGray">{member.role}</p>
                </div>
                <span className={`w-2 h-2 rounded-full ${member.status === "online" ? "bg-successGreen" : "bg-darkTextGray"}`} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div>
        <h3 className="text-base font-semibold text-darkText mb-4">Task Board</h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
            const statusConfig = {
              todo: { label: "Todo", color: "bg-darkTextGray" },
              inProgress: { label: "In Progress", color: "bg-primaryBlue" },
              review: { label: "Review", color: "bg-accentPurple" },
              done: { label: "Done", color: "bg-successGreen" }
            };
            const config = statusConfig[status];

            return (
              <div key={status} className="flex-shrink-0 w-[260px]">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                  <h4 className="text-sm font-medium text-darkText">{config.label}</h4>
                  <span className="ml-auto text-xs text-darkTextGray">{statusTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map((task) => {
                    const assignee = getEmployeeById(task.assigneeId);
                    return (
                      <div key={task.id} className="bg-darkCard border border-darkBorder rounded-xl p-3 hover:border-primaryBlue/30 transition-all">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {task.labels.map((label) => (
                            <span key={label} className="px-1.5 py-0.5 text-[10px] rounded bg-accentIndigo/10 text-accentIndigo">
                              {label}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-darkText mb-2">{task.title}</p>
                        <div className="flex items-center justify-between">
                          {assignee && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded bg-gradient-to-br from-accentIndigo to-accentPurple flex items-center justify-center text-white text-[8px] font-medium">
                                {assignee.avatar}
                              </div>
                              <span className="text-[10px] text-darkTextGray">{assignee.name.split(" ").pop()}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-darkTextGray">{task.deadline}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
