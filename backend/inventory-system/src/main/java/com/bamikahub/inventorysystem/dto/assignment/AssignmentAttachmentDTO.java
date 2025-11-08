package com.bamikahub.inventorysystem.dto.assignment;

import lombok.Data;

@Data
public class AssignmentAttachmentDTO {
    private Long id;
    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private Long uploadedBy;
    private String uploaderName;
    private String uploadedAt;
}
