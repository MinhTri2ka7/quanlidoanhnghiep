package com.quanlydn.repository;

import com.quanlydn.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRoomRepo extends JpaRepository<ChatRoom, Long> {
}
