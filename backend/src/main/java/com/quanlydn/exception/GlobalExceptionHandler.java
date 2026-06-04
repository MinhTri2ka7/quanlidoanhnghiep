package com.quanlydn.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Xử lý lỗi Validation (dữ liệu đầu vào không hợp lệ khi kiểm tra bằng @Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException exception) {
        Map<String, String> fieldErrorMap = new HashMap<>();
        List<FieldError> fieldErrorList = exception.getBindingResult().getFieldErrors();

        // Sử dụng vòng lặp for tường minh, dễ đọc theo đúng stylecode
        for (FieldError fieldError : fieldErrorList) {
            fieldErrorMap.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("error", "Dữ liệu đầu vào không hợp lệ");
        responseBody.put("errors", fieldErrorMap);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(responseBody);
    }

    // 2. Xử lý lỗi tham số không hợp lệ (IllegalArgumentException)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException exception) {
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("error", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(responseBody);
    }

    // 3. Xử lý các lỗi nghiệp vụ chung ném ra dưới dạng RuntimeException
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException exception) {
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("error", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(responseBody);
    }

    // 4. Xử lý tất cả các lỗi không xác định khác (Lỗi hệ thống 500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception exception) {
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("error", "Đã xảy ra lỗi hệ thống. Vui lòng liên hệ quản trị viên.");

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(responseBody);
    }
}
