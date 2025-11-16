package com.bamikahub.inventorysystem.models.privacy;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "privacy_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivacySettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Data sharing preferences
    @Column(name = "profile_visible")
    private boolean profileVisible = true;

    @Column(name = "activity_visible")
    private boolean activityVisible = true;

    @Column(name = "statistics_visible")
    private boolean statisticsVisible = false;

    // Cookie preferences
    @Column(name = "essential_cookies")
    private boolean essentialCookies = true;

    @Column(name = "analytics_cookies")
    private boolean analyticsCookies = false;

    @Column(name = "marketing_cookies")
    private boolean marketingCookies = false;

    @Column(name = "functional_cookies")
    private boolean functionalCookies = false;

    // Data retention preferences
    @Column(name = "auto_delete_old_data")
    private boolean autoDeleteOldData = false;

    @Column(name = "data_retention_days")
    private int dataRetentionDays = 365;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PreUpdate
    @PrePersist
    public void updateTimestamp() {
        this.lastUpdated = LocalDateTime.now();
    }
}