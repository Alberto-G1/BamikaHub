package com.bamikahub.inventorysystem.models.security;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "security_alerts")
public class SecurityAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50, nullable = false)
    private String alertType;

    @Column(length = 500, nullable = false)
    private String message;

    @Column(length = 20, nullable = false)
    private String severity = "MEDIUM";

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 100)
    private String location;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean acknowledged = false;

    @UpdateTimestamp
    private LocalDateTime acknowledgedAt;

    @Column(length = 100)
    private String acknowledgedBy;
}