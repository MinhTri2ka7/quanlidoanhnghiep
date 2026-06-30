package com.quanlydn.util;

import com.quanlydn.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {

    public static User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }
        return null;
    }

    public static Long getCurrentCompanyId() {
        User user = getCurrentUser();
        return user != null ? user.getCompanyId() : null;
    }
}
