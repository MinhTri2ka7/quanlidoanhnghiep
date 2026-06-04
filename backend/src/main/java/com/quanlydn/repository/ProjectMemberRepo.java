package com.quanlydn.repository;

import com.quanlydn.entity.ProjectMember;
import com.quanlydn.entity.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectMemberRepo extends JpaRepository<ProjectMember, ProjectMemberId> {

    List<ProjectMember> findByProjectId(Long projectId);

    List<ProjectMember> findByUserId(Long userId);
}
