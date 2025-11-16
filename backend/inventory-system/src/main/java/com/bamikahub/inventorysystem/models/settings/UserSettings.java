package com.bamikahub.inventorysystem.models.settings;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 20, nullable = false)
    private String theme = "light";

    @Column(length = 10, nullable = false)
    private String language = "en";

    @Column(nullable = false)
    private boolean emailNotifications = true;

    @Column(nullable = false)
    private boolean smsNotifications = false;

    @Column(nullable = false)
    private boolean pushNotifications = true;

    @Column(nullable = false)
    private boolean desktopNotifications = true;

    @Column(nullable = false)
    private int itemsPerPage = 25;

    @Column(length = 20, nullable = false)
    private String dateFormat = "MM/dd/yyyy";

    @Column(length = 20, nullable = false)
    private String timeFormat = "HH:mm";

    @Column(nullable = false)
    private boolean autoSaveEnabled = true;

    @Column(nullable = false)
    private int autoSaveIntervalMinutes = 5;

    @Column(nullable = false)
    private boolean showWelcomeMessage = true;

    @Column(nullable = false)
    private boolean compactView = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}