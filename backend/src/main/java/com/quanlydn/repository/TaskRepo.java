package com.quanlydn.repository;

import com.quanlydn.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepo extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByAssignedToId(Long userId);

    List<Task> findByStatus(String status);

    List<Task> findByProjectIdAndStatus(Long projectId, String status);
}
