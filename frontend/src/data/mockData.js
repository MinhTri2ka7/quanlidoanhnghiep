// ============================================
// MOCK DATA - Cấu trúc phân cấp doanh nghiệp
// Workspace > Teams > Employees / Projects > Tasks
// ============================================

export const workspace = {
  id: "ws-001",
  name: "TechCorp Vietnam",
  logo: "T",
  plan: "Enterprise",
  createdAt: "2024-01-15",
  totalEmployees: 128,
  totalTeams: 6,
  totalProjects: 24,
  totalTasksCompleted: 847,
  revenue: "2.4B"
};

export const teams = [
  {
    id: "team-it",
    name: "IT / Engineering",
    shortName: "IT",
    icon: "💻",
    leader: "Nguyễn Văn A",
    leaderId: "emp-001",
    memberCount: 32,
    projectCount: 8,
    performance: 92,
    color: "from-primaryBlue to-accentIndigo",
    description: "Phát triển và vận hành hệ thống công nghệ"
  },
  {
    id: "team-marketing",
    name: "Marketing",
    shortName: "MKT",
    icon: "📢",
    leader: "Trần Thị B",
    leaderId: "emp-002",
    memberCount: 18,
    projectCount: 5,
    performance: 88,
    color: "from-accentPurple to-pink-500",
    description: "Chiến lược marketing và truyền thông"
  },
  {
    id: "team-hr",
    name: "Human Resources",
    shortName: "HR",
    icon: "👥",
    leader: "Lê Văn C",
    leaderId: "emp-003",
    memberCount: 12,
    projectCount: 3,
    performance: 85,
    color: "from-successGreen to-emerald-400",
    description: "Quản lý nhân sự và tuyển dụng"
  },
  {
    id: "team-design",
    name: "Design",
    shortName: "UI/UX",
    icon: "🎨",
    leader: "Phạm Thị D",
    leaderId: "emp-004",
    memberCount: 10,
    projectCount: 4,
    performance: 90,
    color: "from-warningAmber to-orange-400",
    description: "Thiết kế giao diện và trải nghiệm người dùng"
  },
  {
    id: "team-qa",
    name: "Quality Assurance",
    shortName: "QA",
    icon: "🧪",
    leader: "Hoàng Văn E",
    leaderId: "emp-005",
    memberCount: 8,
    projectCount: 2,
    performance: 94,
    color: "from-accentCyan to-blue-400",
    description: "Kiểm thử và đảm bảo chất lượng sản phẩm"
  },
  {
    id: "team-devops",
    name: "DevOps / Infrastructure",
    shortName: "DevOps",
    icon: "⚙️",
    leader: "Vũ Thị F",
    leaderId: "emp-006",
    memberCount: 6,
    projectCount: 2,
    performance: 96,
    color: "from-dangerRed to-rose-400",
    description: "Hạ tầng, CI/CD và vận hành hệ thống"
  }
];

