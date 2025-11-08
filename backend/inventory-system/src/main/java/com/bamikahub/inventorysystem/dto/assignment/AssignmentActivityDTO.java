package com.bamikahub.inventorysystem.dto.assignment;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AssignmentActivityDTO {
    private Long id;
    private Long assignmentId;
    private String title;
    private String description;
    private Integer weight;
    private Integer orderIndex;
    private String status; // PENDING, COMPLETED, REOPENED
    private Boolean locked;
    private String evidenceType; // FILE, REPORT
    private String evidenceFilePath;
    private String evidenceReport;
    private Boolean evidenceSubmitted;
    private LocalDateTime evidenceSubmittedAt;
    private Long evidenceSubmittedById;
    private String evidenceSubmittedByName;
    private LocalDateTime completedAt;
    private Long completedById;
    private String completedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
