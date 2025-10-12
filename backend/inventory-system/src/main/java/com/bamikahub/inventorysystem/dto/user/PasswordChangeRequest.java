package com.bamikahub.inventorysystem.dto.user;

import lombok.Data;

@Data
public class PasswordChangeRequest {
    private String currentPassword;
    private String newPassword;
}