export const employees = [
  { id: "emp-001", name: "Nguyễn Văn A", email: "nguyena@techcorp.vn", teamId: "team-it", role: "Team Lead", status: "online", avatar: "N", skills: ["Java", "Spring Boot", "AWS"], productivity: 95 },
  { id: "emp-002", name: "Trần Thị B", email: "tranb@techcorp.vn", teamId: "team-marketing", role: "Team Lead", status: "online", avatar: "T", skills: ["SEO", "Content", "Ads"], productivity: 88 },
  { id: "emp-003", name: "Lê Văn C", email: "lec@techcorp.vn", teamId: "team-hr", role: "Team Lead", status: "offline", avatar: "L", skills: ["Recruitment", "Training"], productivity: 82 },
  { id: "emp-004", name: "Phạm Thị D", email: "phamd@techcorp.vn", teamId: "team-design", role: "Team Lead", status: "online", avatar: "P", skills: ["Figma", "UI/UX", "Prototyping"], productivity: 91 },
  { id: "emp-005", name: "Hoàng Văn E", email: "hoange@techcorp.vn", teamId: "team-qa", role: "Team Lead", status: "away", avatar: "H", skills: ["Selenium", "Jest", "Cypress"], productivity: 93 },
  { id: "emp-006", name: "Vũ Thị F", email: "vuf@techcorp.vn", teamId: "team-devops", role: "Team Lead", status: "online", avatar: "V", skills: ["Docker", "K8s", "Terraform"], productivity: 96 },
  { id: "emp-007", name: "Đặng Văn G", email: "dangg@techcorp.vn", teamId: "team-it", role: "Senior Developer", status: "online", avatar: "Đ", skills: ["React", "Node.js"], productivity: 89 },
  { id: "emp-008", name: "Bùi Thị H", email: "buih@techcorp.vn", teamId: "team-it", role: "Junior Developer", status: "offline", avatar: "B", skills: ["JavaScript", "CSS"], productivity: 75 },
  { id: "emp-009", name: "Cao Văn I", email: "caoi@techcorp.vn", teamId: "team-it", role: "Backend Developer", status: "online", avatar: "C", skills: ["Python", "Django", "PostgreSQL"], productivity: 87 },
  { id: "emp-010", name: "Đinh Thị K", email: "dinhk@techcorp.vn", teamId: "team-marketing", role: "Content Writer", status: "online", avatar: "Đ", skills: ["Copywriting", "SEO"], productivity: 84 },
  { id: "emp-011", name: "Ngô Văn L", email: "ngol@techcorp.vn", teamId: "team-design", role: "UI Designer", status: "online", avatar: "N", skills: ["Figma", "Illustrator"], productivity: 88 },
  { id: "emp-012", name: "Mai Thị M", email: "maim@techcorp.vn", teamId: "team-qa", role: "QA Engineer", status: "away", avatar: "M", skills: ["Manual Testing", "Automation"], productivity: 86 }
];

export const projects = [
  { id: "proj-001", name: "Mobile App v2.0", teamId: "team-it", description: "Phát triển ứng dụng mobile phiên bản mới", progress: 72, memberIds: ["emp-001", "emp-007", "emp-008"], deadline: "2026-06-15", priority: "high", status: "active", taskCount: 24, taskCompleted: 17 },
  { id: "proj-002", name: "API Gateway Redesign", teamId: "team-it", description: "Tái cấu trúc hệ thống API gateway", progress: 45, memberIds: ["emp-001", "emp-009"], deadline: "2026-07-30", priority: "high", status: "active", taskCount: 18, taskCompleted: 8 },
  { id: "proj-003", name: "Brand Campaign Q2", teamId: "team-marketing", description: "Chiến dịch thương hiệu quý 2", progress: 60, memberIds: ["emp-002", "emp-010"], deadline: "2026-06-30", priority: "medium", status: "active", taskCount: 12, taskCompleted: 7 },
  { id: "proj-004", name: "Design System v3", teamId: "team-design", description: "Cập nhật design system mới", progress: 85, memberIds: ["emp-004", "emp-011"], deadline: "2026-06-01", priority: "medium", status: "active", taskCount: 15, taskCompleted: 13 },
  { id: "proj-005", name: "CI/CD Pipeline", teamId: "team-devops", description: "Thiết lập pipeline tự động hóa", progress: 100, memberIds: ["emp-006"], deadline: "2026-05-10", priority: "low", status: "completed", taskCount: 10, taskCompleted: 10 },
  { id: "proj-006", name: "Security Audit 2026", teamId: "team-qa", description: "Kiểm tra bảo mật toàn hệ thống", progress: 30, memberIds: ["emp-005", "emp-012"], deadline: "2026-08-20", priority: "high", status: "active", taskCount: 20, taskCompleted: 6 },
  { id: "proj-007", name: "Recruitment Portal", teamId: "team-hr", description: "Xây dựng cổng tuyển dụng nội bộ", progress: 55, memberIds: ["emp-003"], deadline: "2026-07-15", priority: "medium", status: "active", taskCount: 14, taskCompleted: 8 },
  { id: "proj-008", name: "Dashboard Analytics", teamId: "team-it", description: "Xây dựng hệ thống phân tích dữ liệu", progress: 90, memberIds: ["emp-007", "emp-009"], deadline: "2026-06-01", priority: "medium", status: "active", taskCount: 16, taskCompleted: 14 }
];

