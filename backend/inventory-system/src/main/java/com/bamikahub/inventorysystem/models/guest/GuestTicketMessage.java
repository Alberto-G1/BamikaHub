package com.bamikahub.inventorysystem.models.guest;

import jakarta.persistence.CollectionTable;
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
import jakarta.persistence.PrePersist;
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
 * Represents an individual message exchanged within a guest ticket.
 */
@Entity
@Table(name = "guest_ticket_messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestTicketMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private GuestTicket ticket;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GuestMessageSender sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "guest_ticket_message_attachments", joinColumns = @JoinColumn(name = "message_id"))
    @Column(name = "file_path", length = 255)
    @Builder.Default
    private List<String> attachmentPaths = new ArrayList<>();

    @Builder.Default
    private boolean readByGuest = false;

    @Builder.Default
    private boolean readByStaff = false;

    private LocalDateTime createdAt;

    public void markReadByGuest() {
        this.readByGuest = true;
    }

    public void markReadByStaff() {
        this.readByStaff = true;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
