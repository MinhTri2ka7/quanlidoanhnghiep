package com.quanlydn.controller;

import com.quanlydn.dto.ProjectDocumentDto;
import com.quanlydn.entity.User;
import com.quanlydn.service.ProjectDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/project")
public class ProjectDocumentController {

    @Autowired
    private ProjectDocumentService projectDocumentService;

    @PostMapping("/{projectId}/document")
    public ResponseEntity<?> uploadDocument(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn một file tài liệu để tải lên"));
            }

            // Lấy thông tin User hiện tại từ Spring Security Context
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            Long userId = 1L; // Fallback
            if (principal instanceof User) {
                userId = ((User) principal).getId();
            }

            ProjectDocumentDto dto = projectDocumentService.uploadDocument(projectId, file, userId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Lỗi khi tải tài liệu lên: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{projectId}/document")
    public ResponseEntity<List<ProjectDocumentDto>> getDocuments(@PathVariable Long projectId) {
        List<ProjectDocumentDto> docs = projectDocumentService.getDocumentsByProject(projectId);
        return ResponseEntity.ok(docs);
    }

    @DeleteMapping("/document/{documentId}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long documentId) {
        try {
            projectDocumentService.deleteDocument(documentId);
            return ResponseEntity.ok(Map.of("message", "Xóa tài liệu thành công"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Lỗi khi xóa tài liệu: " + e.getMessage()
            ));
        }
    }
}
