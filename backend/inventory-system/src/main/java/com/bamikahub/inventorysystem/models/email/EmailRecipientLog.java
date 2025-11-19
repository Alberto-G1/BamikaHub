package com.bamikahub.inventorysystem.models.email;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_recipient_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailRecipientLog {

    public enum Status {PENDING, SENT, FAILED}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "message_id")
    private EmailMessage emailMessage;

    @ManyToOne
    @JoinColumn(name = "recipient_id")
    private User recipient;

    private String recipientEmail;

    private Status status;

    private LocalDateTime attemptedAt;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;
}
