package com.quanlydn.security;

import com.quanlydn.entity.User;
import com.quanlydn.repository.UserRepo;
import com.quanlydn.service.JwtService;
import com.quanlydn.service.RedisSessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RedisSessionService redisSessionService;

    @Autowired
    private UserRepo userRepo;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Lấy Access Token từ header Authorization
        final String authHeader = request.getHeader("Authorization");
        final String deviceIdHeader = request.getHeader("X-Device-ID");
        final String deviceId = (deviceIdHeader != null && !deviceIdHeader.isBlank()) ? deviceIdHeader : "default-device";

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        try {
            // 2. Kiểm tra nếu token đã hết hạn hoàn toàn
            if (jwtService.isTokenExpired(token)) {
                logger.warn("Token đăng nhập đã hết hạn hoàn toàn.");
                filterChain.doFilter(request, response);
                return;
            }

            // 3. Trích xuất thông tin từ token
            Long userId = jwtService.extractUserId(token);
            String email = jwtService.extractEmail(token);
            String role = jwtService.extractRole(token);
            String sessionId = jwtService.extractSessionId(token);

            if (userId != null && email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // 4. Verify User Status (Phải kích hoạt và tồn tại trong DB)
                Optional<User> userOptional = userRepo.findById(userId);
                if (userOptional.isEmpty()) {
                    logger.warn("Xác thực thất bại: User [{}] không tồn tại trong hệ thống.", userId);
                    filterChain.doFilter(request, response);
                    return;
                }

                User dbUser = userOptional.get();
                if (dbUser.getIsActive() == null || !dbUser.getIsActive()) {
                    logger.warn("Xác thực thất bại: Tài khoản User [{}] đã bị vô hiệu hóa.", userId);
                    filterChain.doFilter(request, response);
                    return;
                }

                // 5. Verify Session Redis (Kiểm tra trạng thái hoạt động và Sliding Session còn hiệu lực)
                if (!redisSessionService.isSessionValid(userId, deviceId, sessionId)) {
                    logger.warn("Xác thực thất bại: Phiên làm việc (SessionId: {}) của User [{}] trên Thiết bị [{}] đã hết hạn hoặc không hợp lệ.", 
                            sessionId, userId, deviceId);
                    filterChain.doFilter(request, response);
                    return;
                }

                // 6. Tự động gia hạn Access Token (Auto Renew Access Token)
                // Nếu thời gian còn lại của Access Token < 5 phút, tự động cấp token mới
                double remainingMinutes = jwtService.getRemainingTimeInMinutes(token);
                if (remainingMinutes > 0 && remainingMinutes < 5.0) {
                    logger.info("Access Token của User [{}] sắp hết hạn (còn {} phút). Đang tự động gia hạn...", userId, String.format("%.2f", remainingMinutes));
                    
                    String newAccessToken = jwtService.generateAccessToken(userId, email, role, sessionId);
                    
                    // Ghi đè vào header phản hồi
                    response.setHeader("X-New-Access-Token", newAccessToken);
                    // Mở quyền CORS để Javascript Client đọc được header tùy chỉnh này
                    response.setHeader("Access-Control-Expose-Headers", "X-New-Access-Token");
                }

                // 7. Gia hạn phiên trượt (Sliding Session) thêm 30 phút trong Redis
                redisSessionService.refreshSession(userId, deviceId);

                // 8. Đăng nhập vào SecurityContext của Spring Security
                String formattedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        dbUser, 
                        null, 
                        Collections.singletonList(new SimpleGrantedAuthority(formattedRole))
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                SecurityContextHolder.getContext().setAuthentication(authToken);
                logger.debug("Người dùng [{}] được xác thực thành công qua JWT cho request [{}]", email, request.getRequestURI());
            }

        } catch (Exception e) {
            logger.error("Lỗi khi xử lý JwtAuthenticationFilter: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
