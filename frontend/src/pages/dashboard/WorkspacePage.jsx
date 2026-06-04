import { useState } from "react";

const workspaces = [
  { id: 1, name: "QuanLyDN Production", members: 45, projects: 12, status: "active", plan: "Enterprise" },
  { id: 2, name: "Dev Testing", members: 8, projects: 3, status: "active", plan: "Pro" },
  { id: 3, name: "Design Team", members: 6, projects: 5, status: "active", plan: "Pro" }
];

function WorkspacePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-darkText">Workspace</h1>
          <p className="text-sm text-darkTextGray mt-1">Quản lý các workspace của bạn</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primaryBlue text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tạo Workspace
        </button>
      </div>

      {/* Workspace Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="bg-darkCard border border-darkBorder rounded-card p-6 hover:border-primaryBlue/30 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primaryBlue to-accentPurple flex items-center justify-center text-white font-bold">
                {workspace.name.charAt(0)}
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-successGreen/10 text-successGreen font-medium">
                {workspace.plan}
              </span>
            </div>
            <h3 className="text-base font-semibold text-darkText mb-1">{workspace.name}</h3>
            <div className="flex items-center gap-4 mt-3 text-sm text-darkTextGray">
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                {workspace.members}
              </span>
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {workspace.projects} projects
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-darkBorder flex items-center gap-2">
              <button className="flex-1 py-2 text-xs font-medium text-primaryBlue bg-primaryBlue/10 rounded-lg hover:bg-primaryBlue/20 transition-colors">
                Mở
              </button>
              <button className="flex-1 py-2 text-xs font-medium text-darkTextGray bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                Cài đặt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkspacePage;
