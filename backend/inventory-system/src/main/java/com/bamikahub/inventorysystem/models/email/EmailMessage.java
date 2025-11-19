package com.bamikahub.inventorysystem.models.email;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "email_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    private LocalDateTime createdAt;

    // recipients can be kept as a CSV or JSON string for basic listing
    @Column(columnDefinition = "TEXT")
    private String recipientsCsv;

    private String attachmentPaths; // comma-separated
}
