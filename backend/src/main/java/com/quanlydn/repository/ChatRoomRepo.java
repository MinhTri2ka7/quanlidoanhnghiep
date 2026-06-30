package com.quanlydn.repository;

import com.quanlydn.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepo extends JpaRepository<ChatRoom, Long> {

    @Query("SELECT r FROM ChatRoom r WHERE " +
           "EXISTS (SELECT m FROM ChatRoomMember m WHERE m.room = r AND m.user.id = :userId) OR " +
           "(r.type = 'PROJECT' AND (r.project.manager.id = :userId OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.project = r.project AND pm.user.id = :userId))) OR " +
           "(r.type = 'DEPARTMENT' AND EXISTS (SELECT u FROM User u WHERE u.id = :userId AND u.department = r.department)) OR " +
           "(r.type = 'COMPANY' AND EXISTS (SELECT u FROM User u WHERE u.id = :userId AND u.companyId = r.companyId))")
    List<ChatRoom> findRoomsForUser(@Param("userId") Long userId);

    @Query("SELECT m1.room FROM ChatRoomMember m1 JOIN ChatRoomMember m2 ON m1.room.id = m2.room.id WHERE m1.user.id = :userId1 AND m2.user.id = :userId2 AND m1.room.type = 'PRIVATE'")
    Optional<ChatRoom> findPrivateRoom(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    Optional<ChatRoom> findByProjectId(Long projectId);

    Optional<ChatRoom> findByDepartmentId(Long departmentId);

    List<ChatRoom> findByCompanyIdAndType(Long companyId, String type);
}
