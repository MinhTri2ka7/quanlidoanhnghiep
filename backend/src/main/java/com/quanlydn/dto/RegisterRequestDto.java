package com.quanlydn.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RegisterRequestDto {

    @Valid
    @NotNull(message = "Thông tin tài khoản đăng ký không được để trống")
    private CreateUserDto user;

    @NotBlank(message = "Mã xác nhận (OTP) không được để trống")
    private String otp;

    public CreateUserDto getUser() {
        return user;
    }

    public void setUser(CreateUserDto user) {
        this.user = user;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
