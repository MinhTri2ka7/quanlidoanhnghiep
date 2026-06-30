package com.quanlydn.repository;

import com.quanlydn.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByCompanyId(Long companyId);

    Long countByDepartmentId(Long departmentId);

    List<User> findByDepartmentId(Long departmentId);
}
