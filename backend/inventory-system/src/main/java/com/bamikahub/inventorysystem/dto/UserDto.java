package com.bamikahub.inventorysystem.dto;

import com.bamikahub.inventorysystem.models.Role;
import com.bamikahub.inventorysystem.models.Status;
import com.bamikahub.inventorysystem.models.User;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private Status status;
    private Role role;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private String profilePictureUrl;
    private Integer version;

    public static UserDto fromEntity(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setStatus(user.getStatus());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        dto.setVersion(user.getVersion());
        return dto;
    }
}