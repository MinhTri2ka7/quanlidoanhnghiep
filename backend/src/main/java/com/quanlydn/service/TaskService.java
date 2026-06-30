package com.quanlydn.service;

import com.quanlydn.dto.CreateTaskDto;
import com.quanlydn.dto.TaskDto;
import com.quanlydn.entity.Project;
import com.quanlydn.entity.Task;
import com.quanlydn.entity.User;
import com.quanlydn.repository.ProjectRepo;
import com.quanlydn.repository.TaskRepo;
import com.quanlydn.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRepo taskRepo;

    @Autowired
    private ProjectRepo projectRepo;

    @Autowired
    private UserRepo userRepo;

    public List<TaskDto> getAllTasks() {
        Long companyId = com.quanlydn.util.SecurityUtil.getCurrentCompanyId();
        List<Task> tasks;
        if (companyId != null) {
            tasks = taskRepo.findByCompanyId(companyId);
        } else {
            tasks = taskRepo.findAll();
        }

        return tasks.stream()
                .map(this::toDto)
                .toList();
    }

    public List<TaskDto> getTasksByProject(Long projectId) {
        List<Task> tasks = taskRepo.findByProjectId(projectId);

        return tasks.stream()
                .map(this::toDto)
                .toList();
    }

    public List<TaskDto> getTasksByUser(Long userId) {
        List<Task> tasks = taskRepo.findByAssignedToId(userId);

        return tasks.stream()
                .map(this::toDto)
                .toList();
    }

    public TaskDto getTaskById(Long id) {
        Task task = taskRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy task với id: " + id));

        return toDto(task);
    }

    public TaskDto createTask(CreateTaskDto dto, Long createdByUserId) {
        User creator = userRepo.findById(createdByUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id: " + createdByUserId));

        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setPriority(dto.getPriority());
        task.setDeadline(dto.getDeadline());
        task.setStatus("todo");
        task.setCreatedBy(creator);
        task.setCompanyId(creator.getCompanyId());

        if (dto.getProjectId() != null) {
            Project project = projectRepo.findById(dto.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy project với id: " + dto.getProjectId()));
            task.setProject(project);
        }

        if (dto.getAssignedToId() != null) {
            User assignee = userRepo.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id: " + dto.getAssignedToId()));
            task.setAssignedTo(assignee);
        }

        Task saved = taskRepo.save(task);
        return toDto(saved);
    }

    public void updateStatus(Long id, String status) {
        Task task = taskRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy task với id: " + id));

        task.setStatus(status);
        taskRepo.save(task);
    }

    public void deleteTask(Long id) {
        if (!taskRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy task với id: " + id);
        }
        taskRepo.deleteById(id);
    }

    private TaskDto toDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setPriority(task.getPriority());
        dto.setDeadline(task.getDeadline());

        if (task.getProject() != null) {
            dto.setProjectName(task.getProject().getName());
        }
        if (task.getAssignedTo() != null) {
            dto.setAssignedToName(task.getAssignedTo().getFullname());
            dto.setAssignedToId(task.getAssignedTo().getId());
        }
        if (task.getCreatedBy() != null) {
            dto.setCreatedByName(task.getCreatedBy().getFullname());
        }

        return dto;
    }
}
