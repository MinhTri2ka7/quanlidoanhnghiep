import { useState, useEffect } from "react";
import { setup2fa, enable2fa, disable2fa } from "../../utils/api.js";

const tabs = [
  { id: "general",      label: "Chung"     },
  { id: "workspace",    label: "Workspace" },
  { id: "security",     label: "Bảo mật"  },
  { id: "notification", label: "Thông báo"},
  { id: "appearance",   label: "Giao diện"},
];

const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 };
const row  = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 8 };

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Cài đặt</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, padding: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "5px 14px", borderRadius: 7, fontSize: 13, cursor: "pointer", border: "none",
            background: activeTab === t.id ? "var(--accent)" : "transparent",
            color: activeTab === t.id ? "#fff" : "var(--text-2)",
            fontWeight: activeTab === t.id ? 500 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === "general"      && <GeneralSettings />}
      {activeTab === "workspace"    && <WorkspaceSettings />}
      {activeTab === "security"     && <SecuritySettings />}
      {activeTab === "notification" && <NotificationSettings />}
      {activeTab === "appearance"   && <AppearanceSettings />}
    </div>
  );
}

function GeneralSettings() {
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  return (
    <div style={card}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>Thông tin cá nhân</p>

      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 52, height: 52, borderRadius: 10, background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 }}>
          {user ? (user.fullname || user.email || "?")[0].toUpperCase() : "A"}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{user?.fullname || "Admin User"}</p>
          <p style={{ fontSize: 12, color: "var(--text-2)" }}>{user?.email || "admin@company.com"}</p>
          <button style={{ marginTop: 4, fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Đổi avatar</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Họ và tên", val: user?.fullname || "Admin User", type: "text" },
          { label: "Email",     val: user?.email || "admin@company.com", type: "email" },
          { label: "Số điện thoại", val: user?.phone || "0912 345 678", type: "tel" },
          { label: "Vai trò",   val: user?.roleName || "Admin", type: "text" },
        ].map(f => (
          <div key={f.label}>
            <label className="field-label">{f.label}</label>
            <input className="field-input" type={f.type} defaultValue={f.val} />
          </div>
        ))}
      </div>

      <button className="btn-primary" style={{ width: "auto", padding: "0 20px" }}>Lưu thay đổi</button>
    </div>
  );
}

function WorkspaceSettings() {
  return (
    <div style={card}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>Cài đặt Workspace</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label className="field-label">Tên workspace</label>
          <input className="field-input" type="text" defaultValue="QuanLyDN Production" />
        </div>
        <div>
          <label className="field-label">URL slug</label>
          <input className="field-input" type="text" defaultValue="quanlydn-prod" />
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label className="field-label">Mô tả</label>
        <textarea className="field-input" defaultValue="Workspace chính cho hệ thống quản lý doanh nghiệp" rows={3}
          style={{ height: "auto", padding: "10px 12px", resize: "none" }} />
      </div>
      <button className="btn-primary" style={{ width: "auto", padding: "0 20px" }}>Lưu thay đổi</button>
    </div>
  );
}

