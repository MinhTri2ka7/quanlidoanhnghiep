package com.quanlydn.controller;

import com.quanlydn.dto.UserDto;
import com.quanlydn.entity.User;
import com.quanlydn.repository.UserRepo;
import com.quanlydn.service.EmailService;
import com.quanlydn.service.JwtService;
import com.quanlydn.service.RedisSessionService;
import com.quanlydn.service.RefreshTokenService;
import com.quanlydn.util.TotpUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RedisSessionService redisSessionService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    /**
     * API Đăng nhập truyền thống (Email + Password)
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest, 
                                   @RequestHeader(value = "X-Device-ID", required = false, defaultValue = "default-device") String deviceId) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        Optional<User> userOptional = userRepo.findByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Email không tồn tại"));
        }

        User dbUser = userOptional.get();

        if (!passwordEncoder.matches(password, dbUser.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Sai mật khẩu"));
        }

        if (dbUser.getIsActive() == null || !dbUser.getIsActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Tài khoản của bạn đã bị vô hiệu hóa"));
        }

        // Kiểm tra xem user có bật 2FA không
        if (dbUser.getIsTwoFactorEnabled() != null && dbUser.getIsTwoFactorEnabled()) {
            logger.info("Tài khoản [{}] đã kích hoạt 2FA. Yêu cầu nhập mã xác thực để tiếp tục.", email);
            return ResponseEntity.ok(Map.of(
                    "twoFactorRequired", true,
                    "email", dbUser.getEmail()
            ));
        }

        // Đăng nhập thành công trực tiếp (Không bật 2FA)
        // 1. Tạo Session ID ngẫu nhiên và lưu vào Redis Session (Idle Timeout 30 phút)
        String sessionId = UUID.randomUUID().toString();
        redisSessionService.createSession(dbUser.getId(), deviceId, sessionId);

        // 2. Sinh Access Token (15 phút) và Refresh Token (7 ngày)
        String roleName = dbUser.getRole() != null ? dbUser.getRole().getName() : "EMPLOYEE";
        String accessToken = jwtService.generateAccessToken(dbUser.getId(), dbUser.getEmail(), roleName, sessionId);
        String refreshToken = refreshTokenService.createRefreshToken(dbUser.getId(), deviceId);

        // 3. Gửi Email thông báo đăng nhập Gmail
        sendLoginNotificationEmail(dbUser);

        // 4. Trả về thông tin xác thực
        UserDto userDto = mapToDto(dbUser);
        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "user", userDto
        ));
    }

    /**
     * API Xác thực mã OTP 2FA khi đăng nhập
     */
    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2fa(@RequestBody Map<String, String> request,
                                       @RequestHeader(value = "X-Device-ID", required = false, defaultValue = "default-device") String deviceId) {
        String email = request.get("email");
        String code = request.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu email hoặc mã OTP"));
        }

        Optional<User> userOptional = userRepo.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Email không tồn tại"));
        }

        User dbUser = userOptional.get();
        if (dbUser.getIsActive() == null || !dbUser.getIsActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Tài khoản đã bị vô hiệu hóa"));
        }

        // Xác thực mã OTP với key lưu trữ
        boolean isValid = TotpUtil.verifyOtp(dbUser.getTwoFactorSecret(), code);
        if (!isValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Mã xác thực 2 lớp không chính xác"));
        }

        // Đăng nhập thành công sau 2FA
        // 1. Tạo Session ID ngẫu nhiên và lưu vào Redis Session (Idle Timeout 30 phút)
        String sessionId = UUID.randomUUID().toString();
        redisSessionService.createSession(dbUser.getId(), deviceId, sessionId);

        // 2. Sinh Access Token (15 phút) và Refresh Token (7 ngày)
        String roleName = dbUser.getRole() != null ? dbUser.getRole().getName() : "EMPLOYEE";
        String accessToken = jwtService.generateAccessToken(dbUser.getId(), dbUser.getEmail(), roleName, sessionId);
        String refreshToken = refreshTokenService.createRefreshToken(dbUser.getId(), deviceId);

        // 3. Gửi Email thông báo đăng nhập Gmail
        sendLoginNotificationEmail(dbUser);

        // 4. Trả về thông tin xác thực
        UserDto userDto = mapToDto(dbUser);
        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "user", userDto
        ));
    }

    /**
     * API Làm mới Access Token (Refresh Token Rotation - RTR)
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request,
                                     @RequestHeader(value = "X-Device-ID", required = false, defaultValue = "default-device") String deviceId) {
        String oldRefreshToken = request.get("refreshToken");
        if (oldRefreshToken == null || oldRefreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu Refresh Token"));
        }

        try {
            // 1. Tìm thông tin từ token cũ trong Redis trước khi xoay vòng
            String oldKey = "refresh_token:" + oldRefreshToken;
            String tokenValue = redisTemplate.opsForValue().get(oldKey);
            if (tokenValue == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Refresh Token không hợp lệ hoặc đã hết hạn"));
            }

            String[] parts = tokenValue.split(":");
            Long userId = Long.parseLong(parts[0]);

            // 2. Lấy thông tin user trong DB để cấp claims chính xác
            Optional<User> userOptional = userRepo.findById(userId);
            if (userOptional.isEmpty() || userOptional.get().getIsActive() == null || !userOptional.get().getIsActive()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Tài khoản không hợp lệ hoặc đã bị khóa"));
            }
            User dbUser = userOptional.get();

            // 3. Tiến hành Xoay vòng Refresh Token (RTR) - Nếu phát hiện tái sử dụng, session sẽ bị xóa sạch lập tức
            String newRefreshToken = refreshTokenService.rotateRefreshToken(oldRefreshToken, deviceId);

            // 4. Tạo một Session ID mới và lưu vào Redis Session (Idle Timeout 30 phút) để tăng tính bảo mật
            String newSessionId = UUID.randomUUID().toString();
            redisSessionService.createSession(userId, deviceId, newSessionId);

            // 5. Sinh Access Token mới (15 phút)
            String roleName = dbUser.getRole() != null ? dbUser.getRole().getName() : "EMPLOYEE";
            String newAccessToken = jwtService.generateAccessToken(userId, dbUser.getEmail(), roleName, newSessionId);

            return ResponseEntity.ok(Map.of(
                    "accessToken", newAccessToken,
                    "refreshToken", newRefreshToken
            ));

        } catch (Exception e) {
            logger.error("Lỗi khi làm mới token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * API Đăng xuất (Logout) - Xóa bỏ toàn bộ Session & Refresh Token
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> request,
                                    @RequestHeader(value = "X-Device-ID", required = false, defaultValue = "default-device") String deviceId) {
        String refreshToken = request.get("refreshToken");
        
        // 1. Thu hồi/Xóa Refresh Token trong Redis
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }

        // 2. Xóa Session ID của thiết bị trong Redis
        // Trích xuất userId từ Access Token hiện tại (nếu có gửi kèm trong SecurityContext)
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User) {
                User principal = (User) auth.getPrincipal();
                redisSessionService.deleteSession(principal.getId(), deviceId);
            }
        } catch (Exception e) {
            logger.warn("Không thể xóa session Redis khi logout: {}", e.getMessage());
        }

        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
    }

    private UserDto mapToDto(User dbUser) {
        UserDto response = new UserDto();
        response.setId(dbUser.getId());
        response.setFullname(dbUser.getFullname());
        response.setEmail(dbUser.getEmail());
        response.setPhone(dbUser.getPhone());
        response.setAvatar(dbUser.getAvatar());
        response.setIsActive(dbUser.getIsActive());
        response.setIsTwoFactorEnabled(dbUser.getIsTwoFactorEnabled());

        if (dbUser.getRole() != null) {
            response.setRoleName(dbUser.getRole().getName());
        }
        if (dbUser.getDepartment() != null) {
            response.setDepartmentName(dbUser.getDepartment().getName());
        }
        return response;
    }

    private void sendLoginNotificationEmail(User user) {
        try {
            String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"));
            String htmlContent = "<div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);\">"
                    + "  <div style=\"text-align: center; margin-bottom: 25px;\">"
                    + "    <h2 style=\"color: #EF4444; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;\">Cảnh Báo Đăng Nhập</h2>"
                    + "    <p style=\"color: #6B7280; font-size: 15px; margin-top: 5px;\">Hệ thống Quản lý Doanh nghiệp</p>"
                    + "  </div>"
                    + "  <hr style=\"border: none; border-top: 1px solid #f3f4f6; margin-bottom: 25px;\">"
                    + "  <p style=\"font-size: 16px; color: #374151; line-height: 1.6;\">Chào bạn <b>" + user.getFullname() + "</b>,</p>"
                    + "  <p style=\"font-size: 16px; color: #374151; line-height: 1.6;\">Chúng tôi phát hiện tài khoản của bạn vừa được đăng nhập thành công vào hệ thống quản lý.</p>"
                    + "  <div style=\"background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; margin: 20px 0;\">"
                    + "    <p style=\"margin: 5px 0; font-size: 14px; color: #4B5563;\"><b>Thời gian đăng nhập:</b> " + currentTime + "</p>"
                    + "    <p style=\"margin: 5px 0; font-size: 14px; color: #4B5563;\"><b>Địa chỉ email:</b> " + user.getEmail() + "</p>"
                    + "    <p style=\"margin: 5px 0; font-size: 14px; color: #4B5563;\"><b>Trạng thái:</b> Thành công</p>"
                    + "  </div>"
                    + "  <p style=\"font-size: 14px; color: #4B5563; line-height: 1.6;\">Nếu đây là hành động của bạn, không cần thực hiện gì thêm. Nếu bạn không thực hiện đăng nhập này, vui lòng <b>thay đổi mật khẩu ngay lập tức</b> hoặc liên hệ bộ phận hỗ trợ kỹ thuật để bảo mật tài khoản.</p>"
                    + "  <hr style=\"border: none; border-top: 1px solid #f3f4f6; margin-top: 30px; margin-bottom: 20px;\">"
                    + "  <p style=\"font-size: 13px; color: #9CA3AF; text-align: center; line-height: 1.4;\">&copy; 2026 Enterprise Management System. All rights reserved.</p>"
                    + "</div>";

            emailService.sendHtmlEmail(user.getEmail(), "Cảnh báo bảo mật: Tài khoản đăng nhập thành công", htmlContent);
        } catch (Exception e) {
            logger.error("Lỗi khi gửi email thông báo đăng nhập: {}", e.getMessage());
        }
    }
}
