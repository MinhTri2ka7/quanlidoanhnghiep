package com.quanlydn.controller;

import com.quanlydn.dto.DepartmentDto;
import com.quanlydn.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/department")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    // GET /api/department — lấy danh sách tất cả phòng ban
    @GetMapping
    public List<DepartmentDto> getAllDepartments() {
        return departmentService.getAllDepartments();
    }

    // GET /api/department/{id} — lấy phòng ban theo id
    @GetMapping("/{id}")
    public DepartmentDto getDepartmentById(@PathVariable Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Id phòng ban không được để trống");
        }
        return departmentService.getDepartmentById(id);
    }

    // POST /api/department — tạo phòng ban mới
    @PostMapping
    public ResponseEntity<DepartmentDto> createDepartment(@Valid @RequestBody DepartmentDto departmentDto) {
        DepartmentDto created = departmentService.createDepartment(departmentDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PUT /api/department/{id} — cập nhật phòng ban
    @PutMapping("/{id}")
    public DepartmentDto updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentDto departmentDto) {
        if (id == null) {
            throw new IllegalArgumentException("Id phòng ban không được để trống");
        }
        return departmentService.updateDepartment(id, departmentDto);
    }

    // DELETE /api/department/{id} — xóa phòng ban
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Id phòng ban không được để trống");
        }
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(Map.of("message", "Xóa phòng ban thành công"));
    }
}
