package com.quanlydn.service;

import com.quanlydn.dto.CreateProjectDto;
import com.quanlydn.dto.ProjectDto;
import com.quanlydn.entity.Project;
import com.quanlydn.entity.User;
import com.quanlydn.repository.ProjectRepo;
import com.quanlydn.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepo projectRepo;

    @Autowired
    private UserRepo userRepo;

    public List<ProjectDto> getAllProjects() {
        List<Project> projects = projectRepo.findAll();

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

        return dto;
    }
}
