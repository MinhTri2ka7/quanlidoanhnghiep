package com.quanlydn.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateUserDto {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullname;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    private String avatar;
    private Long roleId;
    private Long departmentId;

    public String getFullname() {
        return fullname;
    }

    public void setFullname(String fullname) {
        this.fullname = fullname;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public Long getRoleId() {
        return roleId;
    }

    public void setRoleId(Long roleId) {
        this.roleId = roleId;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }
}
