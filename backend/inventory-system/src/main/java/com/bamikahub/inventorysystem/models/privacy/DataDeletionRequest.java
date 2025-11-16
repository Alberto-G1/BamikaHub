package com.bamikahub.inventorysystem.models.privacy;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "data_deletion_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataDeletionRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "deletion_type", nullable = false)
    private String deletionType; // "ACCOUNT", "PERSONAL_DATA", "SPECIFIC_DATA"

    @ElementCollection
    @CollectionTable(
        name = "deletion_request_categories",
        joinColumns = @JoinColumn(name = "deletion_request_id")
    )
    @Column(name = "data_category")
    private List<String> dataCategories; // ["PROFILE", "ACTIVITY", "FILES", etc.]

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "status", nullable = false)
    private String status; // "PENDING", "APPROVED", "COMPLETED", "REJECTED"

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "processed_by")
    private String processedBy;

    @PrePersist
    public void prePersist() {
        if (this.requestedAt == null) {
            this.requestedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "PENDING";
        }
    }
}