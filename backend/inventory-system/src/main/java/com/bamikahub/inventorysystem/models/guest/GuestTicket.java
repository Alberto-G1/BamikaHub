package com.bamikahub.inventorysystem.models.guest;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
 * Represents a support ticket submitted by a guest user.
 */
@Entity
@Table(name = "guest_tickets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_id", nullable = false)
    private GuestUser guest;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private GuestTicketStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    @ElementCollection
    @CollectionTable(name = "guest_ticket_attachments", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "file_path", length = 255)
    @Builder.Default
    private List<String> attachmentPaths = new ArrayList<>();

    private LocalDateTime dueAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime lastMessageAt;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<GuestTicketMessage> messages = new ArrayList<>();

    public void markStatus(GuestTicketStatus nextStatus) {
        this.status = nextStatus;
        this.updatedAt = LocalDateTime.now();
    }

    public void touchConversation() {
        this.lastMessageAt = LocalDateTime.now();
        this.updatedAt = this.lastMessageAt;
    }

    public void addMessage(GuestTicketMessage message) {
        message.setTicket(this);
        this.messages.add(message);
        touchConversation();
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        this.lastMessageAt = now;
        if (this.status == null) {
            this.status = GuestTicketStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
