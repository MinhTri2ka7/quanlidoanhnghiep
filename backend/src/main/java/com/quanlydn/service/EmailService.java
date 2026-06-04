package com.quanlydn.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Gửi email văn bản đơn giản (Simple Text Email)
     *
     * @param to      Địa chỉ email người nhận
     * @param subject Tiêu đề email
     * @param body    Nội dung văn bản của email
     */
    public void sendSimpleEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            logger.info("Email đã được gửi thành công tới: {}", to);
        } catch (Exception e) {
            logger.error("Lỗi khi gửi email đơn giản tới {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Gửi email thất bại: " + e.getMessage());
        }
    }

    /**
     * Gửi email định dạng HTML đẹp mắt
     *
     * @param to      Địa chỉ email người nhận
     * @param subject Tiêu đề email
     * @param htmlContent Nội dung HTML của email
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true chỉ định nội dung là HTML

            mailSender.send(message);
            logger.info("HTML email đã được gửi thành công tới: {}", to);
        } catch (MessagingException e) {
            logger.error("Lỗi khi gửi HTML email tới {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Gửi HTML email thất bại: " + e.getMessage());
        }
    }

    /**
     * Gửi email kèm theo tệp đính kèm (Attachment)
     *
     * @param to       Địa chỉ email người nhận
     * @param subject  Tiêu đề email
     * @param body     Nội dung email
     * @param filePath Đường dẫn tệp đính kèm trên server
     */
    public void sendEmailWithAttachment(String to, String subject, String body, String filePath) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            File file = new File(filePath);
            if (file.exists()) {
                FileSystemResource fileSystemResource = new FileSystemResource(file);
                helper.addAttachment(file.getName(), fileSystemResource);
            } else {
                logger.warn("Tệp đính kèm không tồn tại ở đường dẫn: {}. Email vẫn được gửi đi mà không có đính kèm.", filePath);
            }

            mailSender.send(message);
            logger.info("Email kèm tệp đính kèm đã được gửi thành công tới: {}", to);
        } catch (MessagingException e) {
            logger.error("Lỗi khi gửi email kèm đính kèm tới {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Gửi email kèm đính kèm thất bại: " + e.getMessage());
        }
    }
}
