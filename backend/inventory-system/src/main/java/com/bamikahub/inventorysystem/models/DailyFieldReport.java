package com.bamikahub.inventorysystem.models;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "daily_field_reports")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class DailyFieldReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User submittedBy;

    @Column(nullable = false)
    private LocalDate reportDate;

    @Lob
    @Column(nullable = false)
    private String workProgressUpdate; // Description of work done

    @Lob
    private String materialsUsed; // List of materials and quantities

    @Lob
    private String challengesFaced;

    private String weatherConditions;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}