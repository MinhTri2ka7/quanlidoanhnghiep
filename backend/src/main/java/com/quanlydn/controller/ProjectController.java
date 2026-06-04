package com.quanlydn.controller;

import com.quanlydn.dto.CreateProjectDto;
import com.quanlydn.dto.ProjectDto;
import com.quanlydn.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/project")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    // GET /api/project — lấy danh sách tất cả dự án
    @GetMapping
    public List<ProjectDto> getAllProjects() {
        return projectService.getAllProjects();
    }

    // GET /api/project/{id} — lấy dự án theo id
    @GetMapping("/{id}")
    public ProjectDto getProjectById(@PathVariable Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Id dự án không được để trống");
        }
        return projectService.getProjectById(id);
    }

    // POST /api/project — tạo dự án mới (createdBy truyền qua request param hoặc mặc định là 1)
    @PostMapping
    public ResponseEntity<ProjectDto> createProject(
            @Valid @RequestBody CreateProjectDto createProjectDto,
            @RequestParam(value = "createdBy", required = false, defaultValue = "1") Long createdByUserId) {
        
        ProjectDto created = projectService.createProject(createProjectDto, createdByUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PUT /api/project/{id} — cập nhật dự án
    @PutMapping("/{id}")
    public ProjectDto updateProject(
            @PathVariable Long id, 
            @Valid @RequestBody CreateProjectDto createProjectDto) {
        
        if (id == null) {
            throw new IllegalArgumentException("Id dự án không được để trống");
        }
        
        return projectService.updateProject(id, createProjectDto);
    }

    // PATCH /api/project/{id}/status — cập nhật trạng thái của dự án
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> body) {
        
        if (id == null) {
            throw new IllegalArgumentException("Id dự án không được để trống");
        }
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Trạng thái không được để trống");
        }
        
        projectService.updateStatus(id, status);
        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái dự án thành công"));
    }

    // DELETE /api/project/{id} — xóa dự án
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Id dự án không được để trống");
        }
        projectService.deleteProject(id);
        return ResponseEntity.ok(Map.of("message", "Xóa dự án thành công"));
    }
}
