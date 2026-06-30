package com.quanlydn.controller;

import com.quanlydn.dto.CreateProjectDto;
import com.quanlydn.dto.ProjectDto;
import com.quanlydn.entity.Project;
import com.quanlydn.entity.ProjectMember;
import com.quanlydn.entity.User;
import com.quanlydn.repository.ProjectMemberRepo;
import com.quanlydn.repository.ProjectRepo;
import com.quanlydn.repository.UserRepo;
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

    @Autowired
    private ProjectMemberRepo projectMemberRepo;

    @Autowired
    private ProjectRepo projectRepo;

    @Autowired
    private UserRepo userRepo;

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

    // GET /api/project/{id}/members — lấy danh sách thành viên dự án
    @GetMapping("/{id}/members")
    public List<Map<String, Object>> getProjectMembers(@PathVariable Long id) {
        List<ProjectMember> members = projectMemberRepo.findByProjectId(id);
        return members.stream().map(m -> {
            Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("id", m.getUser().getId());
            map.put("fullname", m.getUser().getFullname());
            map.put("email", m.getUser().getEmail());
            map.put("roleName", m.getUser().getRole() != null ? m.getUser().getRole().getName() : null);
            map.put("isActive", m.getUser().getIsActive());
            return map;
        }).toList();
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

    // POST /api/project/{id}/members — thêm thành viên vào dự án
    @PostMapping("/{id}/members")
    public ResponseEntity<?> addProjectMember(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        
        Long userId = body.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu userId"));
        }

        Project project = projectRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án với id: " + id));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên với id: " + userId));

        // Kiểm tra xem đã là thành viên chưa
        com.quanlydn.entity.ProjectMemberId pmId = new com.quanlydn.entity.ProjectMemberId(id, userId);
        if (projectMemberRepo.existsById(pmId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nhân viên đã có trong dự án này"));
        }

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        projectMemberRepo.save(member);

        return ResponseEntity.ok(Map.of("message", "Thêm thành viên vào dự án thành công"));
    }

    // DELETE /api/project/{id}/members/{userId} — xóa thành viên khỏi dự án
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<?> removeProjectMember(
            @PathVariable Long id,
            @PathVariable Long userId) {

        com.quanlydn.entity.ProjectMemberId pmId = new com.quanlydn.entity.ProjectMemberId(id, userId);
        if (!projectMemberRepo.existsById(pmId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nhân viên không thuộc dự án này"));
        }

        projectMemberRepo.deleteById(pmId);
        return ResponseEntity.ok(Map.of("message", "Xóa thành viên khỏi dự án thành công"));
    }
}
