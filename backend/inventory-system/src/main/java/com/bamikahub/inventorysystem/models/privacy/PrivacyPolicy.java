package com.bamikahub.inventorysystem.models.privacy;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "privacy_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivacyPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "version", nullable = false, unique = true)
    private String version;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "effective_date", nullable = false)
    private LocalDateTime effectiveDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_active")
    private boolean isActive = false;

    @Column(name = "requires_consent")
    private boolean requiresConsent = true;

    @Column(name = "created_by")
    private String createdBy;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.effectiveDate == null) {
            this.effectiveDate = LocalDateTime.now();
        }
    }
}