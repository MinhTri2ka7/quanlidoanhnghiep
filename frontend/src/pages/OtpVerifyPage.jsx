import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import Toast from "../components/Toast.jsx";
import { ArrowLeftIcon } from "../components/icons.jsx";

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

function OtpVerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy dữ liệu đăng ký từ Router State chuyển từ trang Register
  const registrationData = location.state?.registrationData;

  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackVariant, setFeedbackVariant] = useState("info");

  const inputRefs = useRef([]);

  useEffect(() => {
    // Nếu truy cập trực tiếp trang này mà không đi qua trang đăng ký, tự chuyển hướng về /register
    if (!registrationData || !registrationData.email) {
      setFeedbackVariant("error");
      setFeedbackMessage("Không tìm thấy thông tin đăng ký hợp lệ. Đang chuyển hướng về trang đăng ký...");
      const timer = setTimeout(() => {
        navigate("/register");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [registrationData, navigate]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  function handleOtpChange(index, value) {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1].focus();
    }

    const isComplete = newOtpValues.every((digit) => digit !== "");
    if (isComplete) {
      handleVerifyOtp(newOtpValues.join(""));
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  }

  function handlePaste(event) {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").trim();
    const digits = pastedData.replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (digits.length === 0) {
      return;
    }

    const newOtpValues = [...otpValues];
    for (let i = 0; i < digits.length; i++) {
      newOtpValues[i] = digits[i];
    }
    setOtpValues(newOtpValues);

    const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex].focus();

    if (digits.length === OTP_LENGTH) {
      handleVerifyOtp(digits);
    }
  }

  async function handleVerifyOtp(otpCode) {
    if (!registrationData) return;

    setIsVerifying(true);
    setFeedbackMessage("");

    try {
      // Gọi API Backend để xác thực OTP và tạo mới người dùng
      const response = await fetch("http://localhost:8080/api/user/reg/verify-and-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            fullname: registrationData.fullname,
            email: registrationData.email,
            password: registrationData.password,
            phone: registrationData.phone
          },
          otp: otpCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Xác thực mã OTP thất bại");
      }

      setIsVerified(true);
      setFeedbackVariant("success");
      setFeedbackMessage("Xác thực OTP và đăng ký tài khoản thành công!");
    } catch (error) {
      setFeedbackVariant("error");
      setFeedbackMessage(error.message || "Xác thực mã OTP thất bại");
      // Reset hòm nhập liệu để nhập lại
      setOtpValues(Array(OTP_LENGTH).fill(""));
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (!registrationData || !registrationData.email) return;

    setCanResend(false);
    setCountdown(COUNTDOWN_SECONDS);
    setFeedbackVariant("info");
    setFeedbackMessage("Đang gửi lại mã xác nhận OTP mới...");

    try {
      const response = await fetch("http://localhost:8080/api/user/reg/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registrationData.email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gửi lại OTP thất bại");
      }

      setFeedbackVariant("success");
      setFeedbackMessage("Đã gửi mã xác nhận OTP mới về Gmail của bạn!");
    } catch (error) {
      setFeedbackVariant("error");
      setFeedbackMessage(error.message || "Gửi lại mã OTP thất bại");
      setCanResend(true);
    }
  }

  function formatCountdown(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return (
    <AuthLayout>
      <div className="relative overflow-hidden bg-darkCard border border-darkBorder rounded-card shadow-darkCard">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primaryBlue via-accentIndigo to-accentPurple" />

        <div className="p-8 md:p-10">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm text-darkTextGray hover:text-primaryBlue transition-colors mb-6"
          >
            <ArrowLeftIcon />
            Quay lại trang đăng ký
          </Link>

          {isVerified ? (
            <VerifiedState />
          ) : (
            <>
              <header className="text-center mb-8">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primaryBlue/10 text-primaryBlue mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-darkText">Xác thực OTP</h2>
                <p className="mt-2 text-sm text-darkTextGray">
                  Nhập mã 6 chữ số đã gửi đến hòm thư email: <br />
                  <strong className="text-primaryBlue">{registrationData?.email || "Gmail của bạn"}</strong>
                </p>
              </header>

              {feedbackMessage && (
                <div className="mb-5">
                  <Toast message={feedbackMessage} variant={feedbackVariant} />
                </div>
              )}

              <div className="flex justify-center gap-3 mb-6">
                {otpValues.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => (inputRefs.current[index] = element)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isVerifying || !registrationData}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-darkBorder
                      bg-darkBg text-darkText
                      focus:outline-none focus:ring-4 focus:ring-primaryBlue/15 focus:border-primaryBlue
                      hover:border-darkTextGray/50 transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Ô OTP thứ ${index + 1}`}
                  />
                ))}
              </div>

              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-sm text-primaryBlue mb-4">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xác thực tài khoản...
                </div>
              )}

              <div className="text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm font-semibold text-primaryBlue hover:underline"
                    disabled={!registrationData}
                  >
                    Gửi lại mã OTP
                  </button>
                ) : (
                  <p className="text-sm text-darkTextGray">
                    Gửi lại mã sau{" "}
                    <span className="font-semibold text-darkText">
                      {formatCountdown(countdown)}
                    </span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

function VerifiedState() {
  return (
    <div className="text-center py-6 animate-fade-in">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-successGreen/10 text-successGreen mx-auto mb-5">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-darkText mb-2">Đăng ký thành công</h2>
      <p className="text-sm text-darkTextGray mb-6">
        Tài khoản của bạn đã được xác thực và tạo lập thành công. Vui lòng tiến hành đăng nhập để bắt đầu làm việc.
      </p>
      <Link
        to="/login"
        className="w-full h-12 rounded-xl bg-gradient-to-r from-successGreen to-emerald-500 text-white font-semibold
          hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-successGreen/25
          transition-all duration-300 inline-flex items-center justify-center"
      >
        Đăng nhập ngay
      </Link>
    </div>
  );
}

export default OtpVerifyPage;
