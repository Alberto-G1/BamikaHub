package com.bamikahub.inventorysystem.dto.user;

import lombok.Data;

import java.util.Set;

@Data
public class RoleRequest {
    private String name;
    private Set<Integer> permissionIds;
}