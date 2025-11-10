package com.bamikahub.inventorysystem.models.motivation;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "awards")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Award {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String achievementTitle;

    @Column(nullable = false, length = 500)
    private String achievementDescription;

    // Optional custom display image for Wall of Fame (fallback to user.profilePictureUrl)
    private String displayImageUrl;

    // Comma separated or stored via element collection for flexibility
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "award_badges", joinColumns = @JoinColumn(name = "award_id"))
    @Column(name = "badge")
    private List<String> badges;

    @Column(nullable = false)
    private Integer priority; // lower number means higher prominence

    @Column(nullable = false)
    private LocalDateTime awardDate;

    private LocalDateTime expiresAt; // auto archive when past

    @Column(nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
}
