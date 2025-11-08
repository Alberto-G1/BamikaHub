package com.bamikahub.inventorysystem.models.assignment;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "assignment_activities")
public class AssignmentActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer weight = 1; // kept for compatibility; progress share is auto-distributed equally

    @Column(nullable = false)
    private Integer orderIndex = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityStatus status = ActivityStatus.PENDING;

    @Column(nullable = false)
    private Boolean locked = false; // locked after evidence submission

    @Enumerated(EnumType.STRING)
    private EvidenceType evidenceType; // FILE or REPORT

    private String evidenceFilePath;

    @Column(columnDefinition = "TEXT")
    private String evidenceReport;

    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_id")
    private User completedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum ActivityStatus { PENDING, COMPLETED, REOPENED }
    public enum EvidenceType { FILE, REPORT }
}
