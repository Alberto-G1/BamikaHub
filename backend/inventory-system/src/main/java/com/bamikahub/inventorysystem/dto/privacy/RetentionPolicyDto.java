package com.bamikahub.inventorysystem.dto.privacy;

import com.bamikahub.inventorysystem.models.privacy.RetentionPolicy;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RetentionPolicyDto {
    private Long id;
    private String dataType;
    private int retentionPeriodDays;
    private String description;
    private String legalBasis;
    private boolean isActive;
    private boolean autoDelete;
    private boolean notifyBeforeDeletion;
    private Integer notificationDaysBefore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastExecutionDate;
    private Integer recordsDeletedLastRun;

    public static RetentionPolicyDto fromEntity(RetentionPolicy policy) {
        return new RetentionPolicyDto(
            policy.getId(),
            policy.getDataType(),
            policy.getRetentionPeriodDays(),
            policy.getDescription(),
            policy.getLegalBasis(),
            policy.isActive(),
            policy.isAutoDelete(),
            policy.isNotifyBeforeDeletion(),
            policy.getNotificationDaysBefore(),
            policy.getCreatedAt(),
            policy.getUpdatedAt(),
            policy.getLastExecutionDate(),
            policy.getRecordsDeletedLastRun()
        );
    }
}
