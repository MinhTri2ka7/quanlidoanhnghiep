package com.quanlydn.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

    // Chuỗi mã hóa Base64 an toàn 256-bit
    @Value("${application.security.jwt.secret-key:dGVjaGNvcnBzZWNyZXRrZXkyNTZiaXRzdHJvbmdhbmRzZWN1cmVmb3Jqd3RzaWduaW5n}")
    private String secretKey;

    private static final long ACCESS_TOKEN_EXPIRATION = 15 * 60 * 1000; // 15 phút (ms)

    /**
     * Lấy SecretKey dạng HMAC-SHA phục vụ ký mã hóa.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Sinh Access Token chứa các Claims bắt buộc: userId, email, role, sessionId.
     */
    public String generateAccessToken(Long userId, String email, String role, String sessionId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        claims.put("role", role);
        claims.put("sessionId", sessionId);

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Giải mã và trích xuất tất cả Claims từ token.
     */
    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            logger.warn("Không thể giải mã JWT Token: {}", e.getMessage());
            throw new RuntimeException("JWT signature validation failed: " + e.getMessage());
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public String extractSessionId(String token) {
        return extractClaim(token, claims -> claims.get("sessionId", String.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Kiểm tra xem token đã hết hạn chưa.
     */
    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Tính toán thời gian còn lại của Access Token bằng phút.
     */
    public double getRemainingTimeInMinutes(String token) {
        try {
            Date expiration = extractExpiration(token);
            long diffMs = expiration.getTime() - System.currentTimeMillis();
            return (double) diffMs / 1000 / 60;
        } catch (Exception e) {
            return 0.0;
        }
    }
}
