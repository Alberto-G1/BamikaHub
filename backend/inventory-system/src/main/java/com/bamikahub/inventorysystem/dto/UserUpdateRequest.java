package com.bamikahub.inventorysystem.dto;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private Integer roleId;
    private Integer statusId;
    private Integer version;
}