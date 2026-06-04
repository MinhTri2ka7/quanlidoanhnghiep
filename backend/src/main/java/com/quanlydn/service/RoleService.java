package com.quanlydn.service;

import com.quanlydn.dto.RoleDto;
import com.quanlydn.entity.Role;
import com.quanlydn.repository.RoleRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {

    @Autowired
    private RoleRepo roleRepo;

    public List<RoleDto> getAllRoles() {
        List<Role> roles = roleRepo.findAll();

        return roles.stream()
                .map(this::toDto)
                .toList();
    }

    public RoleDto getRoleById(Long id) {
        Role role = roleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy role với id: " + id));

        return toDto(role);
    }

    public RoleDto createRole(RoleDto dto) {
        Role role = new Role();
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());

        Role saved = roleRepo.save(role);
        return toDto(saved);
    }

    public RoleDto updateRole(Long id, RoleDto dto) {
        Role role = roleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy role với id: " + id));

        role.setName(dto.getName());
        role.setDescription(dto.getDescription());

        Role saved = roleRepo.save(role);
        return toDto(saved);
    }

    public void deleteRole(Long id) {
        if (!roleRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy role với id: " + id);
        }
        roleRepo.deleteById(id);
    }

    private RoleDto toDto(Role role) {
        return new RoleDto(role.getId(), role.getName(), role.getDescription());
    }
}
