package com.quanlydn.controller;

import com.quanlydn.dto.RegisterRequestDto;
import com.quanlydn.service.OtpService;
import com.quanlydn.service.EmailService;
import com.quanlydn.dto.CreateUserDto;
import com.quanlydn.dto.UpdateUserDto;
import com.quanlydn.dto.UserDto;
import com.quanlydn.entity.Role;
import com.quanlydn.entity.User;
import com.quanlydn.repository.RoleRepo;
import com.quanlydn.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.quanlydn.util.TotpUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.quanlydn.repository.UserRepo userRepo;

    // GET /api/user — lấy tất cả users
    @GetMapping
    public List<UserDto> getAllUser() {
        return userService.getAllUsers();
    }

    // GET /api/user/{id} — lấy user theo id
    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // POST /api/user — tạo user mới
    @PostMapping
    public UserDto createUser(@Valid @RequestBody CreateUserDto userDto) {
        return userService.createUser(userDto);
    }

    // PUT /api/user/{id} — cập nhật user
    @PutMapping("/{id}")
    public UserDto updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserDto user) {
        return userService.updateUser(id, user);
    }

    // DELETE /api/user/{id} — xóa user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Xóa user thành công"));
    }

    // PATCH /api/user/{id}/toggle-active — bật/tắt trạng thái active
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<?> toggleActive(@PathVariable Long id) {
        userService.toggleActive(id);
        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái thành công"));
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
            System.err.println("Lỗi khi gửi email thông báo đăng nhập: " + e.getMessage());
        }
    }

    // POST /api/user/login — đăng nhập
    @PostMapping("/login")
    public ResponseEntity<?> checkLogin(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        Optional<User> userOptional = userService.findUserByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Email không tồn tại"));
        }

        User dbUser = userOptional.get();

        if (!passwordEncoder.matches(password, dbUser.getPassword())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Sai mật khẩu"));
        }

        // Kiểm tra xem user có bật 2FA không
        if (dbUser.getIsTwoFactorEnabled() != null && dbUser.getIsTwoFactorEnabled()) {
            return ResponseEntity.ok(Map.of(
                    "twoFactorRequired", true,
                    "email", dbUser.getEmail()
            ));
        }

        // Đăng nhập thành công (không bật 2FA): Gửi email thông báo
        sendLoginNotificationEmail(dbUser);

        // Trả về thông tin user từ DB (không phải từ request)
        UserDto response = mapToDto(dbUser);
        return ResponseEntity.ok(response);
    }

    // POST /api/user/reg — đăng ký
    @PostMapping("/reg")
    public ResponseEntity<?> registerUser(@Valid @RequestBody CreateUserDto dto) {
        // Kiểm tra email đã tồn tại
        Optional<User> existing = userService.findUserByEmail(dto.getEmail());
        if (existing.isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email đã tồn tại"));
        }

        // Đảm bảo roleId mặc định là 1 nếu chưa gán
        if (dto.getRoleId() == null) {
            dto.setRoleId(1L);
        }

        UserDto savedUser = userService.createUser(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Tạo tài khoản thành công",
                        "user", savedUser
                ));
    }

    // POST /api/user/reg/send-otp — gửi mã xác nhận OTP qua mail trước khi đăng ký
    @PostMapping("/reg/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email không được để trống"));
        }

        // Kiểm tra email đã tồn tại hay chưa
        Optional<User> existing = userService.findUserByEmail(email);
        if (existing.isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email này đã được đăng ký tài khoản khác"));
        }

        // Sinh mã OTP lưu vào Redis
        String otp = otpService.generateOtp(email);

        // Gửi email HTML chuyên nghiệp chứa mã OTP
        String htmlContent = "<div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);\">"
                + "  <div style=\"text-align: center; margin-bottom: 25px;\">"
                + "    <h2 style=\"color: #4F46E5; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;\">Xác Minh Tài Khoản</h2>"
                + "    <p style=\"color: #6B7280; font-size: 15px; margin-top: 5px;\">Hệ thống Quản lý Doanh nghiệp</p>"
                + "  </div>"
                + "  <hr style=\"border: none; border-top: 1px solid #f3f4f6; margin-bottom: 25px;\">"
                + "  <p style=\"font-size: 16px; color: #374151; line-height: 1.6;\">Chào bạn,</p>"
                + "  <p style=\"font-size: 16px; color: #374151; line-height: 1.6;\">Bạn đang thực hiện đăng ký tài khoản mới trên hệ thống của chúng tôi. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quy trình xác thực:</p>"
                + "  <div style=\"text-align: center; margin: 35px 0;\">"
                + "    <span style=\"font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4F46E5; background-color: #EEF2F6; padding: 12px 30px; border-radius: 8px; border: 1px dashed #4F46E5; display: inline-block;\">" + otp + "</span>"
                + "  </div>"
                + "  <p style=\"font-size: 14px; color: #EF4444; font-weight: 500; text-align: center;\">⚠️ Lưu ý: Mã OTP này có hiệu lực trong vòng 5 phút và chỉ sử dụng được 1 lần.</p>"
                + "  <hr style=\"border: none; border-top: 1px solid #f3f4f6; margin-top: 30px; margin-bottom: 20px;\">"
                + "  <p style=\"font-size: 13px; color: #9CA3AF; text-align: center; line-height: 1.4;\">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ kỹ thuật.<br>&copy; 2026 Enterprise Management System. All rights reserved.</p>"
                + "</div>";

        emailService.sendHtmlEmail(email, "Mã xác nhận đăng ký tài khoản (OTP)", htmlContent);

        return ResponseEntity.ok(Map.of("message", "Mã OTP đã được gửi tới hòm thư: " + email));
    }

    // POST /api/user/reg/verify-and-register — xác nhận mã OTP và đăng ký tài khoản
    @PostMapping("/reg/verify-and-register")
    public ResponseEntity<?> verifyAndRegister(@Valid @RequestBody RegisterRequestDto requestDto) {
        CreateUserDto userDto = requestDto.getUser();
        String otp = requestDto.getOtp();

        // 1. Kiểm tra email đã tồn tại trước
        Optional<User> existing = userService.findUserByEmail(userDto.getEmail());
        if (existing.isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email đã tồn tại"));
        }

        // 2. Xác thực OTP qua Redis
        boolean isOtpValid = otpService.validateOtp(userDto.getEmail(), otp);
        if (!isOtpValid) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Mã xác nhận (OTP) không đúng hoặc đã hết hạn"));
        }

        // 3. Tiến hành đăng ký sau khi OTP hợp lệ
        if (userDto.getRoleId() == null) {
            userDto.setRoleId(1L);
        }

        UserDto savedUser = userService.createUser(userDto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Xác thực OTP và đăng ký tài khoản thành công!",
                        "user", savedUser
                ));
    }

    // POST /api/user/login/verify-2fa — xác thực mã 2FA khi đăng nhập
    @PostMapping("/login/verify-2fa")
    public ResponseEntity<?> verify2faLogin(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu email hoặc mã OTP"));
        }

        Optional<User> userOptional = userService.findUserByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Email không tồn tại"));
        }

        User user = userOptional.get();
        if (user.getIsTwoFactorEnabled() == null || !user.getIsTwoFactorEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tài khoản chưa bật xác thực 2 lớp"));
        }

        boolean isValid = TotpUtil.verifyOtp(user.getTwoFactorSecret(), code);
        if (!isValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Mã xác thực 2 lớp không chính xác"));
        }

        // Gửi email thông báo đăng nhập thành công
        sendLoginNotificationEmail(user);

        UserDto response = mapToDto(user);
        return ResponseEntity.ok(response);
    }

    // POST /api/user/2fa/setup — bắt đầu cấu hình 2FA
    @PostMapping("/2fa/setup")
    public ResponseEntity<?> setup2fa(@RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu userId"));
        }

        Optional<User> userOptional = userRepo.findById(userId);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy người dùng"));
        }

        User user = userOptional.get();
        String secret = TotpUtil.generateSecretKey();
        
        String appName = "TechCorp";
        String qrData = String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s", appName, user.getEmail(), secret, appName);
        String qrCodeUrl = "";
        try {
            qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + java.net.URLEncoder.encode(qrData, "UTF-8");
        } catch (java.io.UnsupportedEncodingException e) {
            qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + secret;
        }

        return ResponseEntity.ok(Map.of(
                "secret", secret,
                "qrCodeUrl", qrCodeUrl
        ));
    }

    // POST /api/user/2fa/enable — xác minh mã & kích hoạt 2FA
    @PostMapping("/2fa/enable")
    public ResponseEntity<?> enable2fa(@RequestBody Map<String, Object> request) {
        Long userId = null;
        if (request.get("userId") instanceof Number) {
            userId = ((Number) request.get("userId")).longValue();
        }
        String secret = (String) request.get("secret");
        String code = (String) request.get("code");

        if (userId == null || secret == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin bắt buộc: userId, secret, code"));
        }

        Optional<User> userOptional = userRepo.findById(userId);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy người dùng"));
        }

        User user = userOptional.get();
        boolean isValid = TotpUtil.verifyOtp(secret, code);
        if (!isValid) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mã xác thực không chính xác. Kích hoạt 2FA thất bại."));
        }

        user.setTwoFactorSecret(secret);
        user.setIsTwoFactorEnabled(true);
        userRepo.save(user);

        UserDto response = mapToDto(user);
        return ResponseEntity.ok(Map.of(
                "message", "Kích hoạt xác thực 2 lớp (2FA) thành công!",
                "user", response
        ));
    }

    // POST /api/user/2fa/disable — xác minh mã & tắt 2FA
    @PostMapping("/2fa/disable")
    public ResponseEntity<?> disable2fa(@RequestBody Map<String, Object> request) {
        Long userId = null;
        if (request.get("userId") instanceof Number) {
            userId = ((Number) request.get("userId")).longValue();
        }
        String code = (String) request.get("code");

        if (userId == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin bắt buộc: userId, code"));
        }

        Optional<User> userOptional = userRepo.findById(userId);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy người dùng"));
        }

        User user = userOptional.get();
        boolean isValid = TotpUtil.verifyOtp(user.getTwoFactorSecret(), code);
        if (!isValid) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mã xác thực không chính xác. Hủy kích hoạt 2FA thất bại."));
        }

        user.setIsTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepo.save(user);

        UserDto response = mapToDto(user);
        return ResponseEntity.ok(Map.of(
                "message", "Đã tắt xác thực 2 lớp (2FA) thành công!",
                "user", response
        ));
    }
}
