package com.quanlydn.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class RefreshTokenService {

    private static final Logger logger = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";
    private static final long REFRESH_TOKEN_TTL_DAYS = 7; // Thời hạn 7 ngày

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private RedisSessionService redisSessionService;

    /**
     * Tạo một Refresh Token mới lưu trữ trong Redis 7 ngày.
     */
    public String createRefreshToken(Long userId, String deviceId) {
        String token = UUID.randomUUID().toString();
        String key = REFRESH_TOKEN_PREFIX + token;
        
        // Cấu trúc giá trị lưu trữ: userId:deviceId:used
        String value = userId + ":" + deviceId + ":false";
        
        redisTemplate.opsForValue().set(key, value, REFRESH_TOKEN_TTL_DAYS, TimeUnit.DAYS);
        logger.info("Đã sinh Refresh Token mới cho User [{}], Thiết bị [{}]: {}", userId, deviceId, token);
        return token;
    }

    /**
     * Xác thực và xoay vòng Refresh Token (Refresh Token Rotation - RTR).
     * @return Mã Refresh Token mới được sinh ra.
     */
    public String rotateRefreshToken(String oldToken, String deviceId) {
        String oldKey = REFRESH_TOKEN_PREFIX + oldToken;
        String value = redisTemplate.opsForValue().get(oldKey);

        if (value == null) {
            logger.warn("Yêu cầu xoay vòng bị từ chối: Refresh Token không tồn tại hoặc đã hết hạn.");
            throw new RuntimeException("Refresh Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }

        // Parse chuỗi dữ liệu: userId:deviceId:used
        String[] parts = value.split(":");
        if (parts.length < 3) {
            throw new RuntimeException("Dữ liệu Token không đúng định dạng.");
        }

        Long userId = Long.parseLong(parts[0]);
        String tokenDeviceId = parts[1];
        boolean isUsed = Boolean.parseBoolean(parts[2]);

        // Đảm bảo thiết bị gửi yêu cầu khớp với thiết bị đăng ký token ban đầu
        if (!tokenDeviceId.equals(deviceId)) {
            logger.warn("Cảnh báo bảo mật: Thiết bị [{}] cố gắng xoay vòng token thuộc về thiết bị [{}]!", deviceId, tokenDeviceId);
            throw new RuntimeException("Thiết bị yêu cầu không hợp lệ.");
        }

        // PHÁT HIỆN TÁI SỬ DỤNG REFRESH TOKEN (REFRESH TOKEN REUSE DETECTION - RTR)
        if (isUsed) {
            logger.error("CẢNH BÁO BẢO MẬT NGHIÊM TRỌNG: Phát hiện sử dụng lại Refresh Token cũ [{}] của User [{}] trên Thiết bị [{}]. " +
                    "Nghi ngờ rò rỉ token. Hệ thống sẽ thu hồi toàn bộ phiên hoạt động của thiết bị này lập tức!", oldToken, userId, deviceId);
            
            // 1. Thu hồi toàn bộ session (Buộc đăng nhập lại ngay lập tức)
            redisSessionService.deleteSession(userId, deviceId);
            
            // 2. Xóa token cũ
            redisTemplate.delete(oldKey);
            
            throw new RuntimeException("Cảnh báo an ninh: Phiên đăng nhập bị hủy bỏ do phát hiện bất thường. Vui lòng đăng nhập lại.");
        }

        // Hợp lệ -> Tiến hành Xoay vòng (Rotation)
        // 1. Đánh dấu token cũ đã sử dụng và cho tồn tại thêm 5 phút (Grace period phòng lỗi mạng khi client chưa kịp nhận token mới)
        String updatedOldValue = userId + ":" + deviceId + ":true";
        redisTemplate.opsForValue().set(oldKey, updatedOldValue, 5, TimeUnit.MINUTES);

        // 2. Sinh Refresh Token mới và lưu trữ 7 ngày
        String newToken = createRefreshToken(userId, deviceId);

        // 3. Gia hạn thời gian hoạt động của Session trượt (Sliding Session) trong Redis
        redisSessionService.refreshSession(userId, deviceId);

        return newToken;
    }

    /**
     * Vô hiệu hóa/Xóa Refresh Token (khi đăng xuất).
     */
    public void revokeRefreshToken(String token) {
        String key = REFRESH_TOKEN_PREFIX + token;
        redisTemplate.delete(key);
        logger.info("Đã thu hồi Refresh Token: {}", token);
    }
}
