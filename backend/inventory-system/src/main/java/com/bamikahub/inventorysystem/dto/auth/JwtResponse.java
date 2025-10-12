package com.bamikahub.inventorysystem.dto.auth;

import lombok.Data;
import java.util.List;

@Data
public class JwtResponse {
    private String token;
    private Long id;
    private String email;
    private String role;
    private String profilePictureUrl; // <-- ADD THIS
    private List<String> permissions;

    public JwtResponse(String token, Long id, String email, String role, String profilePictureUrl, List<String> permissions) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.role = role;
        this.profilePictureUrl = profilePictureUrl;
        this.permissions = permissions;
    }
}