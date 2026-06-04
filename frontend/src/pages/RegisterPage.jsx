import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequired,
} from "../utils/validators.js";

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");

  const [feedback, setFeedback] = useState(null); // { msg, type }

  function togglePasswordVisibility() {
    setIsPasswordVisible(!isPasswordVisible);
  }

  function validateRegisterForm() {
    const nextFullNameError = validateRequired(fullName, "họ và tên");
    const nextEmailError = validateEmail(email);
    const nextPhoneError = validateRequired(phoneNumber, "số điện thoại");
    const nextPasswordError = validatePassword(password);
    const nextConfirmPasswordError = validateConfirmPassword(password, confirmPassword);
    const nextTermsError = agreedToTerms ? "" : "Vui lòng đồng ý với điều khoản sử dụng";

    setFullNameError(nextFullNameError);
    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setTermsError(nextTermsError);

    const hasAnyError =
      nextFullNameError || nextEmailError || nextPhoneError ||
      nextPasswordError || nextConfirmPasswordError || nextTermsError;

    return !hasAnyError;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback(null);

    const isFormValid = validateRegisterForm();
    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Gọi API gửi OTP về hòm thư Gmail của khách hàng
      const response = await fetch("http://localhost:8080/api/user/reg/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gửi mã xác minh (OTP) thất bại");
      }

      setFeedback({ msg: "Đã gửi mã xác nhận OTP về Gmail của bạn! Đang chuyển hướng...", type: "success" });

      // 2. Chuyển hướng người dùng tới màn hình nhập OTP kèm theo Router State chứa thông tin đăng ký
      setTimeout(() => {
        navigate("/otp-verify", {
          state: {
            registrationData: {
              fullname: fullName,
              email,
              phone: phoneNumber,
              password,
            }
          }
        });
      }, 1000);
    } catch (error) {
      setFeedback({ msg: error.message || "Gửi OTP thất bại", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const EyeIcon = ({ open }) => open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

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
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0 }}>Tạo tài khoản</h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
          Bắt đầu trải nghiệm hệ thống quản lý doanh nghiệp hiện đại.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === "success" ? "toast-success" : "toast-error"} style={{ marginBottom: 16 }}>
          {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Name + Phone grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="grid-cols-register">
          {/* Full Name */}
          <div>
            <label className="field-label" htmlFor="fullName">Họ và tên</label>
            <input
              id="fullName"
              className="field-input"
              type="text"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
            {fullNameError && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{fullNameError}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="field-label" htmlFor="phone">Số điện thoại</label>
            <input
              id="phone"
              className="field-input"
              type="tel"
              placeholder="0912 345 678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              autoComplete="tel"
            />
            {phoneError && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{phoneError}</p>}
          </div>
        </div>

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

        {/* Password + Confirm grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="grid-cols-register">
          {/* Password */}
          <div>
            <label className="field-label" htmlFor="password">Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                className="field-input"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 0,
                }}
                aria-label="Hiện hoặc ẩn mật khẩu"
              >
                <EyeIcon open={isPasswordVisible} />
              </button>
            </div>
            {passwordError && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{passwordError}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="field-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                id="confirmPassword"
                className="field-input"
                type={isConfirmPasswordVisible ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 0,
                }}
                aria-label="Hiện hoặc ẩn xác nhận mật khẩu"
              >
                <EyeIcon open={isConfirmPasswordVisible} />
              </button>
            </div>
            {confirmPasswordError && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{confirmPasswordError}</p>}
          </div>
        </div>

        {/* Terms checkbox */}
        <div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-2)", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: 2, width: 14, height: 14, accentColor: "var(--accent)", flexShrink: 0 }}
            />
            <span>
              Tôi đồng ý với{" "}
              <a href="#" style={{ color: "var(--accent)", textDecoration: "none" }}>Điều khoản</a>{" "}
              và{" "}
              <a href="#" style={{ color: "var(--accent)", textDecoration: "none" }}>Chính sách bảo mật</a>
            </span>
          </label>
          {termsError && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{termsError}</p>}
        </div>

        {/* Submit */}
        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: 4 }}>
          {isSubmitting ? "Đang xử lý..." : "Tạo tài khoản"}
        </button>
      </form>

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
        Đăng ký với Google
      </button>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)", marginTop: 24 }}>
        Đã có tài khoản?{" "}
        <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>Đăng nhập</Link>
      </p>

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", marginTop: 32 }}>
        © {new Date().getFullYear()} TechCorp Vietnam · Bảo mật chuẩn enterprise
      </p>
    </AuthLayout>
  );
}

export default RegisterPage;
