package com.quanlydn.controller;

import com.quanlydn.dto.ChatMessageDto;
import com.quanlydn.dto.ChatRoomDto;
import com.quanlydn.dto.FriendshipDto;
import com.quanlydn.dto.UserDto;
import com.quanlydn.entity.User;
import com.quanlydn.repository.UserRepo;
import com.quanlydn.service.AwsS3Service;
import com.quanlydn.service.ChatService;
import com.quanlydn.service.FriendshipService;
import com.quanlydn.util.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private FriendshipService friendshipService;

    @Autowired
    private AwsS3Service awsS3Service;

    @Autowired
    private UserRepo userRepo;

    /**
     * Re-fetch user từ DB để tránh LazyInitializationException
     * khi truy cập các quan hệ lazy như Role, Department từ SecurityContext.
     */
    private User getAuthenticatedUser() {
        User contextUser = SecurityUtil.getCurrentUser();
        if (contextUser == null) {
            throw new IllegalStateException("Người dùng chưa được xác thực.");
        }
        return userRepo.findById(contextUser.getId()).orElse(contextUser);
    }

    // --- Rooms Endpoints ---

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomDto>> getRooms() {
        User currentUser = getAuthenticatedUser();
        List<ChatRoomDto> rooms = chatService.getUserRooms(currentUser);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getRoomMessages(
            @PathVariable Long roomId,
            @RequestParam(value = "keyword", required = false) String keyword) {
        User currentUser = getAuthenticatedUser();
        List<ChatMessageDto> messages;
        if (keyword != null && !keyword.trim().isEmpty()) {
            messages = chatService.searchRoomMessages(roomId, keyword.trim(), currentUser);
        } else {
            messages = chatService.getRoomMessages(roomId, currentUser);
        }
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/rooms/private")
    public ResponseEntity<?> getOrCreatePrivateRoom(@RequestBody Map<String, Long> payload) {
        User currentUser = getAuthenticatedUser();
        Long otherUserId = payload.get("otherUserId");
        if (otherUserId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin otherUserId"));
        }
        try {
            ChatRoomDto room = chatService.getOrCreatePrivateRoom(currentUser, otherUserId);
            return ResponseEntity.ok(room);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rooms/group")
    public ResponseEntity<?> createGroupRoom(@RequestBody Map<String, Object> payload) {
        User currentUser = getAuthenticatedUser();
        String name = (String) payload.get("name");
        @SuppressWarnings("unchecked")
        List<Integer> memberIdsRaw = (List<Integer>) payload.get("memberIds");
        
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên nhóm không được để trống."));
        }

        List<Long> memberIds = new ArrayList<>();
        if (memberIdsRaw != null) {
            for (Integer id : memberIdsRaw) {
                memberIds.add(id.longValue());
            }
        }

        try {
            ChatRoomDto room = chatService.createGroupRoom(currentUser, name.trim(), memberIds);
            return ResponseEntity.status(HttpStatus.CREATED).body(room);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/rooms/group/{roomId}")
    public ResponseEntity<?> updateGroupName(@PathVariable Long roomId, @RequestBody Map<String, String> payload) {
        User currentUser = getAuthenticatedUser();
        String name = payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên nhóm không được để trống."));
        }
        try {
            chatService.updateGroupName(currentUser, roomId, name.trim());
            return ResponseEntity.ok(Map.of("message", "Cập nhật tên nhóm thành công."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rooms/group/{roomId}/members")
    public ResponseEntity<?> addGroupMembers(@PathVariable Long roomId, @RequestBody Map<String, List<Integer>> payload) {
        User currentUser = getAuthenticatedUser();
        List<Integer> userIdsRaw = payload.get("userIds");
        if (userIdsRaw == null || userIdsRaw.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Danh sách thành viên cần thêm trống."));
        }

        List<Long> userIds = new ArrayList<>();
        for (Integer id : userIdsRaw) {
            userIds.add(id.longValue());
        }

        try {
            chatService.addGroupMembers(currentUser, roomId, userIds);
            return ResponseEntity.ok(Map.of("message", "Thêm thành viên thành công."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/rooms/group/{roomId}/members/{userId}")
    public ResponseEntity<?> removeGroupMember(@PathVariable Long roomId, @PathVariable Long userId) {
        User currentUser = getAuthenticatedUser();
        try {
            chatService.removeGroupMember(currentUser, roomId, userId);
            return ResponseEntity.ok(Map.of("message", "Xóa thành viên khỏi nhóm thành công."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/rooms/group/{roomId}/members/{userId}/role")
    public ResponseEntity<?> updateGroupMemberRole(
            @PathVariable Long roomId,
            @PathVariable Long userId,
            @RequestBody Map<String, String> payload) {
        User currentUser = getAuthenticatedUser();
        String role = payload.get("role");
        if (role == null || role.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Quyền hạn không hợp lệ."));
        }
        try {
            chatService.updateGroupMemberRole(currentUser, roomId, userId, role.trim().toUpperCase());
            return ResponseEntity.ok(Map.of("message", "Cập nhật chức vụ thành công."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- Friendship Endpoints ---

    @GetMapping("/friends")
    public ResponseEntity<List<FriendshipDto>> getFriends() {
        User currentUser = getAuthenticatedUser();
        List<FriendshipDto> list = friendshipService.getFriends(currentUser);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/friends/pending")
    public ResponseEntity<List<FriendshipDto>> getPendingRequests() {
        User currentUser = getAuthenticatedUser();
        List<FriendshipDto> list = friendshipService.getPendingRequests(currentUser);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/friends/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> payload) {
        User currentUser = getAuthenticatedUser();
        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email không được để trống."));
        }
        try {
            FriendshipDto request = friendshipService.sendFriendRequest(currentUser, email.trim());
            return ResponseEntity.status(HttpStatus.CREATED).body(request);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/friends/request/{requestId}/accept")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable Long requestId) {
        User currentUser = getAuthenticatedUser();
        try {
            FriendshipDto request = friendshipService.acceptRequest(currentUser, requestId);
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/friends/request/{requestId}/reject")
    public ResponseEntity<?> rejectFriendRequest(@PathVariable Long requestId) {
        User currentUser = getAuthenticatedUser();
        try {
            FriendshipDto request = friendshipService.rejectRequest(currentUser, requestId);
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/friends/search")
    public ResponseEntity<?> searchUser(@RequestParam("email") String email) {
        User currentUser = getAuthenticatedUser();
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email không được để trống."));
        }
        UserDto userDto = friendshipService.searchUserByEmail(currentUser, email.trim());
        if (userDto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy người dùng này trong hệ thống công ty của bạn."));
        }
        return ResponseEntity.ok(userDto);
    }

    // --- Attachment Upload Endpoint ---

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAttachment(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn một file hợp lệ."));
            }
            String fileUrl = awsS3Service.uploadFile(file);
            return ResponseEntity.ok(Map.of(
                    "url", fileUrl,
                    "name", file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed",
                    "type", file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                    "size", file.getSize()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tải file lên hệ thống lưu trữ S3: " + e.getMessage()));
        }
    }
}
