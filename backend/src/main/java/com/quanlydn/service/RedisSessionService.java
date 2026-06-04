package com.quanlydn.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RedisSessionService {

    private static final Logger logger = LoggerFactory.getLogger(RedisSessionService.class);
    private static final String SESSION_KEY_PREFIX = "session:";
    private static final long SESSION_TTL_MINUTES = 30; // Idle Timeout: 30 phút

    @Autowired
    private StringRedisTemplate redisTemplate;

    /**
     * Tạo phiên mới trong Redis cho thiết bị cụ thể của người dùng.
     */
    public void createSession(Long userId, String deviceId, String sessionId) {
        String key = getSessionKey(userId, deviceId);
        redisTemplate.opsForValue().set(key, sessionId, SESSION_TTL_MINUTES, TimeUnit.MINUTES);
        logger.info("Đã tạo phiên mới cho User [{}], Thiết bị [{}], SessionId: {}", userId, deviceId, sessionId);
    }

    /**
     * Kiểm tra xem phiên của người dùng trên thiết bị có hợp lệ không (có tồn tại và khớp với sessionId hay không).
     */
    public boolean isSessionValid(Long userId, String deviceId, String sessionId) {
        if (userId == null || deviceId == null || sessionId == null) {
            return false;
        }
        String key = getSessionKey(userId, deviceId);
        String savedSessionId = redisTemplate.opsForValue().get(key);
        
        boolean isValid = sessionId.equals(savedSessionId);
        if (!isValid) {
            logger.warn("Xác thực phiên thất bại cho User [{}], Thiết bị [{}]. SessionId mong đợi: {}, thực tế: {}", 
                    userId, deviceId, sessionId, savedSessionId);
        }
        return isValid;
    }

    /**
     * Gia hạn phiên trượt (Sliding Session) - reset TTL về lại 30 phút.
     */
    public void refreshSession(Long userId, String deviceId) {
        String key = getSessionKey(userId, deviceId);
        Boolean extended = redisTemplate.expire(key, SESSION_TTL_MINUTES, TimeUnit.MINUTES);
        if (Boolean.TRUE.equals(extended)) {
            logger.debug("Gia hạn thành công phiên trượt cho User [{}], Thiết bị [{}] thêm 30 phút.", userId, deviceId);
        } else {
            logger.warn("Không thể gia hạn phiên trượt (phiên có thể đã hết hạn hoàn toàn) cho User [{}], Thiết bị [{}]", userId, deviceId);
        }
    }

    /**
     * Xóa phiên (Đăng xuất hoặc thu hồi bắt buộc).
     */
    public void deleteSession(Long userId, String deviceId) {
        String key = getSessionKey(userId, deviceId);
        redisTemplate.delete(key);
        logger.info("Đã xóa phiên cho User [{}], Thiết bị [{}]", userId, deviceId);
    }

    private String getSessionKey(Long userId, String deviceId) {
        return SESSION_KEY_PREFIX + userId + ":" + deviceId;
    }
}
