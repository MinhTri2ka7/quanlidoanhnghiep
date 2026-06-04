package com.quanlydn.controller;

import com.quanlydn.dto.CreateTaskDto;
import com.quanlydn.dto.TaskDto;
import com.quanlydn.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/task")
public class TaskController {

    @Autowired
    private TaskService taskService;

    // GET /api/task — lấy danh sách tất cả tasks
    @GetMapping
    public List<TaskDto> getAllTasks() {
        return taskService.getAllTasks();
    }

    // GET /api/task/project/{projectId} — lấy tasks theo dự án
    @GetMapping("/project/{projectId}")
    public List<TaskDto> getTasksByProject(@PathVariable Long projectId) {
        if (projectId == null) {
            throw new IllegalArgumentException("Id dự án không được để trống");
        }
        return taskService.getTasksByProject(projectId);
    }

    // GET /api/task/user/{userId} — lấy tasks theo nhân viên được giao
    @GetMapping("/user/{userId}")
    public List<TaskDto> getTasksByUser(@PathVariable Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Id user không được để trống");
        }
        return taskService.getTasksByUser(userId);
    }

    // GET /api/task/{id} — lấy chi tiết task theo id
    @GetMapping("/{id}")
    public TaskDto getTaskById(@PathVariable Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Id task không được để trống");
        }
        return taskService.getTaskById(id);
    }

    // POST /api/task — tạo task mới
    @PostMapping
    public ResponseEntity<TaskDto> createTask(
            @Valid @RequestBody CreateTaskDto createTaskDto,
            @RequestParam(value = "createdBy", required = false, defaultValue = "1") Long createdByUserId) {
        
        TaskDto created = taskService.createTask(createTaskDto, createdByUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PATCH /api/task/{id}/status — cập nhật trạng thái của task
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        
        if (id == null) {
            throw new IllegalArgumentException("Id task không được để trống");
        }
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Trạng thái không được để trống");
        }
        
        taskService.updateStatus(id, status);
        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái task thành công"));
    }

    // DELETE /api/task/{id} — xóa task
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Id task không được để trống");
        }
        taskService.deleteTask(id);
        return ResponseEntity.ok(Map.of("message", "Xóa task thành công"));
    }
}
