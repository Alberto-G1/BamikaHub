package com.bamikahub.inventorysystem.models.finance;

import com.bamikahub.inventorysystem.models.operations.Project;
import com.bamikahub.inventorysystem.models.user.User;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "requisitions")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Requisition {

    public enum RequisitionStatus {
        PENDING,
        APPROVED_BY_OPS,
        APPROVED_BY_FINANCE,
        REJECTED,
        FULFILLED,
        CLOSED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_user_id")
    private User requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequisitionStatus status;

    @Column(nullable = false)
    private LocalDate dateNeeded;

    @Lob
    private String justification;

    // Approval tracking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    private User approvedBy;

    private LocalDateTime approvedAt;

    private String approvalNotes;

    @Lob
    private String notesHistory;

    // One Requisition has many Items
    @OneToMany(mappedBy = "requisition", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<RequisitionItem> items;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // NEW FIELD: Tracks how many times a requisition has been submitted/resubmitted
    @Column(columnDefinition = "int default 1")
    private int submissionCount = 1;
}