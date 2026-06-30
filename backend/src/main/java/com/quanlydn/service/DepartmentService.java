package com.quanlydn.service;

import com.quanlydn.dto.DepartmentDto;
import com.quanlydn.entity.Department;
import com.quanlydn.repository.DepartmentRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepo departmentRepo;

    @Autowired
    private com.quanlydn.repository.UserRepo userRepo;

    public List<DepartmentDto> getAllDepartments() {
        Long companyId = com.quanlydn.util.SecurityUtil.getCurrentCompanyId();
        List<Department> departments;
        if (companyId != null) {
            departments = departmentRepo.findByCompanyId(companyId);
        } else {
            departments = departmentRepo.findAll();
        }

        return departments.stream()
                .map(this::toDto)
                .toList();
    }

    public DepartmentDto getDepartmentById(Long id) {
        Department department = departmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy department với id: " + id));

        return toDto(department);
    }

    public DepartmentDto createDepartment(DepartmentDto dto) {
        Long companyId = com.quanlydn.util.SecurityUtil.getCurrentCompanyId();
        if (companyId != null) {
            if (departmentRepo.existsByNameAndCompanyId(dto.getName(), companyId)) {
                throw new RuntimeException("Department đã tồn tại trong công ty này: " + dto.getName());
            }
        } else {
            if (departmentRepo.existsByName(dto.getName())) {
                throw new RuntimeException("Department đã tồn tại: " + dto.getName());
            }
        }

        Department department = new Department();
        department.setName(dto.getName());
        department.setDescription(dto.getDescription());
        department.setCompanyId(companyId);

        Department saved = departmentRepo.save(department);
        return toDto(saved);
    }

    public DepartmentDto updateDepartment(Long id, DepartmentDto dto) {
        Department department = departmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy department với id: " + id));

        department.setName(dto.getName());
        department.setDescription(dto.getDescription());

        Department saved = departmentRepo.save(department);
        return toDto(saved);
    }

    public void deleteDepartment(Long id) {
        if (!departmentRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy department với id: " + id);
        }
        departmentRepo.deleteById(id);
    }

    private DepartmentDto toDto(Department department) {
        DepartmentDto dto = new DepartmentDto(department.getId(), department.getName(), department.getDescription());
        try {
            dto.setMemberCount(userRepo.countByDepartmentId(department.getId()));
        } catch (Exception e) {
            dto.setMemberCount(0L);
        }
        return dto;
    }
}
