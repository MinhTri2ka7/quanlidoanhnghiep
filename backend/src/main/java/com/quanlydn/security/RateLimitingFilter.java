package com.quanlydn.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);

    @Value("${rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${rate-limit.limit:100}")
    private int limit;

    @Value("${rate-limit.duration-seconds:60}")
    private int durationSeconds;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip rate limiting if not enabled
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        // We only rate limit API requests (e.g., under /api/**)
        String requestUri = request.getRequestURI();
        if (!requestUri.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String redisKey = "rate:limit:ip:" + clientIp;

        try {
            Long currentRequests = redisTemplate.opsForValue().increment(redisKey);
            if (currentRequests != null) {
                if (currentRequests == 1) {
                    redisTemplate.expire(redisKey, durationSeconds, TimeUnit.SECONDS);
                } else {
                    Long ttl = redisTemplate.getExpire(redisKey);
                    if (ttl != null && ttl == -1) {
                        redisTemplate.expire(redisKey, durationSeconds, TimeUnit.SECONDS);
                    }
                }

                if (currentRequests > limit) {
                    logger.warn("IP [{}] exceeded rate limit ({} requests). Request blocked: {}", clientIp, limit, requestUri);
                    sendErrorResponse(response, HttpStatus.TOO_MANY_REQUESTS, "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.");
                    return;
                }
            }
        } catch (Exception e) {
            // If Redis is down, we log the error but allow requests to go through (Fail-Open behavior)
            logger.error("Lỗi khi xử lý RateLimitingFilter (Redis có thể gặp sự cố): {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private void sendErrorResponse(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json;charset=UTF-8");

        String jsonBody = String.format(
                "{\"status\": %d, \"error\": \"%s\", \"message\": \"%s\"}",
                status.value(),
                status.getReasonPhrase(),
                message
        );

        response.getWriter().write(jsonBody);
    }
}
