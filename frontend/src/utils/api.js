// ============================================
// API Service — Kết nối frontend với backend
// Base URL: http://localhost:8080/api
// ============================================

const API_BASE = "http://localhost:8080/api";

// Helper lấy hoặc sinh ngẫu nhiên Device ID duy nhất trên thiết bị này
export function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = "device-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

// Wrapper trung tâm cho mọi API requests
export async function apiFetch(url, options = {}) {
  const headers = { ...options.headers };
  
  // 1. Đính kèm Access Token nếu có trong bộ nhớ
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  // 2. Đính kèm X-Device-ID định danh thiết bị độc lập
  headers["X-Device-ID"] = getDeviceId();
  
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // 3. TỰ ĐỘNG CẬP NHẬT ACCESS TOKEN MỚI (Từ Response Header X-New-Access-Token)
  const newAccessToken = response.headers.get("X-New-Access-Token");
  if (newAccessToken) {
    localStorage.setItem("access_token", newAccessToken);
    
    // Cập nhật thuộc tính accessToken bên trong đối tượng user lưu trữ cục bộ
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.accessToken = newAccessToken;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (e) {
      console.warn("Không thể cập nhật đối tượng user cục bộ: ", e);
    }
    console.log("Access Token đã tự động được gia hạn mới từ Backend!");
  }

  // 4. Xử lý Hết hạn phiên (401 Unauthorized)
  if (response.status === 401) {
    // Nếu không phải đang ở trang đăng nhập -> cưỡng bức logout
    if (!window.location.pathname.includes("/login")) {
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      throw new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  return response;
}

// =================== AUTH & ACCOUNT ===================

export async function loginUser(email, password) {
  const response = await apiFetch(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Đăng nhập thất bại");
  }

  // Lưu trữ Token khi đăng nhập thành công trực tiếp
  if (data.accessToken) localStorage.setItem("access_token", data.accessToken);
  if (data.refreshToken) localStorage.setItem("refresh_token", data.refreshToken);
  
  return data;
}

export async function verify2faLogin(email, code) {
  const response = await apiFetch(`${API_BASE}/auth/verify-2fa`, {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Mã xác thực không chính xác");
  }

  // Lưu trữ Token khi xác thực 2FA thành công
  if (data.accessToken) localStorage.setItem("access_token", data.accessToken);
  if (data.refreshToken) localStorage.setItem("refresh_token", data.refreshToken);

  return data;
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    throw new Error("Không tìm thấy Refresh Token");
  }

  const response = await apiFetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Làm mới phiên thất bại. Vui lòng đăng nhập lại.");
  }

  // Ghi đè token mới
  if (data.accessToken) localStorage.setItem("access_token", data.accessToken);
  if (data.refreshToken) localStorage.setItem("refresh_token", data.refreshToken);

  return data;
}

export async function logoutUser() {
  const refreshToken = localStorage.getItem("refresh_token");
  try {
    await apiFetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } catch (err) {
    console.warn("Gửi yêu cầu đăng xuất tới Server thất bại: ", err.message);
  } finally {
    // Xóa sạch thông tin lưu trữ cục bộ
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }
}

export async function registerUser({ fullname, email, phone, password }) {
  const response = await apiFetch(`${API_BASE}/user/reg`, {
    method: "POST",
    body: JSON.stringify({ fullname, email, phone, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Đăng ký thất bại");
  }

  return data;
}

// =================== USER MANAGEMENT ===================

export async function getAllUsers() {
  const response = await apiFetch(`${API_BASE}/user`);
  if (!response.ok) throw new Error("Lỗi khi lấy danh sách users");
  return response.json();
}

export async function getUserById(id) {
  const response = await apiFetch(`${API_BASE}/user/${id}`);
  if (!response.ok) throw new Error("Không tìm thấy user");
  return response.json();
}

export async function createUser(userData) {
  const response = await apiFetch(`${API_BASE}/user`, {
    method: "POST",
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error("Lỗi khi tạo user");
  return response.json();
}

export async function updateUser(id, userData) {
  const response = await apiFetch(`${API_BASE}/user/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error("Lỗi khi cập nhật user");
  return response.json();
}

export async function deleteUser(id) {
  const response = await apiFetch(`${API_BASE}/user/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Lỗi khi xóa user");
  return response.json();
}

// =================== ROLE ===================

export async function getAllRoles() {
  const response = await apiFetch(`${API_BASE}/role`);
  if (!response.ok) throw new Error("Lỗi khi lấy danh sách roles");
  return response.json();
}

export async function getRoleById(id) {
  const response = await apiFetch(`${API_BASE}/role/${id}`);
  if (!response.ok) throw new Error("Không tìm thấy role");
  return response.json();
}

// =================== DEPARTMENT ===================

export async function getAllDepartments() {
  const response = await apiFetch(`${API_BASE}/department`);
  if (!response.ok) throw new Error("Lỗi khi lấy danh sách phòng ban");
  return response.json();
}

export async function getDepartmentById(id) {
  const response = await apiFetch(`${API_BASE}/department/${id}`);
  if (!response.ok) throw new Error("Không tìm thấy phòng ban");
  return response.json();
}

// =================== PROJECT ===================

export async function getAllProjects() {
  const response = await apiFetch(`${API_BASE}/project`);
  if (!response.ok) throw new Error("Lỗi khi lấy danh sách dự án");
  return response.json();
}

export async function getProjectById(id) {
  const response = await apiFetch(`${API_BASE}/project/${id}`);
  if (!response.ok) throw new Error("Không tìm thấy dự án");
  return response.json();
}

// =================== TASK ===================

export async function getAllTasks() {
  const response = await apiFetch(`${API_BASE}/task`);
  if (!response.ok) throw new Error("Lỗi khi lấy danh sách task");
  return response.json();
}

export async function getTasksByProject(projectId) {
  const response = await apiFetch(`${API_BASE}/task/project/${projectId}`);
  if (!response.ok) throw new Error("Lỗi khi lấy danh sách task theo dự án");
  return response.json();
}

export async function getTasksByUser(userId) {
  const response = await apiFetch(`${API_BASE}/task/user/${userId}`);
  if (!response.ok) throw new Error("Lỗi khi lấy danh sách task theo nhân viên");
  return response.json();
}

export async function createTask(taskData, createdBy = 1) {
  const response = await apiFetch(`${API_BASE}/task?createdBy=${createdBy}`, {
    method: "POST",
    body: JSON.stringify(taskData),
  });
  if (!response.ok) throw new Error("Lỗi khi tạo task");
  return response.json();
}

export async function updateTaskStatus(taskId, status) {
  const response = await apiFetch(`${API_BASE}/task/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Lỗi khi cập nhật trạng thái task");
  return response.json();
}

// =================== 2FA / SECURITY ===================

export async function setup2fa(userId) {
  const response = await apiFetch(`${API_BASE}/user/2fa/setup`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Không thể khởi tạo cấu hình 2FA");
  }
  return data;
}

export async function enable2fa(userId, secret, code) {
  const response = await apiFetch(`${API_BASE}/user/2fa/enable`, {
    method: "POST",
    body: JSON.stringify({ userId, secret, code }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Kích hoạt 2FA thất bại");
  }
  return data;
}

export async function disable2fa(userId, code) {
  const response = await apiFetch(`${API_BASE}/user/2fa/disable`, {
    method: "POST",
    body: JSON.stringify({ userId, code }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Tắt 2FA thất bại");
  }
  return data;
}
