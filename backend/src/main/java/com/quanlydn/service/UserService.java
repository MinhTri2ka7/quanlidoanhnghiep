package com.quanlydn.service;

import com.quanlydn.dto.CreateUserDto;
import com.quanlydn.dto.UpdateUserDto;
import com.quanlydn.dto.UserDto;
import com.quanlydn.entity.Department;
import com.quanlydn.entity.Role;
import com.quanlydn.entity.User;
import com.quanlydn.repository.DepartmentRepo;
import com.quanlydn.repository.RoleRepo;
import com.quanlydn.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private DepartmentRepo departmentRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserDto> getAllUsers() {
        Long companyId = com.quanlydn.util.SecurityUtil.getCurrentCompanyId();
        List<User> users;
        if (companyId != null) {
            users = userRepo.findByCompanyId(companyId);
        } else {
            users = userRepo.findAll();
        }

        return users.stream()
                .map(this::toDto)
                .toList();
    }

    public UserDto getUserById(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id: " + id));

        return toDto(user);
    }

    public UserDto createUser(CreateUserDto dto) {
        if (userRepo.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã tồn tại: " + dto.getEmail());
        }

        User user = new User();
        user.setFullname(dto.getFullname());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setPhone(dto.getPhone());

        User currentUser = com.quanlydn.util.SecurityUtil.getCurrentUser();
        if (currentUser != null) {
            user.setCompanyId(currentUser.getCompanyId());
            // Lookup Role entity from DB (default roleId = 1 nếu không truyền)
            Long roleId = dto.getRoleId() != null ? dto.getRoleId() : 1L;
            Role role = roleRepo.findById(roleId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy role với id: " + roleId));
            user.setRole(role);
        } else {
            // Registration case: force role Admin (3L)
            Role adminRole = roleRepo.findById(3L)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy role Admin"));
            user.setRole(adminRole);
        }

        if (dto.getDepartmentId() != null) {
            Department department = departmentRepo.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy department với id: " + dto.getDepartmentId()));
            user.setDepartment(department);
        }

        User saved = userRepo.save(user);

        if (currentUser == null) {
            // Registration: set companyId to saved user's id
            saved.setCompanyId(saved.getId());
            saved = userRepo.save(saved);
        }

        return toDto(saved);
    }

    public UserDto updateUser(Long id, UpdateUserDto dto) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id: " + id));

        if (dto.getFullname() != null) {
            user.setFullname(dto.getFullname());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getAvatar() != null) {
            user.setAvatar(dto.getAvatar());
        }
        if (dto.getRoleId() != null) {
            Role role = roleRepo.findById(dto.getRoleId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy role với id: " + dto.getRoleId()));
            user.setRole(role);
        }
        if (Boolean.TRUE.equals(dto.getRemoveDepartment())) {
            user.setDepartment(null);
        } else if (dto.getDepartmentId() != null) {
            Department department = departmentRepo.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy department với id: " + dto.getDepartmentId()));
            user.setDepartment(department);
        }

        User saved = userRepo.save(user);
        return toDto(saved);
    }

    public void deleteUser(Long id) {
        if (!userRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy user với id: " + id);
        }
        userRepo.deleteById(id);
    }

    public void toggleActive(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id: " + id));

        user.setIsActive(!user.getIsActive());
        userRepo.save(user);
    }
    public Optional<User> findUserByEmail(String email) {
        return userRepo.findByEmail(email);
    }

    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFullname(user.getFullname());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setAvatar(user.getAvatar());
        dto.setIsActive(user.getIsActive());
        dto.setIsTwoFactorEnabled(user.getIsTwoFactorEnabled());
        dto.setCompanyId(user.getCompanyId());

        if (user.getRole() != null) {
            dto.setRoleName(user.getRole().getName());
        }
        if (user.getDepartment() != null) {
            dto.setDepartmentName(user.getDepartment().getName());
        }

        return dto;
    }
}
