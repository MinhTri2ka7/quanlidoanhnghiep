package com.quanlydn.controller;

import com.quanlydn.dto.ChatMessageDto;
import com.quanlydn.dto.UserDto;
import com.quanlydn.entity.User;
import com.quanlydn.repository.UserRepo;
import com.quanlydn.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Controller
public class WebSocketChatController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketChatController.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserRepo userRepo;

    /**
     * Lấy User từ Principal và re-fetch từ DB để tránh LazyInitializationException.
     */
    private User getUserFromPrincipal(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken) {
            Object principalObj = ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
            if (principalObj instanceof User contextUser) {
                // Re-fetch from DB to have full Hibernate session for lazy associations
                return userRepo.findById(contextUser.getId()).orElse(contextUser);
            }
        }
        throw new IllegalStateException("WebSocket user not authenticated.");
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(Principal principal, @Payload Map<String, Object> payload) {
        try {
            User sender = getUserFromPrincipal(principal);
            Long roomId = Long.valueOf(payload.get("roomId").toString());
            String message = (String) payload.get("message");
            String url = (String) payload.get("attachmentUrl");
            String name = (String) payload.get("attachmentName");
            String type = (String) payload.get("attachmentType");
            Long size = payload.get("attachmentSize") != null ? Long.valueOf(payload.get("attachmentSize").toString()) : null;

            ChatMessageDto chatMessageDto = chatService.saveMessage(roomId, sender, message, url, name, type, size);

            // Broadcast to the chat room
            messagingTemplate.convertAndSend("/topic/room/" + roomId, chatMessageDto);

            // Fetch room members and send notification to each offline/other member
            chatService.getUserRooms(sender).stream()
                    .filter(room -> room.getId().equals(roomId))
                    .findFirst()
                    .ifPresent(room -> {
                        List<UserDto> members = room.getMembers();
                        for (UserDto member : members) {
                            if (!member.getId().equals(sender.getId())) {
                                messagingTemplate.convertAndSend("/topic/notifications/" + member.getId(), Map.of(
                                        "type", "NEW_MESSAGE",
                                        "roomId", roomId,
                                        "roomName", room.getName(),
                                        "senderName", sender.getFullname(),
                                        "message", chatMessageDto.getMessage()
                                ));
                            }
                        }
                    });

        } catch (Exception e) {
            logger.error("Error processing sendMessage in WS: {}", e.getMessage());
        }
    }

    @MessageMapping("/chat.recallMessage")
    public void recallMessage(Principal principal, @Payload Map<String, Object> payload) {
        try {
            User user = getUserFromPrincipal(principal);
            Long messageId = Long.valueOf(payload.get("messageId").toString());
            Long roomId = Long.valueOf(payload.get("roomId").toString());

            ChatMessageDto recalledMsg = chatService.recallMessage(messageId, user);

            // Broadcast the recalled message state to all room subscribers
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/recall", Map.of(
                    "messageId", messageId,
                    "roomId", roomId,
                    "recalledMessage", recalledMsg
            ));
        } catch (Exception e) {
            logger.error("Error processing recallMessage in WS: {}", e.getMessage());
        }
    }

    @MessageMapping("/chat.seenMessage")
    public void seenMessage(Principal principal, @Payload Map<String, Object> payload) {
        try {
            User user = getUserFromPrincipal(principal);
            Long roomId = Long.valueOf(payload.get("roomId").toString());

            chatService.markAsSeen(roomId, user);

            // Broadcast seen receipt to room
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/seen", Map.of(
                    "roomId", roomId,
                    "userId", user.getId()
            ));
        } catch (Exception e) {
            logger.error("Error processing seenMessage in WS: {}", e.getMessage());
        }
    }

    @MessageMapping("/chat.typing")
    public void typing(Principal principal, @Payload Map<String, Object> payload) {
        try {
            User user = getUserFromPrincipal(principal);
            Long roomId = Long.valueOf(payload.get("roomId").toString());
            Boolean isTyping = (Boolean) payload.get("isTyping");

            // Broadcast typing status
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/typing", Map.of(
                    "roomId", roomId,
                    "userId", user.getId(),
                    "username", user.getFullname(),
                    "isTyping", isTyping
            ));
        } catch (Exception e) {
            logger.error("Error processing typing status in WS: {}", e.getMessage());
        }
    }
}