function SecuritySettings() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(!!user.isTwoFactorEnabled);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState(null); // { secret, qrCodeUrl }
  const [verificationCode, setVerificationCode] = useState("");

  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const [feedback, setFeedback] = useState(null); // { msg, type }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleToggle2fa() {
    setFeedback(null);
    if (isTwoFactorEnabled) {
      // Muốn tắt -> Hiển thị form nhập mã xác nhận tắt
      setShowDisableConfirm(true);
      setShowSetup(false);
    } else {
      // Muốn bật -> Gọi API sinh setup key & QR
      setIsSubmitting(true);
      try {
        const res = await setup2fa(user.id);
        setSetupData(res);
        setShowSetup(true);
        setShowDisableConfirm(false);
      } catch (err) {
        setFeedback({ msg: err.message || "Không thể khởi tạo thiết lập 2FA", type: "error" });
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  async function handleEnable2fa(e) {
    e.preventDefault();
    setFeedback(null);
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setFeedback({ msg: "Vui lòng nhập mã OTP gồm 6 chữ số", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await enable2fa(user.id, setupData.secret, verificationCode.trim());
      // Lưu user mới vào localStorage
      const updatedUser = { ...user, isTwoFactorEnabled: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsTwoFactorEnabled(true);
      setShowSetup(false);
      setSetupData(null);
      setVerificationCode("");
      setFeedback({ msg: "Kích hoạt xác thực 2 lớp (2FA) thành công!", type: "success" });
    } catch (err) {
      setFeedback({ msg: err.message || "Mã xác thực không đúng", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDisable2fa(e) {
    e.preventDefault();
    setFeedback(null);
    if (!disableCode || disableCode.trim().length !== 6) {
      setFeedback({ msg: "Vui lòng nhập mã OTP gồm 6 chữ số", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await disable2fa(user.id, disableCode.trim());
      const updatedUser = { ...user, isTwoFactorEnabled: false };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsTwoFactorEnabled(false);
      setShowDisableConfirm(false);
      setDisableCode("");
      setFeedback({ msg: "Đã hủy kích hoạt xác thực 2 lớp (2FA).", type: "success" });
    } catch (err) {
      setFeedback({ msg: err.message || "Mã xác thực không đúng", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopySecret() {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={card}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>Bảo mật tài khoản</p>

      {feedback && (
        <div className={feedback.type === "success" ? "toast-success" : "toast-error"} style={{ marginBottom: 16 }}>
          {feedback.msg}
        </div>
      )}

      {/* Dòng kích hoạt 2FA */}
      <div style={{ ...row, marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Xác thực 2 bước (2FA)</p>
          <p style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>
            {isTwoFactorEnabled 
              ? "Trạng thái: ĐÃ BẬT. Tài khoản của bạn được bảo vệ bằng ứng dụng Authenticator." 
              : "Bảo vệ tài khoản bằng mã OTP từ ứng dụng Google Authenticator."}
          </p>
        </div>
        <button 
          onClick={handleToggle2fa} 
          disabled={isSubmitting}
          style={{
            position: "relative", width: 40, height: 22, borderRadius: 99, border: "none", cursor: "pointer",
            background: isTwoFactorEnabled ? "var(--accent)" : "var(--border)", flexShrink: 0, transition: "background 0.2s"
          }}
        >
          <span style={{ 
            position: "absolute", top: 3, left: isTwoFactorEnabled ? 21 : 3, width: 16, height: 16,
            borderRadius: "50%", background: "#fff", transition: "left 0.2s" 
          }} />
        </button>
      </div>

      {/* Form cấu hình 2FA (Bật) */}
      {showSetup && setupData && (
        <div style={{
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 20,
          marginBottom: 20,
          background: "var(--surface-2)",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Cấu hình Google Authenticator</p>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
            {/* QR Code */}
            <div style={{
              background: "#fff",
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 140,
              height: 140
            }}>
              <img 
                src={setupData.qrCodeUrl} 
                alt="2FA QR Code" 
                style={{ width: "100%", height: "100%", objectFit: "contain" }} 
              />
            </div>

            {/* Hướng dẫn và Setup Key */}
            <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
                1. Dùng ứng dụng Google Authenticator trên điện thoại để quét mã QR bên cạnh.<br />
                2. Hoặc nhập mã khóa bảo mật dưới đây một cách thủ công nếu không quét được QR:
              </p>
              
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ 
                  fontFamily: "monospace", 
                  background: "var(--surface)", 
                  padding: "6px 12px", 
                  borderRadius: 6, 
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  fontWeight: "bold",
                  color: "var(--text)"
                }}>{setupData.secret}</span>
                <button 
                  onClick={handleCopySecret}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: 500
                  }}
                >
                  {copied ? "Đã copy!" : "Copy Key"}
                </button>
              </div>
            </div>
          </div>

          {/* Form nhập mã kích hoạt */}
          <form onSubmit={handleEnable2fa} style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>
              3. Nhập mã OTP gồm 6 chữ số từ ứng dụng Authenticator để kích hoạt:
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <input 
                type="text" 
                maxLength={6} 
                placeholder="000000"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="field-input"
                style={{ 
                  width: 140, 
                  textAlign: "center", 
                  letterSpacing: 4, 
                  fontFamily: "monospace", 
                  fontWeight: "bold",
                  fontSize: 16
                }}
              />
              <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 20px" }} disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Xác minh & Kích hoạt"}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowSetup(false);
                  setSetupData(null);
                  setVerificationCode("");
                }} 
                className="btn-secondary" 
                style={{ width: "auto", padding: "0 20px" }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Form hủy kích hoạt 2FA */}
      {showDisableConfirm && (
        <div style={{
          border: "1px solid var(--danger)",
          borderRadius: 8,
          padding: 20,
          marginBottom: 20,
          background: "var(--surface-2)",
          display: "flex",
          flexDirection: "column",
          gap: 14
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", margin: 0 }}>Xác nhận tắt 2FA</p>
          <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
            Để đảm bảo an toàn bảo mật tài khoản, vui lòng nhập mã OTP 6 chữ số từ ứng dụng Google Authenticator hiện tại để xác nhận tắt tính năng này.
          </p>

          <form onSubmit={handleDisable2fa} style={{ display: "flex", gap: 12 }}>
            <input 
              type="text" 
              maxLength={6} 
              placeholder="000000"
              value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="field-input"
              style={{ 
                width: 140, 
                textAlign: "center", 
                letterSpacing: 4, 
                fontFamily: "monospace", 
                fontWeight: "bold",
                fontSize: 16
              }}
            />
            <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 20px", background: "var(--danger)", border: "none" }} disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận tắt"}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowDisableConfirm(false);
                setDisableCode("");
              }} 
              className="btn-secondary" 
              style={{ width: "auto", padding: "0 20px" }}
            >
              Hủy
            </button>
          </form>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <button className="btn-secondary">Đổi mật khẩu</button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const items = [
    { label: "Task được giao",   sub: "Thông báo khi có task mới được giao",     on: true  },
    { label: "Mention",          sub: "Thông báo khi ai đó mention bạn",          on: true  },
    { label: "Deadline sắp đến", sub: "Nhắc nhở trước deadline 24h",              on: true  },
    { label: "Email digest",     sub: "Tổng hợp hoạt động hàng ngày qua email",  on: false },
  ];

  return (
    <div style={card}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>Thông báo</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <div key={item.label} style={row}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{item.label}</p>
              <p style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>{item.sub}</p>
            </div>
            <Toggle defaultChecked={item.on} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    function onExt(e) { if (e.detail && e.detail !== theme) setTheme(e.detail); }
    window.addEventListener("theme-change", onExt);
    return () => window.removeEventListener("theme-change", onExt);
  }, [theme]);

  function changeTheme(t) {
    setTheme(t);
    localStorage.setItem("theme", t);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: t }));
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }

  const themeOpts = [
    { id: "light", label: "Sáng",    dot: "#fff", border: "#E4E7EF" },
    { id: "dark",  label: "Tối",     dot: "#0D1117", border: "#21262D" },
  ];

  return (
    <div style={card}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>Giao diện</p>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 10 }}>Theme</p>
        <div style={{ display: "flex", gap: 8 }}>
          {themeOpts.map(o => (
            <button key={o.id} onClick={() => changeTheme(o.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
              borderRadius: 8, fontSize: 13, cursor: "pointer",
              border: theme === o.id ? `2px solid var(--accent)` : "1px solid var(--border)",
              background: theme === o.id ? "var(--accent-bg)" : "var(--surface)",
              color: theme === o.id ? "var(--accent)" : "var(--text-2)",
              fontWeight: theme === o.id ? 600 : 400,
            }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: o.dot, border: `1px solid ${o.border}`, display: "inline-block" }} />
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...row }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Thu gọn sidebar mặc định</p>
          <p style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>Sidebar ở trạng thái thu gọn khi mở app</p>
        </div>
        <Toggle defaultChecked={false} />
      </div>
    </div>
  );
}

function Toggle({ defaultChecked }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button onClick={() => setOn(!on)} role="switch" aria-checked={on}
      style={{ position: "relative", width: 40, height: 22, borderRadius: 99, border: "none", cursor: "pointer",
        background: on ? "var(--accent)" : "var(--border)", flexShrink: 0, transition: "background 0.2s" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16,
        borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

export default SettingsPage;
