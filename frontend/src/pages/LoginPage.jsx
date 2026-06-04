import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { validateEmail, validatePassword } from "../utils/validators.js";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [feedback, setFeedback] = useState(null); // { msg, type }

  // 2FA States
  const [show2faInput, setShow2faInput] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  function validate() {
    const ee = validateEmail(email);
    const pe = validatePassword(password);
    setEmailError(ee);
    setPasswordError(pe);
    return !ee && !pe;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { loginUser } = await import("../utils/api.js");
      const userData = await loginUser(email, password);

      if (userData.twoFactorRequired) {
        setShow2faInput(true);
        setFeedback({ msg: "Tài khoản bảo mật cao. Vui lòng cung cấp mã 2FA.", type: "success" });
        return;
      }

      localStorage.setItem("user", JSON.stringify(userData));
      setFeedback({ msg: "Đăng nhập thành công. Đang chuyển hướng...", type: "success" });
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      setFeedback({ msg: err.message || "Email hoặc mật khẩu không đúng", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handle2faSubmit(e) {
    e.preventDefault();
    setFeedback(null);
    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      setFeedback({ msg: "Vui lòng nhập mã OTP gồm 6 chữ số", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { verify2faLogin } = await import("../utils/api.js");
      const userData = await verify2faLogin(email, twoFactorCode.trim());
      localStorage.setItem("user", JSON.stringify(userData));
      setFeedback({ msg: "Xác thực 2FA thành công. Đang kết nối...", type: "success" });
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      setFeedback({ msg: err.message || "Mã xác thực 2FA không chính xác", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      {/* Mobile logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }} className="lg:hidden">
        <div style={{
          width: 28, height: 28, background: "var(--accent)",
          borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 13,
        }}>T</div>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>TechCorp Vietnam</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          {show2faInput ? "Xác thực 2 yếu tố" : "Đăng nhập"}
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
          {show2faInput
            ? "Mở ứng dụng Google Authenticator để lấy mã xác minh"
            : "Nhập thông tin tài khoản để tiếp tục"}
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === "success" ? "toast-success" : "toast-error"} style={{ marginBottom: 16 }}>
          {feedback.msg}
        </div>
      )}

      {show2faInput ? (
        /* Form nhập mã 2FA */
        <form onSubmit={handle2faSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="field-label" htmlFor="twoFactorCode">Mã xác thực 2FA (6 số)</label>
            <input
              id="twoFactorCode"
              className="field-input"
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={6}
              placeholder="000 000"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ""))}
              style={{
                textAlign: "center",
                fontSize: 22,
                letterSpacing: 8,
                fontWeight: "bold",
                fontFamily: "monospace",
                height: 48,
                padding: "4px 0",
              }}
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Đang xác thực..." : "Xác minh & Đăng nhập"}
          </button>

          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setShow2faInput(false);
              setFeedback(null);
              setTwoFactorCode("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 0",
              fontWeight: 500,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.8)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Quay lại trang mật khẩu
          </button>
        </form>
      ) : (
        /* Form đăng nhập thông thường */
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Email */}
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="field-input"
              type="email"
              placeholder="ban@congty.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {emailError && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{emailError}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="field-label" htmlFor="password">Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                className="field-input"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 0,
                }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{passwordError}</p>}
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: "var(--accent)" }}
              />
              Ghi nhớ đăng nhập
            </label>
            <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: 4 }}>
            {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      )}

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <div className="divider" style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>hoặc</span>
        <div className="divider" style={{ flex: 1 }} />
      </div>

      {/* Google */}
      <button className="btn-secondary" style={{ width: "100%", height: 40, gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Tiếp tục với Google
      </button>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)", marginTop: 24 }}>
        Chưa có tài khoản?{" "}
        <Link to="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>Tạo tài khoản</Link>
      </p>

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", marginTop: 32 }}>
        © {new Date().getFullYear()} TechCorp Vietnam · Bảo mật chuẩn enterprise
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
