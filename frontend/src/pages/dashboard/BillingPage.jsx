const plans = [
  { name: "Starter", price: "Miễn phí", features: ["5 thành viên", "2 projects", "1GB storage", "Email support"], isCurrent: false },
  { name: "Pro", price: "499K/tháng", features: ["25 thành viên", "Unlimited projects", "10GB storage", "Priority support", "Analytics"], isCurrent: true },
  { name: "Enterprise", price: "1.999K/tháng", features: ["Unlimited thành viên", "Unlimited projects", "100GB storage", "24/7 support", "Advanced analytics", "Custom integrations", "SSO"], isCurrent: false }
];

const paymentHistory = [
  { id: 1, date: "01/05/2026", amount: "499,000đ", plan: "Pro", status: "paid", method: "Visa ****4242" },
  { id: 2, date: "01/04/2026", amount: "499,000đ", plan: "Pro", status: "paid", method: "Visa ****4242" },
  { id: 3, date: "01/03/2026", amount: "499,000đ", plan: "Pro", status: "paid", method: "Visa ****4242" },
  { id: 4, date: "01/02/2026", amount: "499,000đ", plan: "Pro", status: "paid", method: "Visa ****4242" }
];

function BillingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-darkText">Billing & Subscription</h1>
        <p className="text-sm text-darkTextGray mt-1">Quản lý gói dịch vụ và thanh toán</p>
      </div>

      {/* Current Plan */}
      <div className="bg-darkCard border border-primaryBlue/30 rounded-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-darkText">Gói Pro</h3>
              <span className="px-2 py-0.5 text-xs rounded-full bg-primaryBlue/10 text-primaryBlue font-medium">Đang sử dụng</span>
            </div>
            <p className="text-sm text-darkTextGray">Gia hạn tiếp theo: 01/06/2026</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-darkText">499K<span className="text-sm font-normal text-darkTextGray">/tháng</span></p>
          </div>
        </div>

        {/* Usage */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-darkBorder">
          <div>
            <p className="text-xs text-darkTextGray mb-1">Thành viên</p>
            <p className="text-sm font-medium text-darkText">18 / 25</p>
            <div className="w-full h-1.5 rounded-full bg-darkBorder mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-primaryBlue" style={{ width: "72%" }} />
            </div>
          </div>
          <div>
            <p className="text-xs text-darkTextGray mb-1">Storage</p>
            <p className="text-sm font-medium text-darkText">6.2GB / 10GB</p>
            <div className="w-full h-1.5 rounded-full bg-darkBorder mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-warningAmber" style={{ width: "62%" }} />
            </div>
          </div>
          <div>
            <p className="text-xs text-darkTextGray mb-1">Projects</p>
            <p className="text-sm font-medium text-darkText">24 / ∞</p>
            <div className="w-full h-1.5 rounded-full bg-darkBorder mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-successGreen" style={{ width: "30%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h3 className="text-base font-semibold text-darkText mb-4">Nâng cấp gói</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-darkCard border rounded-card p-6 transition-all duration-300
                ${plan.isCurrent ? "border-primaryBlue/50 ring-1 ring-primaryBlue/20" : "border-darkBorder hover:border-primaryBlue/30"}`}
            >
              <h4 className="text-base font-semibold text-darkText mb-1">{plan.name}</h4>
              <p className="text-xl font-bold text-darkText mb-4">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-darkTextGray">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-successGreen shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${plan.isCurrent
                    ? "bg-primaryBlue/10 text-primaryBlue cursor-default"
                    : "bg-primaryBlue text-white hover:bg-blue-700"}`}
                disabled={plan.isCurrent}
              >
                {plan.isCurrent ? "Gói hiện tại" : "Nâng cấp"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-darkCard border border-darkBorder rounded-card overflow-hidden">
        <div className="px-6 py-4 border-b border-darkBorder">
          <h3 className="text-base font-semibold text-darkText">Lịch sử thanh toán</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-darkBorder">
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">Ngày</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">Số tiền</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">Gói</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">Phương thức</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-darkTextGray uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder">
              {paymentHistory.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-3 text-sm text-darkText">{payment.date}</td>
                  <td className="px-6 py-3 text-sm font-medium text-darkText">{payment.amount}</td>
                  <td className="px-6 py-3 text-sm text-darkTextGray">{payment.plan}</td>
                  <td className="px-6 py-3 text-sm text-darkTextGray">{payment.method}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-successGreen/10 text-successGreen font-medium">
                      Đã thanh toán
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BillingPage;
