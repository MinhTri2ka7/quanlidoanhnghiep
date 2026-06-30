package com.quanlydn.repository;

import com.quanlydn.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepo extends JpaRepository<Department, Long> {

    Optional<Department> findByName(String name);

    boolean existsByName(String name);

    List<Department> findByCompanyId(Long companyId);

    boolean existsByNameAndCompanyId(String name, Long companyId);

    Optional<Department> findByNameAndCompanyId(String name, Long companyId);
}
