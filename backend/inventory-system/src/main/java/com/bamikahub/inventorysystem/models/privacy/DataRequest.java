package com.bamikahub.inventorysystem.models.privacy;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DataRequest Entity
 * Handles GDPR data subject requests (export, deletion, portability)
 */
@Entity
@Table(name = "data_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DataRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "request_type", nullable = false)
    private String requestType; // EXPORT, DELETE, PORTABILITY, RECTIFICATION

    @Column(name = "status", nullable = false)
    private String status; // PENDING, IN_PROGRESS, COMPLETED, REJECTED

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @Column(name = "completed_date")
    private LocalDateTime completedDate;

    @Column(name = "processed_by")
    private String processedBy;

    @Column(name = "file_path")
    private String filePath; // For export files

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "verification_code")
    private String verificationCode; // For email verification

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "notes", length = 2000)
    private String notes;

    @PrePersist
    protected void onCreate() {
        requestDate = LocalDateTime.now();
        status = "PENDING";
    }

    public void markInProgress(String processor) {
        this.status = "IN_PROGRESS";
        this.processedDate = LocalDateTime.now();
        this.processedBy = processor;
    }

    public void markCompleted(String filePath) {
        this.status = "COMPLETED";
        this.completedDate = LocalDateTime.now();
        this.filePath = filePath;
    }

    public void markRejected(String reason) {
        this.status = "REJECTED";
        this.completedDate = LocalDateTime.now();
        this.rejectionReason = reason;
    }

    public void verify() {
        this.isVerified = true;
    }

    public boolean isPending() {
        return "PENDING".equals(status);
    }

    public boolean isOverdue() {
        // GDPR requires response within 30 days
        return LocalDateTime.now().isAfter(requestDate.plusDays(30)) && !"COMPLETED".equals(status);
    }
}
