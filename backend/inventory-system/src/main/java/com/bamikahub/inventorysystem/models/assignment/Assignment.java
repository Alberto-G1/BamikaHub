package com.bamikahub.inventorysystem.models.assignment;

import com.bamikahub.inventorysystem.models.user.User;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "assignments")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentPriority priority = AssignmentPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status = AssignmentStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime dueDate;

    @Column
    private LocalDateTime completedDate;

    @Column(nullable = false)
    private Integer progressPercentage = 0; // 0-100

    // Assignee (who the task is assigned to)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignee_id", nullable = false)
    private User assignee;

    // Assigner (who created/assigned the task)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigner_id", nullable = false)
    private User assigner;

    // Comments/Notes for the assignment
    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssignmentComment> comments = new ArrayList<>();

    // File attachments for proof of completion
    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssignmentAttachment> attachments = new ArrayList<>();

    // Activities checklist
    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC, id ASC")
    private List<AssignmentActivity> activities = new ArrayList<>();

    // Final report
    @OneToOne(mappedBy = "assignment", cascade = CascadeType.ALL)
    private AssignmentFinalReport finalReport;

    // Review/approval tracking
    private LocalDateTime reviewStartedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;

    // Controls whether progress 0-70 is auto-managed by activities
    @Column(nullable = false)
    private Boolean manualProgressAllowed = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Auto-detect overdue status
    @Transient
    public boolean isOverdue() {
        if (status == AssignmentStatus.COMPLETED || status == AssignmentStatus.CANCELLED || status == AssignmentStatus.UNDER_REVIEW) {
            return false;
        }
        return LocalDateTime.now().isAfter(dueDate);
    }

    // Calculate days remaining
    @Transient
    public long getDaysRemaining() {
        if (status == AssignmentStatus.COMPLETED || status == AssignmentStatus.CANCELLED) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), dueDate);
    }
}
