package com.quanlydn.service;

import com.quanlydn.dto.ChatMessageDto;
import com.quanlydn.dto.ChatRoomDto;
import com.quanlydn.dto.UserDto;
import com.quanlydn.entity.*;
import com.quanlydn.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class ChatService {

    @Autowired
    private ChatRoomRepo chatRoomRepo;

    @Autowired
    private ChatRoomMemberRepo chatRoomMemberRepo;

    @Autowired
    private ChatMessageRepo chatMessageRepo;

    @Autowired
    private FriendshipRepo friendshipRepo;

    @Autowired
    private ProjectRepo projectRepo;

    @Autowired
    private ProjectMemberRepo projectMemberRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private FriendshipService friendshipService;

    // Track online users in memory
    private static final Set<Long> onlineUserIds = ConcurrentHashMap.newKeySet();

    public void setUserOnline(Long userId, boolean online) {
        if (online) {
            onlineUserIds.add(userId);
        } else {
            onlineUserIds.remove(userId);
        }
    }

    public boolean isUserOnline(Long userId) {
        return onlineUserIds.contains(userId);
    }

    public ChatMessageDto convertToChatMessageDto(ChatMessage msg) {
        if (msg == null) return null;
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(msg.getId());
        dto.setRoomId(msg.getRoom().getId());
        dto.setSenderId(msg.getSender().getId());
        dto.setSenderName(msg.getSender().getFullname());
        dto.setSenderAvatar(msg.getSender().getAvatar());
        dto.setMessage(msg.getMessage());
        dto.setSentAt(msg.getSentAt());
        dto.setIsRecalled(msg.getIsRecalled());
        dto.setSeenAt(msg.getSeenAt());
        dto.setAttachmentUrl(msg.getAttachmentUrl());
        dto.setAttachmentName(msg.getAttachmentName());
        dto.setAttachmentType(msg.getAttachmentType());
        dto.setAttachmentSize(msg.getAttachmentSize());
        return dto;
    }

    public List<UserDto> getRoomMembers(ChatRoom room) {
        List<UserDto> members = new ArrayList<>();
        if ("PROJECT".equals(room.getType())) {
            Project project = room.getProject();
            if (project != null) {
                if (project.getManager() != null) {
                    members.add(friendshipService.convertToUserDto(project.getManager()));
                }
                List<ProjectMember> pmList = projectMemberRepo.findByProjectId(project.getId());
                for (ProjectMember pm : pmList) {
                    if (project.getManager() == null || !pm.getUser().getId().equals(project.getManager().getId())) {
                        members.add(friendshipService.convertToUserDto(pm.getUser()));
                    }
                }
            }
        } else if ("DEPARTMENT".equals(room.getType())) {
            Department department = room.getDepartment();
            if (department != null) {
                List<User> userList = userRepo.findByDepartmentId(department.getId());
                for (User u : userList) {
                    members.add(friendshipService.convertToUserDto(u));
                }
            }
        } else if ("COMPANY".equals(room.getType())) {
            if (room.getCompanyId() != null) {
                List<User> userList = userRepo.findByCompanyId(room.getCompanyId());
                for (User u : userList) {
                    members.add(friendshipService.convertToUserDto(u));
                }
            }
        } else {
            List<ChatRoomMember> crmList = chatRoomMemberRepo.findByRoomId(room.getId());
            for (ChatRoomMember crm : crmList) {
                members.add(friendshipService.convertToUserDto(crm.getUser()));
            }
        }
        return members;
    }

    public ChatRoomDto convertToChatRoomDto(ChatRoom room, User currentUser) {
        if (room == null) return null;
        ChatRoomDto dto = new ChatRoomDto();
        dto.setId(room.getId());
        dto.setType(room.getType());
        dto.setCompanyId(room.getCompanyId());
        dto.setCreatedAt(room.getCreatedAt());

        if (room.getProject() != null) {
            dto.setProjectId(room.getProject().getId());
            dto.setProjectName(room.getProject().getName());
        }

        if (room.getDepartment() != null) {
            dto.setDepartmentId(room.getDepartment().getId());
            dto.setDepartmentName(room.getDepartment().getName());
        }

        // Resolve room members
        List<UserDto> members = getRoomMembers(room);
        dto.setMembers(members);

        // Resolve room name
        if ("PRIVATE".equals(room.getType())) {
            UserDto other = members.stream()
                    .filter(u -> !u.getId().equals(currentUser.getId()))
                    .findFirst()
                    .orElse(null);
            if (other != null) {
                dto.setName(other.getFullname());
            } else {
                dto.setName("Trò chuyện cá nhân");
            }
        } else if ("PROJECT".equals(room.getType())) {
            dto.setName(room.getProject() != null ? room.getProject().getName() : room.getName());
        } else if ("DEPARTMENT".equals(room.getType())) {
            dto.setName(room.getDepartment() != null ? "Phòng " + room.getDepartment().getName() : room.getName());
        } else if ("COMPANY".equals(room.getType())) {
            dto.setName("Nhóm nhân viên tổng cty");
        } else {
            dto.setName(room.getName());
        }

        // Get last message details
        ChatMessage lastMsg = chatMessageRepo.findFirstByRoomIdOrderBySentAtDesc(room.getId());
        if (lastMsg != null) {
            if (Boolean.TRUE.equals(lastMsg.getIsRecalled())) {
                dto.setLastMessage("Tin nhắn đã bị thu hồi");
            } else if (lastMsg.getAttachmentUrl() != null) {
                dto.setLastMessage("[Tệp đính kèm]");
            } else {
                dto.setLastMessage(lastMsg.getMessage());
            }
            dto.setLastMessageTime(lastMsg.getSentAt());
            dto.setLastMessageSenderName(lastMsg.getSender().getFullname());
        }

        // Unread Count
        Long unread = chatMessageRepo.countByRoomIdAndSenderIdNotAndSeenAtIsNull(room.getId(), currentUser.getId());
        dto.setUnreadCount(unread);

        return dto;
    }

    public List<ChatRoomDto> getUserRooms(User currentUser) {
        List<ChatRoom> rooms = chatRoomRepo.findRoomsForUser(currentUser.getId());
        
        // Auto create project chat rooms if any participating projects don't have them yet
        // First list user's projects
        List<Project> userProjects = projectRepo.findByCompanyId(currentUser.getCompanyId());
        for (Project p : userProjects) {
            // Check if user belongs to this project
            boolean isMember = (p.getManager() != null && p.getManager().getId().equals(currentUser.getId())) 
                    || projectMemberRepo.findByProjectId(p.getId()).stream().anyMatch(pm -> pm.getUser().getId().equals(currentUser.getId()));
            
            if (isMember) {
                Optional<ChatRoom> projRoomOpt = chatRoomRepo.findByProjectId(p.getId());
                if (projRoomOpt.isEmpty()) {
                    ChatRoom newProjRoom = new ChatRoom();
                    newProjRoom.setName(p.getName());
                    newProjRoom.setType("PROJECT");
                    newProjRoom.setProject(p);
                    newProjRoom.setCompanyId(p.getCompanyId());
                    chatRoomRepo.save(newProjRoom);
                    rooms.add(newProjRoom);
                }
            }
        }

        // Auto create department chat room if user has a department and it doesn't have a chat room yet
        if (currentUser.getDepartment() != null) {
            Department dept = currentUser.getDepartment();
            Optional<ChatRoom> deptRoomOpt = chatRoomRepo.findByDepartmentId(dept.getId());
            if (deptRoomOpt.isEmpty()) {
                ChatRoom newDeptRoom = new ChatRoom();
                newDeptRoom.setName(dept.getName());
                newDeptRoom.setType("DEPARTMENT");
                newDeptRoom.setDepartment(dept);
                newDeptRoom.setCompanyId(dept.getCompanyId());
                chatRoomRepo.save(newDeptRoom);
                rooms.add(newDeptRoom);
            }
        }

        // Auto create company chat room if user has a companyId and it doesn't have a chat room yet
        if (currentUser.getCompanyId() != null) {
            List<ChatRoom> compRooms = chatRoomRepo.findByCompanyIdAndType(currentUser.getCompanyId(), "COMPANY");
            if (compRooms.isEmpty()) {
                ChatRoom newCompRoom = new ChatRoom();
                newCompRoom.setName("Nhóm nhân viên tổng cty");
                newCompRoom.setType("COMPANY");
                newCompRoom.setCompanyId(currentUser.getCompanyId());
                chatRoomRepo.save(newCompRoom);
                rooms.add(newCompRoom);
            }
        }

        List<ChatRoomDto> dtos = new ArrayList<>();
        for (ChatRoom r : rooms) {
            dtos.add(convertToChatRoomDto(r, currentUser));
        }
        
        // Sort rooms by last message time or creation time descending
        dtos.sort((a, b) -> {
            LocalDateTime ta = a.getLastMessageTime() != null ? a.getLastMessageTime() : a.getCreatedAt();
            LocalDateTime tb = b.getLastMessageTime() != null ? b.getLastMessageTime() : b.getCreatedAt();
            if (ta == null || tb == null) return 0;
            return tb.compareTo(ta);
        });

        return dtos;
    }

    @Transactional
    public ChatRoomDto getOrCreatePrivateRoom(User currentUser, Long otherUserId) {
        if (currentUser.getId().equals(otherUserId)) {
            throw new IllegalArgumentException("Không thể tạo phòng chat với chính mình.");
        }

        // Enforce friendship verification
        boolean areFriends = friendshipRepo.areFriends(currentUser.getId(), otherUserId);
        if (!areFriends) {
            throw new IllegalArgumentException("Chỉ bạn bè mới được nhắn tin riêng.");
        }

        Optional<ChatRoom> existing = chatRoomRepo.findPrivateRoom(currentUser.getId(), otherUserId);
        if (existing.isPresent()) {
            return convertToChatRoomDto(existing.get(), currentUser);
        }

        User otherUser = userRepo.findById(otherUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng này."));

        ChatRoom room = new ChatRoom();
        room.setType("PRIVATE");
        room.setCompanyId(currentUser.getCompanyId());
        ChatRoom savedRoom = chatRoomRepo.save(room);

        // Add both to ChatRoomMember
        ChatRoomMember m1 = new ChatRoomMember();
        m1.setRoom(savedRoom);
        m1.setUser(currentUser);
        m1.setRole("MEMBER");
        chatRoomMemberRepo.save(m1);

        ChatRoomMember m2 = new ChatRoomMember();
        m2.setRoom(savedRoom);
        m2.setUser(otherUser);
        m2.setRole("MEMBER");
        chatRoomMemberRepo.save(m2);

        return convertToChatRoomDto(savedRoom, currentUser);
    }

    @Transactional
    public ChatRoomDto createGroupRoom(User owner, String name, List<Long> memberIds) {
        ChatRoom room = new ChatRoom();
        room.setName(name);
        room.setType("GROUP");
        room.setCompanyId(owner.getCompanyId());
        room.setCreatedBy(owner);
        ChatRoom savedRoom = chatRoomRepo.save(room);

        // Add owner as OWNER
        ChatRoomMember ownerMember = new ChatRoomMember();
        ownerMember.setRoom(savedRoom);
        ownerMember.setUser(owner);
        ownerMember.setRole("OWNER");
        chatRoomMemberRepo.save(ownerMember);

        // Add other members
        if (memberIds != null) {
            for (Long id : memberIds) {
                if (id.equals(owner.getId())) continue;
                User user = userRepo.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng ID: " + id));
                if (owner.getCompanyId().equals(user.getCompanyId())) {
                    ChatRoomMember member = new ChatRoomMember();
                    member.setRoom(savedRoom);
                    member.setUser(user);
                    member.setRole("MEMBER");
                    chatRoomMemberRepo.save(member);
                }
            }
        }

        return convertToChatRoomDto(savedRoom, owner);
    }

    @Transactional
    public void addGroupMembers(User actor, Long roomId, List<Long> userIds) {
        ChatRoom room = chatRoomRepo.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng chat."));
        if (!"GROUP".equals(room.getType())) {
            throw new IllegalArgumentException("Chỉ có thể thêm thành viên vào nhóm chat.");
        }

        ChatRoomMember actorMember = chatRoomMemberRepo.findByRoomIdAndUserId(roomId, actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bạn không phải thành viên của nhóm này."));

        if (!"OWNER".equals(actorMember.getRole()) && !"ADMIN".equals(actorMember.getRole())) {
            throw new IllegalArgumentException("Chỉ Quản trị viên nhóm mới được thêm thành viên.");
        }

        for (Long id : userIds) {
            if (chatRoomMemberRepo.existsByRoomIdAndUserId(roomId, id)) continue;
            User user = userRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
            if (room.getCompanyId().equals(user.getCompanyId())) {
                ChatRoomMember m = new ChatRoomMember();
                m.setRoom(room);
                m.setUser(user);
                m.setRole("MEMBER");
                chatRoomMemberRepo.save(m);
            }
        }
    }

    @Transactional
    public void removeGroupMember(User actor, Long roomId, Long userId) {
        ChatRoom room = chatRoomRepo.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng chat."));
        if (!"GROUP".equals(room.getType())) {
            throw new IllegalArgumentException("Không thể thực hiện tác vụ này.");
        }

        ChatRoomMember actorMember = chatRoomMemberRepo.findByRoomIdAndUserId(roomId, actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bạn không phải thành viên của nhóm này."));
        ChatRoomMember targetMember = chatRoomMemberRepo.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không thuộc nhóm chat."));

        boolean canRemove = false;
        if (actor.getId().equals(userId)) {
            // Self leave
            if ("OWNER".equals(actorMember.getRole())) {
                throw new IllegalArgumentException("Trưởng nhóm không thể rời nhóm trước khi chuyển nhượng quyền Trưởng nhóm.");
            }
            canRemove = true;
        } else {
            // Kick member
            if ("OWNER".equals(actorMember.getRole())) {
                canRemove = true;
            } else if ("ADMIN".equals(actorMember.getRole())) {
                canRemove = !"OWNER".equals(targetMember.getRole()) && !"ADMIN".equals(targetMember.getRole());
            }
        }

        if (!canRemove) {
            throw new IllegalArgumentException("Bạn không có quyền xóa thành viên này.");
        }

        chatRoomMemberRepo.deleteByRoomIdAndUserId(roomId, userId);
    }

    @Transactional
    public void updateGroupMemberRole(User actor, Long roomId, Long userId, String newRole) {
        ChatRoom room = chatRoomRepo.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng chat."));
        if (!"GROUP".equals(room.getType())) {
            throw new IllegalArgumentException("Không thể thực hiện tác vụ này.");
        }

        ChatRoomMember actorMember = chatRoomMemberRepo.findByRoomIdAndUserId(roomId, actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bạn không phải thành viên của nhóm này."));
        ChatRoomMember targetMember = chatRoomMemberRepo.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không thuộc nhóm chat."));

        if (!"OWNER".equals(actorMember.getRole())) {
            throw new IllegalArgumentException("Chỉ Trưởng nhóm mới có quyền thay đổi quyền hạn.");
        }

        if (actor.getId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không thể tự thay đổi quyền hạn của mình.");
        }

        if ("OWNER".equals(newRole)) {
            // Transfer Owner role
            targetMember.setRole("OWNER");
            actorMember.setRole("ADMIN");
            chatRoomMemberRepo.save(targetMember);
            chatRoomMemberRepo.save(actorMember);
        } else if ("ADMIN".equals(newRole) || "MEMBER".equals(newRole)) {
            targetMember.setRole(newRole);
            chatRoomMemberRepo.save(targetMember);
        } else {
            throw new IllegalArgumentException("Quyền hạn không hợp lệ.");
        }
    }

    @Transactional
    public void updateGroupName(User actor, Long roomId, String newName) {
        ChatRoom room = chatRoomRepo.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng chat."));
        if (!"GROUP".equals(room.getType())) {
            throw new IllegalArgumentException("Tác vụ chỉ áp dụng cho nhóm chat.");
        }

        ChatRoomMember actorMember = chatRoomMemberRepo.findByRoomIdAndUserId(roomId, actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bạn không phải thành viên của nhóm này."));

        if (!"OWNER".equals(actorMember.getRole()) && !"ADMIN".equals(actorMember.getRole())) {
            throw new IllegalArgumentException("Bạn không có quyền sửa đổi thông tin nhóm.");
        }

        room.setName(newName);
        chatRoomRepo.save(room);
    }

    public List<ChatMessageDto> getRoomMessages(Long roomId, User currentUser) {
        verifyUserAccessToRoom(roomId, currentUser);
        List<ChatMessage> list = chatMessageRepo.findByRoomIdOrderBySentAtAsc(roomId);
        List<ChatMessageDto> dtos = new ArrayList<>();
        for (ChatMessage m : list) {
            dtos.add(convertToChatMessageDto(m));
        }
        return dtos;
    }

    public List<ChatMessageDto> searchRoomMessages(Long roomId, String keyword, User currentUser) {
        verifyUserAccessToRoom(roomId, currentUser);
        List<ChatMessage> list = chatMessageRepo.searchMessages(roomId, keyword);
        List<ChatMessageDto> dtos = new ArrayList<>();
        for (ChatMessage m : list) {
            dtos.add(convertToChatMessageDto(m));
        }
        return dtos;
    }

    @Transactional
    public ChatMessageDto saveMessage(Long roomId, User sender, String message, 
                                      String url, String name, String type, Long size) {
        ChatRoom room = verifyUserAccessToRoom(roomId, sender);
        ChatMessage msg = new ChatMessage();
        msg.setRoom(room);
        msg.setSender(sender);
        msg.setMessage(message);
        msg.setAttachmentUrl(url);
        msg.setAttachmentName(name);
        msg.setAttachmentType(type);
        msg.setAttachmentSize(size);
        msg.setIsRecalled(false);
        
        ChatMessage saved = chatMessageRepo.save(msg);
        return convertToChatMessageDto(saved);
    }

    @Transactional
    public ChatMessageDto recallMessage(Long messageId, User currentUser) {
        ChatMessage msg = chatMessageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tin nhắn."));

        if (!msg.getSender().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Bạn chỉ có thể thu hồi tin nhắn của chính mình.");
        }

        msg.setIsRecalled(true);
        msg.setMessage("Tin nhắn đã bị thu hồi");
        ChatMessage saved = chatMessageRepo.save(msg);
        return convertToChatMessageDto(saved);
    }

    @Transactional
    public void markAsSeen(Long roomId, User currentUser) {
        List<ChatMessage> list = chatMessageRepo.findByRoomIdOrderBySentAtAsc(roomId);
        boolean changed = false;
        for (ChatMessage m : list) {
            if (!m.getSender().getId().equals(currentUser.getId()) && m.getSeenAt() == null) {
                m.setSeenAt(LocalDateTime.now());
                chatMessageRepo.save(m);
                changed = true;
            }
        }
    }

    private ChatRoom verifyUserAccessToRoom(Long roomId, User user) {
        ChatRoom room = chatRoomRepo.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng chat."));

        if (!room.getCompanyId().equals(user.getCompanyId())) {
            throw new IllegalArgumentException("Không tìm thấy phòng chat.");
        }

        if ("PROJECT".equals(room.getType())) {
            Project project = room.getProject();
            if (project != null) {
                boolean isManager = project.getManager() != null && project.getManager().getId().equals(user.getId());
                boolean isMember = projectMemberRepo.findByProjectId(project.getId()).stream()
                        .anyMatch(pm -> pm.getUser().getId().equals(user.getId()));
                if (!isManager && !isMember) {
                    throw new IllegalArgumentException("Bạn không thuộc dự án này để truy cập phòng chat.");
                }
            }
        } else if ("DEPARTMENT".equals(room.getType())) {
            if (user.getDepartment() == null || !user.getDepartment().getId().equals(room.getDepartment().getId())) {
                throw new IllegalArgumentException("Bạn không thuộc phòng ban này để truy cập phòng chat.");
            }
        } else if ("COMPANY".equals(room.getType())) {
            // Already verified room.getCompanyId().equals(user.getCompanyId())
        } else {
            boolean isMember = chatRoomMemberRepo.existsByRoomIdAndUserId(roomId, user.getId());
            if (!isMember) {
                throw new IllegalArgumentException("Bạn không được phép truy cập phòng chat này.");
            }
        }
        return room;
    }
}
