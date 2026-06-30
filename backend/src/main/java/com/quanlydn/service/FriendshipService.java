package com.quanlydn.service;

import com.quanlydn.dto.FriendshipDto;
import com.quanlydn.dto.UserDto;
import com.quanlydn.entity.Friendship;
import com.quanlydn.entity.User;
import com.quanlydn.repository.FriendshipRepo;
import com.quanlydn.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FriendshipService {

    @Autowired
    private FriendshipRepo friendshipRepo;

    @Autowired
    private UserRepo userRepo;

    public UserDto convertToUserDto(User user) {
        if (user == null) return null;
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFullname(user.getFullname());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setAvatar(user.getAvatar());
        dto.setIsActive(user.getIsActive());
        try {
            if (user.getRole() != null) {
                dto.setRoleName(user.getRole().getName());
            }
        } catch (Exception ignored) {}
        try {
            if (user.getDepartment() != null) {
                dto.setDepartmentName(user.getDepartment().getName());
            }
        } catch (Exception ignored) {}
        dto.setIsTwoFactorEnabled(user.getIsTwoFactorEnabled());
        dto.setCompanyId(user.getCompanyId());
        return dto;
    }

    private FriendshipDto convertToFriendshipDto(Friendship f, User currentUser) {
        if (f == null) return null;
        FriendshipDto dto = new FriendshipDto();
        dto.setId(f.getId());
        dto.setStatus(f.getStatus());
        dto.setCreatedAt(f.getCreatedAt());
        
        boolean isRequester = f.getRequester().getId().equals(currentUser.getId());
        dto.setIsRequester(isRequester);
        
        User friend = isRequester ? f.getAddressee() : f.getRequester();
        dto.setFriend(convertToUserDto(friend));
        return dto;
    }

    public List<FriendshipDto> getFriends(User currentUser) {
        List<Friendship> friendships = friendshipRepo.findAcceptedFriendships(currentUser);
        List<FriendshipDto> dtos = new ArrayList<>();
        for (Friendship f : friendships) {
            dtos.add(convertToFriendshipDto(f, currentUser));
        }
        return dtos;
    }

    public List<FriendshipDto> getPendingRequests(User currentUser) {
        List<Friendship> requests = friendshipRepo.findPendingRequests(currentUser);
        List<FriendshipDto> dtos = new ArrayList<>();
        for (Friendship f : requests) {
            dtos.add(convertToFriendshipDto(f, currentUser));
        }
        return dtos;
    }

    @Transactional
    public FriendshipDto sendFriendRequest(User requester, String targetEmail) {
        Optional<User> targetOpt = userRepo.findByEmail(targetEmail);
        if (targetOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy người dùng với email này.");
        }
        User addressee = targetOpt.get();

        if (requester.getId().equals(addressee.getId())) {
            throw new IllegalArgumentException("Bạn không thể kết bạn với chính mình.");
        }

        // Validate same company context
        if (requester.getCompanyId() == null || !requester.getCompanyId().equals(addressee.getCompanyId())) {
            throw new IllegalArgumentException("Người dùng này thuộc công ty khác.");
        }

        Optional<Friendship> existing = friendshipRepo.findBetweenUsers(requester.getId(), addressee.getId());
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if ("ACCEPTED".equals(f.getStatus())) {
                throw new IllegalArgumentException("Hai bạn đã là bạn bè.");
            } else if ("PENDING".equals(f.getStatus())) {
                if (f.getRequester().getId().equals(requester.getId())) {
                    throw new IllegalArgumentException("Yêu cầu kết bạn đã gửi và đang chờ phản hồi.");
                } else {
                    // Auto accept if reverse request is pending
                    f.setStatus("ACCEPTED");
                    Friendship saved = friendshipRepo.save(f);
                    return convertToFriendshipDto(saved, requester);
                }
            } else {
                // If previously declined, resend request
                f.setStatus("PENDING");
                f.setRequester(requester);
                f.setAddressee(addressee);
                Friendship saved = friendshipRepo.save(f);
                return convertToFriendshipDto(saved, requester);
            }
        }

        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setAddressee(addressee);
        friendship.setStatus("PENDING");
        friendship.setCompanyId(requester.getCompanyId());
        
        Friendship saved = friendshipRepo.save(friendship);
        return convertToFriendshipDto(saved, requester);
    }

    @Transactional
    public FriendshipDto acceptRequest(User currentUser, Long requestId) {
        Optional<Friendship> opt = friendshipRepo.findById(requestId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy yêu cầu kết bạn.");
        }
        Friendship friendship = opt.get();

        if (!friendship.getAddressee().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Yêu cầu kết bạn này không gửi cho bạn.");
        }

        if (!"PENDING".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu kết bạn không ở trạng thái chờ.");
        }

        friendship.setStatus("ACCEPTED");
        Friendship saved = friendshipRepo.save(friendship);
        return convertToFriendshipDto(saved, currentUser);
    }

    @Transactional
    public FriendshipDto rejectRequest(User currentUser, Long requestId) {
        Optional<Friendship> opt = friendshipRepo.findById(requestId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy yêu cầu kết bạn.");
        }
        Friendship friendship = opt.get();

        if (!friendship.getAddressee().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Yêu cầu kết bạn này không gửi cho bạn.");
        }

        if (!"PENDING".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu kết bạn không ở trạng thái chờ.");
        }

        friendship.setStatus("DECLINED");
        Friendship saved = friendshipRepo.save(friendship);
        return convertToFriendshipDto(saved, currentUser);
    }

    public UserDto searchUserByEmail(User currentUser, String email) {
        Optional<User> targetOpt = userRepo.findByEmail(email);
        if (targetOpt.isEmpty()) {
            return null;
        }
        User target = targetOpt.get();
        if (currentUser.getCompanyId() != null && currentUser.getCompanyId().equals(target.getCompanyId())) {
            return convertToUserDto(target);
        }
        return null;
    }
}
