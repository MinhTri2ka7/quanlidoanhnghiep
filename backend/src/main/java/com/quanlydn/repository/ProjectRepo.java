package com.quanlydn.repository;

import com.quanlydn.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepo extends JpaRepository<Project, Long> {

    List<Project> findByStatus(String status);

    List<Project> findByCreatedById(Long userId);
}
