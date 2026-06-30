package com.quanlydn.config;

import com.quanlydn.entity.User;
import com.quanlydn.repository.UserRepo;
import com.quanlydn.service.JwtService;
import com.quanlydn.service.RedisSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;
import java.util.Optional;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RedisSessionService redisSessionService;

    @Autowired
    private UserRepo userRepo;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    String deviceIdHeader = accessor.getFirstNativeHeader("X-Device-ID");
                    String deviceId = (deviceIdHeader != null && !deviceIdHeader.isBlank()) ? deviceIdHeader : "default-device";

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            if (!jwtService.isTokenExpired(token)) {
                                Long userId = jwtService.extractUserId(token);
                                String email = jwtService.extractEmail(token);
                                String role = jwtService.extractRole(token);
                                String sessionId = jwtService.extractSessionId(token);

                                if (userId != null && email != null) {
                                    Optional<User> userOptional = userRepo.findById(userId);
                                    if (userOptional.isPresent()) {
                                        User dbUser = userOptional.get();
                                        if (dbUser.getIsActive() != null && dbUser.getIsActive()) {
                                            String formattedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                                    dbUser,
                                                    null,
                                                    Collections.singletonList(new SimpleGrantedAuthority(formattedRole))
                                            );
                                            accessor.setUser(authentication);
                                            logger.info("WebSocket STOMP connected & authenticated for User: {}", email);
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            logger.error("WebSocket Authentication error: {}", e.getMessage());
                        }
                    }
                }
                return message;
            }
        });
    }
}
