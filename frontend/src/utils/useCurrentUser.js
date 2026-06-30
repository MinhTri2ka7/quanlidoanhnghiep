/**
 * useCurrentUser — đọc thông tin user từ localStorage.
 * Cung cấp các flag isAdmin, isManager, isEmployee để control UI.
 *
 * Lưu ý bảo mật: localStorage chỉ dùng cho UI.
 * Bảo mật thật nằm ở backend (JWT + @PreAuthorize).
 */
import { useState, useEffect } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  useEffect(() => {
    function onUpdate(e) { if (e.detail) setUser(e.detail); }
    window.addEventListener("user-update", onUpdate);
    return () => window.removeEventListener("user-update", onUpdate);
  }, []);

  const roleName = user?.role?.name || user?.roleName || "";

  return {
    user,
    roleName,
    isAdmin:    roleName === "Admin",
    isManager:  roleName === "Manager",
    isEmployee: roleName === "Employee",
  };
}
