function BrandPanel() {
  const featureList = [
    "Quản lý nhân sự và phòng ban tập trung",
    "Theo dõi công việc và dự án theo thời gian thực",
    "Báo cáo doanh thu và phân tích trực quan",
    "Bảo mật dữ liệu doanh nghiệp chuẩn enterprise"
  ];

  return (
    <aside className="hidden lg:flex flex-col justify-between w-[480px] bg-darkCard border-r border-darkBorder text-darkText p-10 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-primaryBlue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-24 w-80 h-80 bg-accentPurple/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-accentCyan/5 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primaryBlue to-accentPurple flex items-center justify-center font-bold text-white text-sm">
            T
          </div>
          <div>
            <span className="text-base font-semibold text-darkText block leading-tight">TechCorp</span>
            <span className="text-[10px] text-darkTextGray">Enterprise Workspace</span>
          </div>
        </div>

        {/* Headline */}
        <div className="mt-14">
          <h1 className="text-3xl font-bold leading-tight text-darkText">
            Hệ thống quản lý
            <br />
            <span className="bg-gradient-to-r from-primaryBlue via-accentIndigo to-accentPurple bg-clip-text text-transparent">
              doanh nghiệp hiện đại
            </span>
          </h1>
          <p className="mt-4 text-darkTextGray text-sm leading-relaxed">
            Nền tảng SaaS giúp doanh nghiệp công nghệ vận hành hiệu quả — quản lý team, project, task trong một workspace thống nhất.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10">
        <ul className="space-y-3">
          {featureList.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-md bg-primaryBlue/10 flex items-center justify-center shrink-0">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primaryBlue"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-sm text-darkTextGray">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Stats */}
        <div className="mt-8 pt-6 border-t border-darkBorder grid grid-cols-3 gap-4">
          <div>
            <p className="text-lg font-bold text-darkText">128+</p>
            <p className="text-[10px] text-darkTextGray">Nhân viên</p>
          </div>
          <div>
            <p className="text-lg font-bold text-darkText">24</p>
            <p className="text-[10px] text-darkTextGray">Dự án</p>
          </div>
          <div>
            <p className="text-lg font-bold text-darkText">99.9%</p>
            <p className="text-[10px] text-darkTextGray">Uptime</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default BrandPanel;
