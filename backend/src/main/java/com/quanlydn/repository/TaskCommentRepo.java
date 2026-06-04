package com.quanlydn.repository;

import com.quanlydn.entity.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepo extends JpaRepository<TaskComment, Long> {

    List<TaskComment> findByTaskIdOrderByCreatedAtDesc(Long taskId);
}
