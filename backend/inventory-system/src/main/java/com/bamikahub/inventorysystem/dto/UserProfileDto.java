package com.bamikahub.inventorysystem.dto;

import com.bamikahub.inventorysystem.models.User;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UserProfileDto {
    // Personal Info
    private String firstName;
    private String lastName;
    private String gender;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String address;
    private String city;
    private String country;
    private String profilePictureUrl;

    // Account Info (read-only)
    private String username;
    private String email;
    private String roleName;
    private String statusName;
    private LocalDateTime joinedOn;
    private LocalDateTime lastLoginAt;

    public static UserProfileDto fromEntity(User user) {
        UserProfileDto dto = new UserProfileDto();
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setGender(user.getGender() != null ? user.getGender().name() : null);
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setAddress(user.getAddress());
        dto.setCity(user.getCity());
        dto.setCountry(user.getCountry());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRoleName(user.getRole().getName());
        dto.setStatusName(user.getStatus().getName());
        dto.setJoinedOn(user.getCreatedAt());
        dto.setLastLoginAt(user.getLastLoginAt());
        return dto;
    }
}