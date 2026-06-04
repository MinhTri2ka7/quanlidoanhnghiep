package com.quanlydn.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;

public class TotpUtil {

    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    /**
     * Sinh khóa bí mật ngẫu nhiên Base32 độ dài 20 bytes (160 bits).
     */
    public static String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        return encodeBase32(bytes);
    }

    /**
     * Mã hóa mảng bytes thành chuỗi Base32.
     */
    public static String encodeBase32(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        int i = 0, index = 0, digit = 0;
        int currByte, nextByte;
        while (i < bytes.length) {
            currByte = (bytes[i] >= 0) ? bytes[i] : (bytes[i] + 256);
            if (index > 3) {
                if (i + 1 < bytes.length) {
                    nextByte = (bytes[i + 1] >= 0) ? bytes[i + 1] : (bytes[i + 1] + 256);
                } else {
                    nextByte = 0;
                }
                digit = currByte & (0xFF >> index);
                index = (index + 5) % 8;
                digit <<= index;
                digit |= nextByte >> (8 - index);
                i++;
            } else {
                digit = (currByte >> (8 - (index + 5))) & 0x1F;
                index = (index + 5) % 8;
                if (index == 0) {
                    i++;
                }
            }
            sb.append(BASE32_CHARS.charAt(digit));
        }
        return sb.toString();
    }

    /**
     * Giải mã chuỗi Base32 thành mảng bytes.
     */
    public static byte[] decodeBase32(String base32) {
        base32 = base32.toUpperCase().replaceAll("[^A-Z2-7]", "");
        int l = base32.length();
        int outLength = l * 5 / 8;
        byte[] out = new byte[outLength];
        int buffer = 0;
        int next = 0;
        int bitsLeft = 0;
        for (int i = 0; i < l; i++) {
            char c = base32.charAt(i);
            int val = BASE32_CHARS.indexOf(c);
            if (val < 0) continue;
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                out[next++] = (byte) (buffer >> (bitsLeft - 8));
                bitsLeft -= 8;
            }
        }
        return Arrays.copyOf(out, next);
    }

    /**
     * Xác thực mã OTP người dùng gửi lên so với khóa bí mật.
     * Hỗ trợ sai số múi giờ là +-1 khoảng thời gian (30 giây) để giảm lỗi lệch giờ.
     */
    public static boolean verifyOtp(String secret, String otp) {
        if (secret == null || otp == null || otp.length() != 6) {
            return false;
        }
        long currentInterval = System.currentTimeMillis() / 1000 / 30;
        for (int i = -1; i <= 1; i++) {
            if (generateTotp(secret, currentInterval + i).equals(otp)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Sinh mã TOTP từ khóa bí mật và khoảng thời gian (interval).
     */
    private static String generateTotp(String secret, long interval) {
        byte[] key = decodeBase32(secret);
        ByteBuffer buffer = ByteBuffer.allocate(8);
        buffer.putLong(interval);
        byte[] data = buffer.array();
        try {
            SecretKeySpec signKey = new SecretKeySpec(key, "HmacSHA1");
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(signKey);
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0xF;
            long truncatedHash = 0;
            for (int i = 0; i < 4; ++i) {
                truncatedHash <<= 8;
                truncatedHash |= (hash[offset + i] & 0xFF);
            }
            truncatedHash &= 0x7FFFFFFF;
            truncatedHash %= 1000000;
            return String.format("%06d", truncatedHash);
        } catch (GeneralSecurityException e) {
            throw new RuntimeException(e);
        }
    }
}