export const tasks = [
  { id: "task-001", title: "Thiết kế UI trang settings", projectId: "proj-004", assigneeId: "emp-011", teamId: "team-design", priority: "medium", status: "todo", labels: ["UI/UX"], deadline: "2026-06-20", comments: 3 },
  { id: "task-002", title: "Viết API endpoint users", projectId: "proj-002", assigneeId: "emp-001", teamId: "team-it", priority: "high", status: "todo", labels: ["Backend", "API"], deadline: "2026-06-18", comments: 5 },
  { id: "task-003", title: "Fix bug login session", projectId: "proj-001", assigneeId: "emp-009", teamId: "team-it", priority: "high", status: "inProgress", labels: ["Bug", "Auth"], deadline: "2026-06-17", comments: 8 },
  { id: "task-004", title: "Implement chat realtime", projectId: "proj-001", assigneeId: "emp-007", teamId: "team-it", priority: "medium", status: "inProgress", labels: ["Feature"], deadline: "2026-06-22", comments: 2 },
  { id: "task-005", title: "Optimize database queries", projectId: "proj-002", assigneeId: "emp-009", teamId: "team-it", priority: "low", status: "inProgress", labels: ["Performance"], deadline: "2026-06-25", comments: 1 },
  { id: "task-006", title: "Code review PR #142", projectId: "proj-001", assigneeId: "emp-001", teamId: "team-it", priority: "medium", status: "review", labels: ["Review"], deadline: "2026-06-16", comments: 12 },
  { id: "task-007", title: "Test payment flow", projectId: "proj-006", assigneeId: "emp-012", teamId: "team-qa", priority: "high", status: "review", labels: ["QA", "Payment"], deadline: "2026-06-17", comments: 4 },
  { id: "task-008", title: "Deploy staging v3.1", projectId: "proj-005", assigneeId: "emp-006", teamId: "team-devops", priority: "low", status: "done", labels: ["DevOps"], deadline: "2026-06-15", comments: 6 },
  { id: "task-009", title: "Update documentation", projectId: "proj-004", assigneeId: "emp-004", teamId: "team-design", priority: "low", status: "done", labels: ["Docs"], deadline: "2026-06-14", comments: 2 },
  { id: "task-010", title: "Viết content landing page", projectId: "proj-003", assigneeId: "emp-010", teamId: "team-marketing", priority: "medium", status: "inProgress", labels: ["Content"], deadline: "2026-06-20", comments: 3 },
  { id: "task-011", title: "Setup monitoring alerts", projectId: "proj-005", assigneeId: "emp-006", teamId: "team-devops", priority: "high", status: "done", labels: ["Monitoring"], deadline: "2026-06-12", comments: 4 },
  { id: "task-012", title: "Responsive mobile layout", projectId: "proj-001", assigneeId: "emp-008", teamId: "team-it", priority: "medium", status: "todo", labels: ["Frontend", "Mobile"], deadline: "2026-06-24", comments: 1 }
];

export const recentActivities = [
  { id: 1, userId: "emp-001", action: "hoàn thành task", target: "Fix login bug", targetType: "task", time: "2 phút trước" },
  { id: 2, userId: "emp-002", action: "tạo project mới", target: "Brand Campaign Q2", targetType: "project", time: "15 phút trước" },
  { id: 3, userId: "emp-009", action: "comment vào", target: "API Gateway Redesign", targetType: "project", time: "1 giờ trước" },
  { id: 4, userId: "emp-007", action: "cập nhật trạng thái", target: "Implement chat realtime", targetType: "task", time: "2 giờ trước" },
  { id: 5, userId: "emp-006", action: "deploy thành công", target: "Production v3.2.1", targetType: "deployment", time: "3 giờ trước" },
  { id: 6, userId: "emp-004", action: "upload file", target: "Design System v3", targetType: "project", time: "4 giờ trước" }
];

// Helper functions
export function getTeamById(teamId) {
  return teams.find((team) => team.id === teamId);
}

export function getEmployeeById(employeeId) {
  return employees.find((emp) => emp.id === employeeId);
}

export function getProjectById(projectId) {
  return projects.find((proj) => proj.id === projectId);
}

export function getEmployeesByTeam(teamId) {
  return employees.filter((emp) => emp.teamId === teamId);
}

export function getProjectsByTeam(teamId) {
  return projects.filter((proj) => proj.teamId === teamId);
}

export function getTasksByProject(projectId) {
  return tasks.filter((task) => task.projectId === projectId);
}

export function getTasksByTeam(teamId) {
  return tasks.filter((task) => task.teamId === teamId);
}

export function getTasksByEmployee(employeeId) {
  return tasks.filter((task) => task.assigneeId === employeeId);
}
