package com.quanlydn.service;

import com.quanlydn.dto.CreateProjectDto;
import com.quanlydn.dto.ProjectDto;
import com.quanlydn.entity.Project;
import com.quanlydn.entity.ProjectMember;
import com.quanlydn.entity.User;
import com.quanlydn.repository.ProjectMemberRepo;
import com.quanlydn.repository.ProjectRepo;
import com.quanlydn.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepo projectRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ProjectMemberRepo projectMemberRepo;

    @Autowired
    private com.quanlydn.repository.TaskRepo taskRepo;

    @Autowired
    private FriendshipService friendshipService;

    public List<ProjectDto> getAllProjects() {
        User contextUser = com.quanlydn.util.SecurityUtil.getCurrentUser();
        List<Project> projects;

        if (contextUser == null) {
            projects = projectRepo.findAll();
        } else {
            // Re-fetch from DB to avoid LazyInitializationException on Role proxy
            User currentUser = userRepo.findById(contextUser.getId())
                    .orElse(contextUser);

            Long companyId = currentUser.getCompanyId();
            String roleName = "Employee";
            try {
                if (currentUser.getRole() != null) {
                    roleName = currentUser.getRole().getName();
                }
            } catch (Exception ignored) {}

            if ("Admin".equalsIgnoreCase(roleName)) {
                projects = projectRepo.findByCompanyId(companyId);
            } else if ("Manager".equalsIgnoreCase(roleName)) {
                List<Project> managed = projectRepo.findByCompanyIdAndManagerId(companyId, currentUser.getId());
                List<Project> memberOf = projectMemberRepo.findByUserId(currentUser.getId()).stream()
                        .map(ProjectMember::getProject)
                        .filter(p -> p != null && companyId.equals(p.getCompanyId()))
                        .toList();
                Set<Project> all = new LinkedHashSet<>(managed);
                all.addAll(memberOf);
                projects = new ArrayList<>(all);
            } else { // Employee
                projects = projectMemberRepo.findByUserId(currentUser.getId()).stream()
                        .map(ProjectMember::getProject)
                        .filter(p -> p != null && companyId.equals(p.getCompanyId()))
                        .toList();
            }
        }

        return projects.stream()
                .map(this::toDto)
                .toList();
    }

    public ProjectDto getProjectById(Long id) {
        Project project = projectRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy project với id: " + id));

        return toDto(project);
    }

    public ProjectDto createProject(CreateProjectDto dto, Long createdByUserId) {
        User creator = userRepo.findById(createdByUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id: " + createdByUserId));

        Project project = new Project();
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setStatus("active");
        project.setCreatedBy(creator);
        project.setCompanyId(creator.getCompanyId());

        
        if (dto.getManagerId() != null) {
            User manager = userRepo.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy trưởng dự án với id: " + dto.getManagerId()));
            project.setManager(manager);
        }
        project.setRoadmap(dto.getRoadmap());
        project.setNotes(dto.getNotes());

        Project saved = projectRepo.save(project);
        return toDto(saved);
    }

    public ProjectDto updateProject(Long id, CreateProjectDto dto) {
        Project project = projectRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy project với id: " + id));

        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        
        if (dto.getManagerId() != null) {
            User manager = userRepo.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy trưởng dự án với id: " + dto.getManagerId()));
            project.setManager(manager);
        } else {
            project.setManager(null);
        }
        project.setRoadmap(dto.getRoadmap());
        project.setNotes(dto.getNotes());

        Project saved = projectRepo.save(project);
        return toDto(saved);
    }

    public void updateStatus(Long id, String status) {
        Project project = projectRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy project với id: " + id));

        project.setStatus(status);
        projectRepo.save(project);
    }

    public void deleteProject(Long id) {
        if (!projectRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy project với id: " + id);
        }
        projectRepo.deleteById(id);
    }

    private ProjectDto toDto(Project project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setStatus(project.getStatus());

        if (project.getCreatedBy() != null) {
            dto.setCreatedByName(project.getCreatedBy().getFullname());
        }

        if (project.getManager() != null) {
            dto.setManagerId(project.getManager().getId());
            dto.setManagerName(project.getManager().getFullname());
        }
        dto.setRoadmap(project.getRoadmap());
        dto.setNotes(project.getNotes());

        // Calculate actual task counts and progress
        try {
            List<com.quanlydn.entity.Task> tasks = taskRepo.findByProjectId(project.getId());
            int total = tasks.size();
            int completed = (int) tasks.stream().filter(t -> "completed".equalsIgnoreCase(t.getStatus())).count();
            int prog = total > 0 ? (completed * 100) / total : 0;

            dto.setTaskCount(total);
            dto.setTaskCompleted(completed);
            dto.setProgress(prog);
        } catch (Exception e) {
            dto.setTaskCount(0);
            dto.setTaskCompleted(0);
            dto.setProgress(0);
        }

        // Fetch actual project members
        List<com.quanlydn.dto.UserDto> memberDtos = new ArrayList<>();
        try {
            List<ProjectMember> pmList = projectMemberRepo.findByProjectId(project.getId());
            for (ProjectMember pm : pmList) {
                memberDtos.add(friendshipService.convertToUserDto(pm.getUser()));
            }
        } catch (Exception ignored) {}
        dto.setMembers(memberDtos);

        return dto;
    }
}
