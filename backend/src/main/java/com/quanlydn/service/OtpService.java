package com.quanlydn.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private static final String OTP_KEY_PREFIX = "otp:register:";
    private static final int OTP_EXPIRY_MINUTES = 5;

    @Autowired
    private StringRedisTemplate redisTemplate;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Sinh mã OTP gồm 6 chữ số ngẫu nhiên, lưu vào Redis với thời hạn 5 phút.
     *
     * @param email Địa chỉ email làm định danh key
     * @return Mã OTP được sinh ra
     */
    public String generateOtp(String email) {
        // Sinh mã OTP 6 chữ số ngẫu nhiên dạng chuỗi từ 000000 đến 999999
        int number = secureRandom.nextInt(1000000);
        String otp = String.format("%06d", number);

        String key = OTP_KEY_PREFIX + email;

        // Lưu vào Redis, cấu hình hết hạn sau 5 phút
        redisTemplate.opsForValue().set(key, otp, OTP_EXPIRY_MINUTES, TimeUnit.MINUTES);

        logger.info("Đã sinh mã OTP cho {}. Thời hạn 5 phút.", email);
        return otp;
    }

    /**
     * Xác thực mã OTP người dùng gửi lên so với mã lưu trong Redis.
     * Nếu hợp lệ thì xóa mã OTP để tránh tái sử dụng.
     *
     * @param email Địa chỉ email
     * @param otpCode Mã OTP cần kiểm tra
     * @return true nếu khớp, false nếu sai hoặc hết hạn
     */
    public boolean validateOtp(String email, String otpCode) {
        String key = OTP_KEY_PREFIX + email;
        String savedOtp = redisTemplate.opsForValue().get(key);

        if (savedOtp == null) {
            logger.warn("Không tìm thấy mã OTP hoặc OTP đã hết hạn cho: {}", email);
            return false;
        }

        boolean isValid = savedOtp.equals(otpCode);
        if (isValid) {
            // Xóa mã OTP khỏi Redis ngay sau khi xác thực thành công
            redisTemplate.delete(key);
            logger.info("Xác thực OTP thành công và đã xóa mã cho: {}", email);
        } else {
            logger.warn("Nhập sai mã OTP cho: {}", email);
        }

        return isValid;
    }

    /**
     * Xóa mã OTP thủ công.
     *
     * @param email Địa chỉ email
     */
    public void deleteOtp(String email) {
        String key = OTP_KEY_PREFIX + email;
        redisTemplate.delete(key);
        logger.info("Đã xóa mã OTP cho: {}", email);
    }
}
