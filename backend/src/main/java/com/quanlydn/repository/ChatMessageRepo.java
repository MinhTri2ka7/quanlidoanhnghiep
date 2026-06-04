package com.quanlydn.repository;

import com.quanlydn.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepo extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByRoomIdOrderBySentAtAsc(Long roomId);
}
