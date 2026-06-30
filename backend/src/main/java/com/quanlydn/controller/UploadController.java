package com.quanlydn.controller;

import com.quanlydn.entity.User;
import com.quanlydn.repository.UserRepo;
import com.quanlydn.service.AwsS3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Autowired
    private AwsS3Service awsS3Service;

    @Autowired
    private UserRepo userRepo;

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn một file hình ảnh"));
            }

            // 1. Tải file lên AWS S3
            String fileUrl = awsS3Service.uploadFile(file);

            // 2. Lấy thông tin User hiện tại từ Spring Security Context
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof User) {
                User securityUser = (User) principal;
                Optional<User> userOptional = userRepo.findById(securityUser.getId());
                if (userOptional.isPresent()) {
                    User dbUser = userOptional.get();
                    dbUser.setAvatar(fileUrl);
                    userRepo.save(dbUser);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật ảnh đại diện thành công",
                    "avatarUrl", fileUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Lỗi khi tải ảnh lên S3: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/storage-size")
    public ResponseEntity<?> getStorageSize() {
        try {
            long totalSizeBytes = awsS3Service.getTotalStorageSize();
            return ResponseEntity.ok(Map.of("totalSizeBytes", totalSizeBytes));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Lỗi khi lấy thông tin dung lượng lưu trữ: " + e.getMessage()
            ));
        }
    }
}
