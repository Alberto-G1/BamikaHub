package com.bamikahub.inventorysystem.models.security;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "login_history")
public class LoginHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Column(length = 100)
    private String location;

    @Column(nullable = false)
    private boolean successful = true;

    @Column(length = 255)
    private String failureReason;

    @CreationTimestamp
    private LocalDateTime loginTime;

    @Column(length = 50)
    private String deviceType;

    @Column(length = 50)
    private String browser;

    @Column(length = 100)
    private String sessionId;
}