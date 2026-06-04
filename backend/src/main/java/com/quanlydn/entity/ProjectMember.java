package com.quanlydn.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_members")
@IdClass(ProjectMemberId.class)
public class ProjectMember {

    @Id
    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    @Id
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @PrePersist
    public void prePersist() {
        joinedAt = LocalDateTime.now();
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
}
