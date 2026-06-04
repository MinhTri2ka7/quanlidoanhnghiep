const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMUM_PASSWORD_LENGTH = 6;

export function validateEmail(email) {
  if (!email || email.trim() === "") {
    return "Vui lòng nhập email";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Email không đúng định dạng";
  }

  return "";
}

export function validatePassword(password) {
  if (!password) {
    return "Vui lòng nhập mật khẩu";
  }

  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return `Mật khẩu phải có ít nhất ${MINIMUM_PASSWORD_LENGTH} ký tự`;
  }

  return "";
}

export function validateRequired(value, fieldLabel) {
  if (!value || value.trim() === "") {
    return `Vui lòng nhập ${fieldLabel}`;
  }

  return "";
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return "Vui lòng xác nhận mật khẩu";
  }

  if (password !== confirmPassword) {
    return "Mật khẩu xác nhận không khớp";
  }

  return "";
}
