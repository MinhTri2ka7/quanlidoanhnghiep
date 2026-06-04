package com.quanlydn.controller;

import com.quanlydn.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    @Autowired
    private EmailService emailService;

    // POST /api/email/send-simple — Gửi email văn bản đơn giản
    @PostMapping("/send-simple")
    public ResponseEntity<?> sendSimpleEmail(@RequestBody Map<String, String> request) {
        String to = request.get("to");
        String subject = request.get("subject");
        String body = request.get("body");

        if (to == null || subject == null || body == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu các thông tin bắt buộc: to, subject, body"));
        }

        emailService.sendSimpleEmail(to, subject, body);
        return ResponseEntity.ok(Map.of("message", "Gửi email thành công tới " + to));
    }

    // POST /api/email/send-html — Gửi email định dạng HTML
    @PostMapping("/send-html")
    public ResponseEntity<?> sendHtmlEmail(@RequestBody Map<String, String> request) {
        String to = request.get("to");
        String subject = request.get("subject");
        String htmlContent = request.get("htmlContent");

        if (to == null || subject == null || htmlContent == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu các thông tin bắt buộc: to, subject, htmlContent"));
        }

        emailService.sendHtmlEmail(to, subject, htmlContent);
        return ResponseEntity.ok(Map.of("message", "Gửi HTML email thành công tới " + to));
    }
}
