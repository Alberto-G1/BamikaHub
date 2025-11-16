package com.bamikahub.inventorysystem.models.privacy;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "consent_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsentRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "consent_type", nullable = false)
    private String consentType; // "PRIVACY_POLICY", "TERMS_OF_SERVICE", "MARKETING", etc.

    @Column(name = "consent_text", columnDefinition = "TEXT")
    private String consentText;

    @Column(name = "granted")
    private boolean granted;

    @Column(name = "granted_at")
    private LocalDateTime grantedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "consent_version")
    private String consentVersion;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;
}