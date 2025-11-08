package com.bamikahub.inventorysystem.models.assignment;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "assignment_final_reports")
public class AssignmentFinalReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", unique = true, nullable = false)
    private Assignment assignment;

    @Column(columnDefinition = "TEXT")
    private String reportText;

    private String filePath;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id", nullable = false)
    private User submittedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FinalReportStatus status = FinalReportStatus.SUBMITTED;

    @Column(columnDefinition = "TEXT")
    private String reviewerComments;

    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    public enum FinalReportStatus { SUBMITTED, RETURNED, APPROVED }
}
