package com.bamikahub.inventorysystem.dto.privacy;

import com.bamikahub.inventorysystem.models.privacy.DataRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DataRequestDto {
    private Long id;
    private String requestType;
    private String status;
    private String reason;
    private LocalDateTime requestDate;
    private LocalDateTime processedDate;
    private LocalDateTime completedDate;
    private String processedBy;
    private String filePath;
    private String rejectionReason;
    private boolean isVerified;
    private boolean isOverdue;
    private String userEmail;

    public static DataRequestDto fromEntity(DataRequest request) {
        return new DataRequestDto(
            request.getId(),
            request.getRequestType(),
            request.getStatus(),
            request.getReason(),
            request.getRequestDate(),
            request.getProcessedDate(),
            request.getCompletedDate(),
            request.getProcessedBy(),
            request.getFilePath(),
            request.getRejectionReason(),
            request.isVerified(),
            request.isOverdue(),
            request.getUser() != null ? request.getUser().getEmail() : null
        );
    }
}
