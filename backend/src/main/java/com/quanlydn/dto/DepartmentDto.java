package com.quanlydn.dto;

import jakarta.validation.constraints.NotBlank;

public class DepartmentDto {

    private Long id;

    @NotBlank(message = "Tên phòng ban không được để trống")
    private String name;

    private String description;

    public DepartmentDto() {
    }

    public DepartmentDto(Long id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
