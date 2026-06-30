package com.quanlydn.repository;

import com.quanlydn.entity.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomMemberRepo extends JpaRepository<ChatRoomMember, Long> {

    List<ChatRoomMember> findByRoomId(Long roomId);

    Optional<ChatRoomMember> findByRoomIdAndUserId(Long roomId, Long userId);

    boolean existsByRoomIdAndUserId(Long roomId, Long userId);

    List<ChatRoomMember> findByUserId(Long userId);

    void deleteByRoomIdAndUserId(Long roomId, Long userId);
}
