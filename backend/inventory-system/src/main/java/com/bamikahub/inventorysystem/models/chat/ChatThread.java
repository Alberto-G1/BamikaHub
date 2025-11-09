package com.bamikahub.inventorysystem.models.chat;

import com.bamikahub.inventorysystem.models.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_threads")
public class ChatThread {

    public enum ThreadType {
        PRIVATE,
        GENERAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ThreadType type;

    @Column(length = 120)
    private String subject;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "chat_thread_participants",
            joinColumns = @JoinColumn(name = "thread_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    @Builder.Default
    private Set<User> participants = new HashSet<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime lastMessageAt;

    public boolean isPrivateThread() {
        return ThreadType.PRIVATE.equals(type);
    }

    public boolean isGeneralThread() {
        return ThreadType.GENERAL.equals(type);
    }
}
