package com.bamikahub.inventorysystem.models.privacy;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "data_export_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataExportRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "request_type", nullable = false)
    private String requestType; // "PERSONAL_DATA", "ACCOUNT_DATA", "ALL_DATA"

    @Column(name = "format", nullable = false)
    private String format; // "JSON", "CSV", "PDF"

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "status", nullable = false)
    private String status; // "PENDING", "PROCESSING", "COMPLETED", "FAILED"

    @Column(name = "download_url")
    private String downloadUrl;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

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