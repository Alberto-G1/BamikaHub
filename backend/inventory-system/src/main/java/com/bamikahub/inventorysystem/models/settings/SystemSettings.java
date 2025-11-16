package com.bamikahub.inventorysystem.models.settings;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "system_settings")
public class SystemSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String companyName;

    @Column(length = 255)
    private String companyLogo;

    @Column(length = 100)
    private String companyEmail;

    @Column(length = 20)
    private String companyPhone;

    @Column(length = 255)
    private String companyAddress;

    @Column(length = 50, nullable = false)
    private String timezone = "UTC";

    @Column(length = 10, nullable = false)
    private String currency = "USD";

    @Column(length = 10, nullable = false)
    private String language = "en";

    @Column(nullable = false)
    private boolean emailNotificationsEnabled = true;

    @Column(nullable = false)
    private boolean smsNotificationsEnabled = false;

    @Column(nullable = false)
    private boolean pushNotificationsEnabled = true;

    @Column(nullable = false)
    private int sessionTimeoutMinutes = 30;

    @Column(nullable = false)
    private int maxLoginAttempts = 5;

    @Column(nullable = false)
    private boolean twoFactorAuthRequired = false;

    @Column(nullable = false)
    private boolean maintenanceMode = false;

    @Column(length = 500)
    private String maintenanceMessage;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(length = 100)
    private String updatedBy;
}