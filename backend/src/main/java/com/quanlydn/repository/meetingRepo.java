package com.quanlydn.repository;

import com.quanlydn.entity.meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface meetingRepo extends JpaRepository<meeting, Long> {

    List<meeting> findByCreatedById(Long userId);
}
