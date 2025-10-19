package com.bamikahub.inventorysystem.models.reporting;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tracks report generation history for audit and governance purposes.
 */
@Entity
@Table(name = "report_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String reportType;

    @Column(nullable = false)
    private String reportName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_id")
    private User generatedBy;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    private String exportFormat; // CSV, EXCEL, PDF

    @Column(columnDefinition = "TEXT")
    private String filterParameters; // JSON string of applied filters

    private Integer recordCount;

    private String status; // SUCCESS, FAILED

    private String version; // Report version/timestamp
}
