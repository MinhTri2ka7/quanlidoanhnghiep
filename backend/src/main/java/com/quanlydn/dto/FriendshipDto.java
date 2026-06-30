package com.quanlydn.dto;

import java.time.LocalDateTime;

public class FriendshipDto {

    private Long id;
    private String status; // PENDING, ACCEPTED, DECLINED
    private LocalDateTime createdAt;
    private UserDto friend;
    private Boolean isRequester;

    public FriendshipDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UserDto getFriend() {
        return friend;
    }

    public void setFriend(UserDto friend) {
        this.friend = friend;
    }

    public Boolean getIsRequester() {
        return isRequester;
    }

    public void setIsRequester(Boolean requester) {
        isRequester = requester;
    }
}
