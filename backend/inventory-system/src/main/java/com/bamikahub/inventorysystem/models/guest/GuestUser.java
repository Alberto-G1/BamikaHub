package com.bamikahub.inventorysystem.models.guest;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents an externally managed guest account that can access the portal.
 */
@Entity
@Table(name = "guest_users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(nullable = false, length = 32)
    private String phoneNumber;

    @Column(length = 160)
    private String companyName;

    @Column(length = 120)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private GuestAccountStatus status;

    @Column(nullable = false)
    private boolean emailVerified;

    @Column(length = 64)
    private String verificationToken;

    private LocalDateTime verifiedAt;

    private LocalDateTime magicTokenExpiresAt;

    private LocalDateTime lastLoginAt;

    @Column(length = 64)
    private String pendingApprovalBy; // staff username/email captured during manual approval

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "guest", cascade = CascadeType.ALL, orphanRemoval = false, fetch = FetchType.LAZY)
    @Builder.Default
    private List<GuestTicket> tickets = new ArrayList<>();

    public void addTicket(GuestTicket ticket) {
        ticket.setGuest(this);
        this.tickets.add(ticket);
    }

    public void markVerified(String issuedBy) {
        this.emailVerified = true;
        this.verifiedAt = LocalDateTime.now();
        this.pendingApprovalBy = issuedBy;
        this.verificationToken = null;
        this.magicTokenExpiresAt = null;
    }

    public void markPendingApproval(String issuedBy) {
        this.status = GuestAccountStatus.PENDING_APPROVAL;
        this.pendingApprovalBy = issuedBy;
    }

    public void markActive() {
        this.status = GuestAccountStatus.ACTIVE;
        this.pendingApprovalBy = null;
    }

    public void markSuspended(String issuedBy) {
        this.status = GuestAccountStatus.SUSPENDED;
        this.pendingApprovalBy = issuedBy;
    }

    public void markDeactivated(String issuedBy) {
        this.status = GuestAccountStatus.DEACTIVATED;
        this.pendingApprovalBy = issuedBy;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = GuestAccountStatus.PENDING_APPROVAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void issueVerificationToken(String token, LocalDateTime expiresAt) {
        this.verificationToken = token;
        this.magicTokenExpiresAt = expiresAt;
    }

    public boolean isVerificationTokenValid(String token) {
        if (token == null || this.verificationToken == null) {
            return false;
        }
        if (!this.verificationToken.equals(token)) {
            return false;
        }
        return this.magicTokenExpiresAt == null || this.magicTokenExpiresAt.isAfter(LocalDateTime.now());
    }

    public void recordLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }
}
