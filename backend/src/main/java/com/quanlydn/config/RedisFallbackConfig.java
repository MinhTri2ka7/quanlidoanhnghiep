package com.quanlydn.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Configuration
public class RedisFallbackConfig {

    private static final Logger logger = LoggerFactory.getLogger(RedisFallbackConfig.class);

    @Bean
    @Primary
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new SmartFallbackRedisTemplate(connectionFactory);
    }

    private static class SmartFallbackRedisTemplate extends StringRedisTemplate {
        private final Map<String, String> memoryStore = new ConcurrentHashMap<>();
        private final Map<String, Long> expiryStore = new ConcurrentHashMap<>();
        private boolean useMemoryFallback = false;
        private final ValueOperations<String, String> memoryValueOps;

        public SmartFallbackRedisTemplate(RedisConnectionFactory connectionFactory) {
            super(connectionFactory);
            this.memoryValueOps = createMemoryValueOps();

            // Eagerly verify connection
            try {
                connectionFactory.getConnection().close();
                logger.info("Kết nối tới Redis server thành công!");
            } catch (Exception e) {
                logger.warn("Không thể kết nối tới Redis server. Hệ thống tự động chuyển sang chế độ In-Memory Fallback: " + e.getMessage());
                this.useMemoryFallback = true;
            }
        }

        @Override
        public ValueOperations<String, String> opsForValue() {
            if (useMemoryFallback) {
                return memoryValueOps;
            }
            try {
                return super.opsForValue();
            } catch (Exception e) {
                handleRedisError(e);
                return memoryValueOps;
            }
        }

        @Override
        public Boolean delete(String key) {
            if (useMemoryFallback) {
                boolean existed = memoryStore.remove(key) != null;
                expiryStore.remove(key);
                return existed;
            }
            try {
                return super.delete(key);
            } catch (Exception e) {
                handleRedisError(e);
                boolean existed = memoryStore.remove(key) != null;
                expiryStore.remove(key);
                return existed;
            }
        }

        @Override
        public Boolean expire(String key, long timeout, TimeUnit unit) {
            long expireAt = System.currentTimeMillis() + unit.toMillis(timeout);
            expiryStore.put(key, expireAt);
            if (useMemoryFallback) {
                return memoryStore.containsKey(key);
            }
            try {
                return super.expire(key, timeout, unit);
            } catch (Exception e) {
                handleRedisError(e);
                return memoryStore.containsKey(key);
            }
        }

        @Override
        public Long getExpire(String key) {
            if (useMemoryFallback) {
                return getMemoryKeyExpire(key);
            }
            try {
                return super.getExpire(key);
            } catch (Exception e) {
                handleRedisError(e);
                return getMemoryKeyExpire(key);
            }
        }

        private Long getMemoryKeyExpire(String key) {
            Long expireAt = expiryStore.get(key);
            if (expireAt == null) return -1L;
            long remaining = expireAt - System.currentTimeMillis();
            if (remaining <= 0) {
                memoryStore.remove(key);
                expiryStore.remove(key);
                return -2L;
            }
            return remaining / 1000;
        }

        private void handleRedisError(Exception e) {
            if (!useMemoryFallback) {
                logger.error("Redis gặp sự cố! Tự động kích hoạt In-Memory Fallback. Lỗi: " + e.getMessage());
                useMemoryFallback = true;
            }
        }

        @SuppressWarnings("unchecked")
        private ValueOperations<String, String> createMemoryValueOps() {
            return (ValueOperations<String, String>) Proxy.newProxyInstance(
                    ValueOperations.class.getClassLoader(),
                    new Class<?>[]{ValueOperations.class},
                    (proxy, method, args) -> {
                        String methodName = method.getName();
                        
                        cleanExpiredKeys();

                        if ("get".equals(methodName)) {
                            String key = (String) args[0];
                            return memoryStore.get(key);
                        } else if ("set".equals(methodName)) {
                            String key = (String) args[0];
                            String val = (String) args[1];
                            memoryStore.put(key, val);
                            if (args.length > 2) {
                                long timeout = (long) args[2];
                                TimeUnit unit = (TimeUnit) args[3];
                                expiryStore.put(key, System.currentTimeMillis() + unit.toMillis(timeout));
                            }
                            return null;
                        } else if ("increment".equals(methodName)) {
                            String key = (String) args[0];
                            String currentVal = memoryStore.get(key);
                            long newVal = 1;
                            if (currentVal != null) {
                                try {
                                    newVal = Long.parseLong(currentVal) + 1;
                                } catch (NumberFormatException ignored) {}
                            }
                            memoryStore.put(key, String.valueOf(newVal));
                            return newVal;
                        }
                        
                        return null;
                    }
            );
        }

        private void cleanExpiredKeys() {
            long now = System.currentTimeMillis();
            expiryStore.forEach((key, expireAt) -> {
                if (expireAt <= now) {
                    memoryStore.remove(key);
                    expiryStore.remove(key);
                }
            });
        }
    }
}
