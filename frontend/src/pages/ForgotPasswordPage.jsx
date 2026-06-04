import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { validateEmail } from "../utils/validators.js";

const STEP_EMAIL = "EMAIL";
const STEP_SENT  = "SENT";

function ForgotPasswordPage() {
  const [step, setStep]         = useState(STEP_EMAIL);
  const [email, setEmail]       = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(STEP_SENT);
      setFeedback({ msg: `Đã gửi liên kết khôi phục đến ${email}.`, type: "success" });
    }, 900);
  }

  return (
    <AuthLayout>
      {/* Back */}
      <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 24 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Quay lại đăng nhập
      </Link>

      {step === STEP_EMAIL && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0 }}>Quên mật khẩu</h2>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Nhập email để nhận liên kết đặt lại mật khẩu.</p>
          </div>

          {feedback && (
            <div className={feedback.type === "success" ? "toast-success" : "toast-error"} style={{ marginBottom: 16 }}>
              {feedback.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="field-label" htmlFor="fp-email">Địa chỉ Email</label>
              <input id="fp-email" className="field-input" type="email" placeholder="ban@congty.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              {emailError && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{emailError}</p>}
            </div>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi liên kết khôi phục"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)", marginTop: 24 }}>
            Nhớ ra mật khẩu?{" "}
            <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>Đăng nhập</Link>
          </p>
        </>
      )}

      {step === STEP_SENT && (
        <>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>Kiểm tra hộp thư</h2>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24 }}>
            Đã gửi liên kết khôi phục đến <strong style={{ color: "var(--text)" }}>{email}</strong>
          </p>

          {feedback && (
            <div className="toast-success" style={{ marginBottom: 16 }}>{feedback.msg}</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn-primary" onClick={() => setFeedback({ msg: `Đã gửi lại đến ${email}.`, type: "success" })}>
              Gửi lại email
            </button>
            <button className="btn-secondary" style={{ width: "100%", height: 40 }}
              onClick={() => { setStep(STEP_EMAIL); setFeedback(null); setEmailError(""); }}>
              Dùng email khác
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", marginTop: 20 }}>
            Không thấy email? Hãy kiểm tra cả mục Spam.
          </p>
        </>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
