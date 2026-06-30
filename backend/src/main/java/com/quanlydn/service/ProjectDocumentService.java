package com.quanlydn.service;

import com.quanlydn.dto.ProjectDocumentDto;
import com.quanlydn.entity.Project;
import com.quanlydn.entity.ProjectDocument;
import com.quanlydn.entity.User;
import com.quanlydn.repository.ProjectDocumentRepo;
import com.quanlydn.repository.ProjectRepo;
import com.quanlydn.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProjectDocumentService {

    @Autowired
    private ProjectDocumentRepo projectDocumentRepo;

    @Autowired
    private ProjectRepo projectRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private AwsS3Service awsS3Service;

    /**
     * Uploads project file to S3 and records metadata in database
     */
    public ProjectDocumentDto uploadDocument(Long projectId, MultipartFile file, Long userId) throws IOException {
        Optional<Project> projectOpt = projectRepo.findById(projectId);
        if (projectOpt.isEmpty()) {
            throw new RuntimeException("Dự án không tồn tại");
        }

        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Người dùng không tồn tại");
        }

        // Upload to S3
        String fileUrl = awsS3Service.uploadFile(file);

        // Save metadata to database
        ProjectDocument doc = new ProjectDocument();
        doc.setName(file.getOriginalFilename());
        doc.setFileUrl(fileUrl);
        doc.setFileSize(file.getSize());
        doc.setFileType(file.getContentType());
        doc.setProject(projectOpt.get());
        doc.setUploadedBy(userOpt.get());

        ProjectDocument savedDoc = projectDocumentRepo.save(doc);
        return mapToDto(savedDoc);
    }

    /**
     * Retrieves all documents of a project
     */
    public List<ProjectDocumentDto> getDocumentsByProject(Long projectId) {
        List<ProjectDocument> docs = projectDocumentRepo.findByProjectId(projectId);
        return docs.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Deletes a document from both S3 and database
     */
    public void deleteDocument(Long documentId) {
        Optional<ProjectDocument> docOpt = projectDocumentRepo.findById(documentId);
        if (docOpt.isPresent()) {
            ProjectDocument doc = docOpt.get();
            // Delete from S3
            awsS3Service.deleteFileByUrl(doc.getFileUrl());
            // Delete from DB
            projectDocumentRepo.delete(doc);
        } else {
            throw new RuntimeException("Tài liệu không tồn tại");
        }
    }

    private ProjectDocumentDto mapToDto(ProjectDocument doc) {
        ProjectDocumentDto dto = new ProjectDocumentDto();
        dto.setId(doc.getId());
        dto.setName(doc.getName());
        dto.setFileUrl(doc.getFileUrl());
        dto.setFileSize(doc.getFileSize());
        dto.setFileType(doc.getFileType());
        dto.setUploadedAt(doc.getUploadedAt());
        dto.setProjectId(doc.getProject() != null ? doc.getProject().getId() : null);

        if (doc.getUploadedBy() != null) {
            dto.setUploadedById(doc.getUploadedBy().getId());
            dto.setUploadedByName(doc.getUploadedBy().getFullname());
        }
        return dto;
    }
}
