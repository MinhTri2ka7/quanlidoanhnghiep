package com.quanlydn.security;

import com.quanlydn.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    // A test 256-bit base64 encoded secret key
    private final String secretKey = "dGVjaGNvcnBzZWNyZXRrZXkyNTZiaXRzdHJvbmdhbmRzZWN1cmVmb3Jqd3RzaWduaW5n";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
    }

    @Test
    void testGenerateAndParseToken() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "ADMIN";
        String sessionId = "session-uuid-123456";

        String token = jwtService.generateAccessToken(userId, email, role, sessionId);
        assertNotNull(token);
        assertTrue(token.length() > 0);

        // Extract claims
        assertEquals(userId, jwtService.extractUserId(token));
        assertEquals(email, jwtService.extractEmail(token));
        assertEquals(role, jwtService.extractRole(token));
        assertEquals(sessionId, jwtService.extractSessionId(token));
        
        assertFalse(jwtService.isTokenExpired(token));
        
        double remainingMinutes = jwtService.getRemainingTimeInMinutes(token);
        assertTrue(remainingMinutes > 14.0 && remainingMinutes <= 15.0);
    }

    @Test
    void testTokenExpiration() {
        assertTrue(jwtService.isTokenExpired("invalid-token"));
    }
}
