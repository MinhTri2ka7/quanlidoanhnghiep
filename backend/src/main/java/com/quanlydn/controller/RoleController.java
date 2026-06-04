package com.quanlydn.controller;

import com.quanlydn.dto.RoleDto;
import com.quanlydn.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/role")
public class RoleController {

    @Autowired
    private RoleService roleService;

    // GET /api/role — lấy tất cả roles
    @GetMapping
    public List<RoleDto> getAllRoles() {
        return roleService.getAllRoles();
    }

    // GET /api/role/{id} — lấy role theo id
    @GetMapping("/{id}")
    public RoleDto getRoleById(@PathVariable Long id) {
        return roleService.getRoleById(id);
    }

    // POST /api/role — tạo role mới
    @PostMapping
    public ResponseEntity<RoleDto> createRole(@Valid @RequestBody RoleDto roleDto) {
        RoleDto created = roleService.createRole(roleDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PUT /api/role/{id} — cập nhật role
    @PutMapping("/{id}")
    public RoleDto updateRole(@PathVariable Long id, @Valid @RequestBody RoleDto roleDto) {
        return roleService.updateRole(id, roleDto);
    }

    // DELETE /api/role/{id} — xóa role
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(Map.of("message", "Xóa role thành công"));
    }
}
