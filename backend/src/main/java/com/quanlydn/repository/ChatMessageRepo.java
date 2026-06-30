package com.quanlydn.repository;

import com.quanlydn.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepo extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByRoomIdOrderBySentAtAsc(Long roomId);

    @Query("SELECT m FROM ChatMessage m WHERE m.room.id = :roomId AND LOWER(m.message) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY m.sentAt Asc")
    List<ChatMessage> searchMessages(@Param("roomId") Long roomId, @Param("keyword") String keyword);

    ChatMessage findFirstByRoomIdOrderBySentAtDesc(Long roomId);

    Long countByRoomIdAndSenderIdNotAndSeenAtIsNull(Long roomId, Long senderId);
}
